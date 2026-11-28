import { marked, Marked, Renderer, Parser, Tokenizer, Hooks, parseInline } from '../../lib/marked.esm.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Marked', () => {
  it('should allow multiple instances', () => {
    const marked1 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked1';
        },
      },
    });

    const marked2 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        },
      },
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  for (const fallback of [false, true]) {
    it(`should preserve a numeric renderer result through a custom parser${fallback ? ' after falling back' : ''}`, () => {
      const instance = new Marked({
        renderer: {
          code({ text }) {
            return text.length;
          },
        },
        hooks: {
          provideParser() {
            return (tokens, options) => options.renderer.code(tokens[0]);
          },
        },
      });
      if (fallback) {
        instance.use({ renderer: { code: () => false } });
      }

      assert.strictEqual(instance.parse('```\n```'), 0);
      assert.strictEqual(instance.parse('```\nabc\n```'), 3);
    });
  }

  for (const result of [null, undefined]) {
    it(`should still suppress ${result} renderer output`, () => {
      const instance = new Marked({ renderer: { code: () => result } });
      assert.strictEqual(instance.parse('```\n```'), '');
    });
  }

  describe('custom non-string renderer return types', () => {
    class AstRenderer extends Renderer {
      heading({ tokens, depth }) {
        return { kind: 'heading', depth, children: this.parser.parseInline(tokens) };
      }

      paragraph({ tokens }) {
        return { kind: 'paragraph', children: this.parser.parseInline(tokens) };
      }

      strong({ tokens }) {
        return { kind: 'strong', children: this.parser.parseInline(tokens) };
      }

      text(token) {
        if ('tokens' in token && token.tokens) {
          return { kind: 'span', children: this.parser.parseInline(token.tokens) };
        }
        return { kind: 'text', value: token.text };
      }
    }

    class AstParser extends Parser {
      parse(tokens) {
        this.renderer.parser = this;
        const out = [];
        for (const token of tokens) {
          if (this.options.extensions?.renderers?.[token.type]) {
            const ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
            if (ret !== false) {
              out.push(ret);
              continue;
            }
          }
          if (token.type === 'space') {
            continue;
          }
          out.push(this.renderer[token.type](token));
        }
        return out;
      }

      parseInline(tokens) {
        this.renderer.parser = this;
        const out = [];
        for (const token of tokens) {
          if (this.options.extensions?.renderers?.[token.type]) {
            const ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
            if (ret !== false) {
              out.push(ret);
              continue;
            }
          }
          out.push(this.renderer[token.type](token));
        }
        return out;
      }
    }

    class AstHooks extends Hooks {
      provideParser(block = this.block) {
        return (tokens, options) => {
          const parser = new AstParser(options);
          return block ? parser.parse(tokens) : parser.parseInline(tokens);
        };
      }
    }

    it('should render structured AST nodes via Marked instance (sync, async, inline, and fallback)', async() => {
      const instance = new Marked({
        renderer: {
          heading({ tokens, depth }) {
            return { kind: 'heading', depth, children: this.parser.parseInline(tokens) };
          },
          paragraph({ tokens }) {
            return { kind: 'paragraph', children: this.parser.parseInline(tokens) };
          },
          strong({ tokens }) {
            return { kind: 'strong', children: this.parser.parseInline(tokens) };
          },
          text(token) {
            return { kind: 'text', value: token.text };
          },
        },
        hooks: {
          provideParser() {
            return (tokens, options) => {
              const parser = new AstParser(options);
              return this.block ? parser.parse(tokens) : parser.parseInline(tokens);
            };
          },
        },
        extensions: [{
          name: 'badge',
          level: 'inline',
          start(src) {
            return src.indexOf('[[');
          },
          tokenizer(src) {
            const match = /^\[\[([^\]]+)\]\]/.exec(src);
            if (match) {
              return { type: 'badge', raw: match[0], label: match[1] };
            }
          },
          renderer(token) {
            return { kind: 'badge', label: token.label };
          },
        }],
      });

      // Fallback override returning false delegates to the previous AST renderer
      instance.use({
        renderer: {
          heading({ depth }) {
            if (depth === 1) {
              return false;
            }
            return { kind: 'subheading', depth };
          },
        },
      });

      const expectedBlock = [
        {
          kind: 'heading',
          depth: 1,
          children: [
            { kind: 'text', value: 'Hello ' },
            { kind: 'strong', children: [{ kind: 'text', value: 'world' }] },
          ],
        },
        {
          kind: 'paragraph',
          children: [{ kind: 'badge', label: 'beta' }],
        },
      ];

      assert.deepStrictEqual(instance.parse('# Hello **world**\n\n[[beta]]', { async: false }), expectedBlock);
      assert.deepStrictEqual(await instance.parse('# Hello **world**\n\n[[beta]]', { async: true }), expectedBlock);
      assert.deepStrictEqual(instance.parseInline('**bold** [[ok]]', { async: false }), [
        { kind: 'strong', children: [{ kind: 'text', value: 'bold' }] },
        { kind: 'text', value: ' ' },
        { kind: 'badge', label: 'ok' },
      ]);
      // Default marked remains string HTML
      assert.strictEqual(marked.parse('# Hello **world**', { async: false }), '<h1>Hello <strong>world</strong></h1>\n');
    });

    it('should support custom Renderer and Hooks subclasses on top-level marked() and parseInline()', async() => {
      const options = {
        renderer: new AstRenderer(),
        hooks: new AstHooks(),
      };

      const expected = [
        {
          kind: 'heading',
          depth: 2,
          children: [{ kind: 'text', value: 'Title' }],
        },
      ];

      assert.deepStrictEqual(marked('## Title', { ...options, async: false }), expected);
      assert.deepStrictEqual(await marked('## Title', { ...options, async: true }), expected);
      assert.deepStrictEqual(marked.parseInline('**hi**', { ...options, async: false }), [
        { kind: 'strong', children: [{ kind: 'text', value: 'hi' }] },
      ]);
      assert.deepStrictEqual(await parseInline('**hi**', { ...options, async: true }), [
        { kind: 'strong', children: [{ kind: 'text', value: 'hi' }] },
      ]);
      // Global marked default output is unaffected
      assert.strictEqual(marked('## Title', { async: false }), '<h2>Title</h2>\n');
      assert.strictEqual(parseInline('**hi**', { async: false }), '<strong>hi</strong>');
    });
  });

  it('should work with use', () => {
    const marked1 = new Marked();
    marked1.use({
      silent: true,
      renderer: {
        heading() {
          return 'im marked1';
        },
      },
    });

    const marked2 = new Marked();
    marked2.use({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        },
      },
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  it('should work with setOptions', () => {
    const marked1 = new Marked();
    const marked1Renderer = new Renderer();
    marked1Renderer.heading = () => 'im marked1';
    marked1.setOptions({
      silent: true,
      renderer: marked1Renderer,
    });

    const marked2 = new Marked();
    const marked2Renderer = new Renderer();
    marked2Renderer.heading = () => 'im marked2';
    marked2.setOptions({
      silent: true,
      renderer: marked2Renderer,
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  it('should pass defaults to lexer and parser', () => {
    const marked1 = new Marked();
    marked1.use({
      renderer: {
        heading() {
          return 'test';
        },
      },
    });
    const tokens = marked1.lexer('# hi');
    const html = marked1.parser(tokens);

    assert.strictEqual(html, 'test');
  });

  describe('use class objects', () => {
    beforeEach(() => {
      marked.setOptions(marked.getDefaults());
    });

    it('allow new Renderer()', () => {
      const marked1 = new Marked();
      const newRenderer = new Renderer();
      newRenderer.heading = () => 'im marked renderer';

      marked1.use({ renderer: newRenderer });
      marked.use({ renderer: newRenderer });

      assert.strictEqual(marked1.parse('# header'), 'im marked renderer');
      assert.strictEqual(marked.parse('# header'), 'im marked renderer');
    });

    it('allow new Tokenizer()', () => {
      const marked1 = new Marked();
      const newTokenizer = new Tokenizer();
      newTokenizer.heading = function(src) {
        return {
          type: 'heading',
          raw: src,
          depth: 1,
          text: 'im marked tokenizer',
          tokens: this.lexer.inlineTokens('im marked tokenizer'),
        };
      };

      marked1.use({ tokenizer: newTokenizer });
      marked.use({ tokenizer: newTokenizer });

      assert.strictEqual(marked1.parse('# header'), '<h1>im marked tokenizer</h1>\n');
      assert.strictEqual(marked.parse('# header'), '<h1>im marked tokenizer</h1>\n');
    });

    it('allow new Hooks()', () => {
      const marked1 = new Marked();
      const newHooks = new Hooks();
      newHooks.preprocess = () => 'im marked hooks';

      marked1.use({ hooks: newHooks });
      marked.use({ hooks: newHooks });

      assert.strictEqual(marked1.parse('# header'), '<p>im marked hooks</p>\n');
      assert.strictEqual(marked.parse('# header'), '<p>im marked hooks</p>\n');
    });
  });
});
