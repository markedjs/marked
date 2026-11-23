import { Marked } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('tokenizer extension position', () => {
  describe('block positions', () => {
    it('lets HTML take priority over a custom table extension positioned beforeTable (#3590)', () => {
      const customTableExt = {
        name: 'customTable',
        position: 'beforeTable',
        tokenizer(src) {
          const match = /^([^\n]+)\n\|:---:\|\n([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return {
              type: 'customTable',
              raw: match[0],
              header: match[1].trim(),
              cell: match[2].trim(),
            };
          }
        },
        renderer(token) {
          return `<custom-table data-header="${token.header}">${token.cell}</custom-table>\n`;
        },
      };

      const positioned = new Marked({ extensions: [customTableExt] });
      const htmlTableInput = '<div> header\n|:---:|\ncell\n';
      const plainTableInput = 'header\n|:---:|\ncell\n';

      // HTML runs before beforeTable, so HTML block wins
      assert.strictEqual(positioned.parse(htmlTableInput, { async: false }), htmlTableInput);
      // Plain non-HTML table matches customTable before default GFM table
      assert.strictEqual(
        positioned.parse(plainTableInput, { async: false }),
        '<custom-table data-header="header">cell</custom-table>\n',
      );

      // Contrast with default (unpositioned) level: 'block', which overrides HTML
      const unpositioned = new Marked({
        extensions: [{ ...customTableExt, position: undefined, level: 'block' }],
      });
      assert.strictEqual(
        unpositioned.parse(htmlTableInput, { async: false }),
        '<custom-table data-header="<div> header">cell</custom-table>\n',
      );
    });

    it('runs afterHeading / beforeHr after headings but before hr', () => {
      const ext = {
        name: 'banner',
        position: 'afterHeading',
        tokenizer(src) {
          const match = /^(?:---+|# [^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'banner', raw: match[0], text: match[0].trim() };
          }
        },
        renderer(token) {
          return `<banner>${token.text}</banner>\n`;
        },
      };

      const instance = new Marked({ extensions: [ext] });
      assert.strictEqual(instance.parse('# Title\n\n---\n', { async: false }), '<h1>Title</h1>\n<banner>---</banner>\n');
    });

    it('runs beforeParagraph with start() clipping so paragraphs do not swallow the extension', () => {
      const callout = {
        name: 'callout',
        position: 'beforeParagraph',
        start(src) {
          return src.indexOf('::');
        },
        tokenizer(src) {
          const match = /^::([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'callout', raw: match[0], text: match[1].trim() };
          }
        },
        renderer(token) {
          return `<aside>${token.text}</aside>\n`;
        },
      };

      const instance = new Marked({ extensions: [callout] });
      assert.strictEqual(
        instance.parse('Hello\n::note\nWorld', { async: false }),
        '<p>Hello</p>\n<aside>note</aside>\n<p>World</p>\n',
      );
    });

    it('runs afterParagraph / beforeBlockText only when top-level paragraph did not match', () => {
      const looseText = {
        name: 'customText',
        position: 'afterParagraph',
        tokenizer(src) {
          const match = /^!custom([^\n]*)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'customText', raw: match[0], text: match[1].trim() };
          }
        },
        renderer(token) {
          return `<custom>${token.text}</custom>`;
        },
      };

      const instance = new Marked({ extensions: [looseText] });
      // Top-level matches paragraph first
      assert.strictEqual(instance.parse('!custom top', { async: false }), '<p>!custom top</p>\n');
      // Tight list item sets top = false, so paragraph is skipped and afterParagraph runs before block text
      assert.strictEqual(instance.parse('- !custom item', { async: false }), '<ul>\n<li><custom>item</custom></li>\n</ul>\n');
    });

    it('combines default block extensions and positioned block extensions in either registration order', () => {
      const topExt = {
        name: 'topExt',
        level: 'block',
        tokenizer(src) {
          const match = /^@@([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'topExt', raw: match[0], text: match[1] };
          }
        },
        renderer(token) {
          return `<top>${token.text}</top>\n`;
        },
      };
      const midExt = {
        name: 'midExt',
        position: 'afterHeading',
        tokenizer(src) {
          const match = /^%%([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'midExt', raw: match[0], text: match[1] };
          }
        },
        renderer(token) {
          return `<mid>${token.text}</mid>\n`;
        },
      };

      const firstDefault = new Marked();
      firstDefault.use({ extensions: [topExt] });
      firstDefault.use({ extensions: [midExt] });

      const firstPositioned = new Marked();
      firstPositioned.use({ extensions: [midExt] });
      firstPositioned.use({ extensions: [topExt] });

      const md = '@@a\n\n# h\n\n%%b\n';
      const expected = '<top>a</top>\n<h1>h</h1>\n<mid>b</mid>\n';
      assert.strictEqual(firstDefault.parse(md, { async: false }), expected);
      assert.strictEqual(firstPositioned.parse(md, { async: false }), expected);
    });

    it('gives later registrations precedence at the same canonical position (including aliases)', () => {
      const first = {
        name: 'first',
        position: 'afterHtml',
        tokenizer(src) {
          const match = /^:::([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'first', raw: match[0], text: match[1] };
          }
        },
        renderer(token) {
          return `<first>${token.text}</first>\n`;
        },
      };
      const second = {
        name: 'second',
        position: 'beforeDef', // alias for afterHtml
        tokenizer(src) {
          const match = /^:::([^\n]+)(?:\n|$)/.exec(src);
          if (match) {
            return { type: 'second', raw: match[0], text: match[1] };
          }
        },
        renderer(token) {
          return `<second>${token.text}</second>\n`;
        },
      };

      const instance = new Marked({ extensions: [first] });
      instance.use({ extensions: [second] });
      assert.strictEqual(instance.parse(':::hello\n', { async: false }), '<second>hello</second>\n');
    });
  });

  describe('inline positions', () => {
    it('lets GFM strikethrough win at afterDel while matching non-del tilde syntax', () => {
      const tripleTilde = {
        name: 'tripleTilde',
        position: 'afterDel',
        start(src) {
          return src.indexOf('~');
        },
        tokenizer(src) {
          const match = /^~{2,3}([^~\n]+)~{2,3}/.exec(src);
          if (match) {
            return { type: 'tripleTilde', raw: match[0], text: match[1] };
          }
        },
        renderer(token) {
          return `<mark>${token.text}</mark>`;
        },
      };

      const afterDelInstance = new Marked({ extensions: [tripleTilde] });
      assert.strictEqual(
        afterDelInstance.parseInline('~~deleted~~ and ~~~highlighted~~~', { async: false }),
        '<del>deleted</del> and <mark>highlighted</mark>',
      );

      // Contrast with beforeDel: the same extension runs before GFM del
      const beforeDelInstance = new Marked({
        extensions: [{ ...tripleTilde, position: 'beforeDel' }],
      });
      assert.strictEqual(
        beforeDelInstance.parseInline('~~deleted~~ and ~~~highlighted~~~', { async: false }),
        '<mark>deleted</mark> and <mark>highlighted</mark>',
      );
    });

    it('lets codespan win over an inline extension positioned at afterCodespan', () => {
      const varExt = {
        name: 'variable',
        position: 'afterCodespan',
        start(src) {
          return src.indexOf('{');
        },
        tokenizer(src) {
          const match = /^\{([a-z]+)\}/.exec(src);
          if (match) {
            return { type: 'variable', raw: match[0], name: match[1] };
          }
        },
        renderer(token) {
          return `<var>${token.name}</var>`;
        },
      };

      const instance = new Marked({ extensions: [varExt] });
      assert.strictEqual(
        instance.parseInline('`{code}` and {name}', { async: false }),
        '<code>{code}</code> and <var>name</var>',
      );
    });

    it('lets escape win over an inline extension positioned at afterEscape / beforeTag', () => {
      const atExt = {
        name: 'at',
        position: 'afterEscape',
        start(src) {
          return src.indexOf('@');
        },
        tokenizer(src) {
          const match = /^@(\w+)/.exec(src);
          if (match) {
            return { type: 'at', raw: match[0], user: match[1] };
          }
        },
        renderer(token) {
          return `<mention>${token.user}</mention>`;
        },
      };

      const instance = new Marked({ extensions: [atExt] });
      assert.strictEqual(
        instance.parseInline('\\@escaped and @alice', { async: false }),
        '@escaped and <mention>alice</mention>',
      );
    });

    it('combines default inline extensions and positioned inline extensions in either order', () => {
      const topInline = {
        name: 'topInline',
        level: 'inline',
        start(src) { return src.indexOf('!'); },
        tokenizer(src) {
          const match = /^!([a-z]+)!/.exec(src);
          if (match) {
            return { type: 'topInline', raw: match[0], text: match[1] };
          }
        },
        renderer(token) { return `<bang>${token.text}</bang>`; },
      };
      const lateInline = {
        name: 'lateInline',
        position: 'beforeInlineText',
        start(src) { return src.indexOf('?'); },
        tokenizer(src) {
          const match = /^\?([a-z]+)\?/.exec(src);
          if (match) {
            return { type: 'lateInline', raw: match[0], text: match[1] };
          }
        },
        renderer(token) { return `<ask>${token.text}</ask>`; },
      };

      const a = new Marked({ extensions: [topInline] });
      a.use({ extensions: [lateInline] });

      const b = new Marked({ extensions: [lateInline] });
      b.use({ extensions: [topInline] });

      assert.strictEqual(a.parseInline('!hi! and ?there?', { async: false }), '<bang>hi</bang> and <ask>there</ask>');
      assert.strictEqual(b.parseInline('!hi! and ?there?', { async: false }), '<bang>hi</bang> and <ask>there</ask>');
    });
  });

  describe('fast-path preservation and validation', () => {
    it('keeps positioned tokenizer maps undefined when only default-position extensions are used', () => {
      const instance = new Marked({
        extensions: [
          {
            name: 'plainBlock',
            level: 'block',
            tokenizer() { return undefined; },
          },
          {
            name: 'startBlockAlias',
            position: 'afterBlockStart',
            tokenizer() { return undefined; },
          },
          {
            name: 'startInlineAlias',
            position: 'beforeEscape',
            tokenizer() { return undefined; },
          },
        ],
      });

      assert.strictEqual(instance.defaults.extensions.blockTokenizers, undefined);
      assert.strictEqual(instance.defaults.extensions.inlineTokenizers, undefined);
      assert.strictEqual(instance.defaults.extensions.block.length, 2);
      assert.strictEqual(instance.defaults.extensions.inline.length, 1);
    });

    it('rejects missing level and position', () => {
      const instance = new Marked();
      assert.throws(() => {
        instance.use({
          extensions: [{
            name: 'missing',
            tokenizer() { return undefined; },
          }],
        });
      }, /extension level or position is required/);
    });

    it('rejects invalid position names including Object.prototype keys', () => {
      for (const badPosition of ['invalidPos', 'toString', '__proto__', 'constructor']) {
        const instance = new Marked();
        assert.throws(() => {
          instance.use({
            extensions: [{
              name: 'bad',
              position: badPosition,
              tokenizer() { return undefined; },
            }],
          });
        }, /extension position/);
      }
    });

    it('rejects mismatched level and position', () => {
      assert.throws(() => new Marked({
        extensions: [{
          name: 'mismatch1',
          level: 'block',
          position: 'beforeLink',
          tokenizer() { return undefined; },
        }],
      }), /extension level 'block' does not match inline position 'beforeLink'/);

      assert.throws(() => new Marked({
        extensions: [{
          name: 'mismatch2',
          level: 'inline',
          position: 'beforeTable',
          tokenizer() { return undefined; },
        }],
      }), /extension level 'inline' does not match block position 'beforeTable'/);
    });
  });
});
