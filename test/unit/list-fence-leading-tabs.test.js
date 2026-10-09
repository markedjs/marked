import { Lexer, Marked, Tokenizer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function codeTokens(tokens) {
  const codes = [];
  for (const token of tokens) {
    if (token.type === 'code') {
      codes.push(token);
    }
    if (token.tokens) {
      codes.push(...codeTokens(token.tokens));
    }
    if (token.items) {
      for (const item of token.items) {
        codes.push(...codeTokens(item.tokens));
      }
    }
  }
  return codes;
}

const contentCases = [
  ['unordered fence', '- ```\n  \tfoo\n  ```', '\tfoo'],
  ['ordered fence', '12. ```\n    \tfoo\n    ```', '\tfoo'],
  ['multiple content tabs', '- ```\n  \t\tfoo\n  ```', '\t\tfoo'],
  ['literal residual spaces', '- ```\n    \tfoo\n  ```', '  \tfoo'],
  ['unclosed backtick fence', '- ```\n  \tfoo', '\tfoo'],
  ['unclosed tilde fence', '- ~~~\n  \tfoo', '\tfoo'],
  ['indented fence after a paragraph', '- intro\n    ```\n    \tfoo\n    ```', '\tfoo'],
  ['short and wrong-type markers in content', '- `````\n  ```\n  \tfoo\n  ~~~\n  `````', '```\n\tfoo\n~~~'],
  ['nested unordered list', '- outer\n  - ```\n    \tfoo\n    ```', '\tfoo'],
  ['nested ordered list', '12. outer\n    1. ```\n       \tfoo\n       ```', '\tfoo'],
  ['task list continuation', '- [ ] task\n  ```\n  \tfoo\n  ```', '\tfoo'],
  ['CRLF input', '- ```\r\n  \tfoo\r\n  ```\r\n', '\tfoo'],
];

const partialCases = [
  ['unordered list consumes part of a tab', '- ```\n\tfoo\n  ```', '  foo'],
  ['ordered list consumes part of a tab', '1. ```\n\tfoo\n   ```', ' foo'],
  ['ordered list consumes the whole tab', '12. ```\n\tfoo\n    ```', 'foo'],
  ['fence indent consumes part of a remaining tab', '- intro\n   ```\n  \tfoo\n   ```', ' foo'],
  ['fence indent consumes a whole remaining tab', '- intro\n    ```\n  \tfoo\n    ```', 'foo'],
];

for (const gfm of [false, true]) {
  describe(`list fence content tabs, gfm=${gfm}`, () => {
    for (const [name, md, text] of [...contentCases, ...partialCases]) {
      it(name, () => {
        const codes = codeTokens(Lexer.lex(md, { gfm }));
        assert.equal(codes.length, 1);
        assert.equal(codes[0].text, text);
      });
    }

    it('keeps normalized raw and item text while restoring fenced content', () => {
      const md = '- ```\n  \tfoo\n  ```';
      const list = Lexer.lex(md, { gfm })[0];
      assert.equal(list.raw, md);
      assert.equal(list.items[0].text, '```\n  foo\n```');
      assert.equal(list.items[0].tokens[0].raw, '```\n  foo\n```');
      assert.equal(list.items[0].tokens[0].text, '\tfoo');
    });

    it('keeps a continuation tab used for nested-list structure', () => {
      const list = Lexer.lex('- text\n  \t- nested', { gfm })[0];
      assert.equal(list.items[0].tokens[1].type, 'list');
      assert.equal(list.items[0].tokens[1].items[0].tokens[0].text, 'nested');
      assert.deepEqual(codeTokens([list]), []);
    });

    it('preserves tabs after non-whitespace in fenced code', () => {
      const codes = codeTokens(Lexer.lex('- ```\n  foo\tbar\n  ```', { gfm }));
      assert.equal(codes[0].text, 'foo\tbar');
    });

    it('does not treat a fence-looking line in HTML as fenced code', () => {
      const tokens = Lexer.lex('- <div>\n  ```\n  \tfoo\n  ```\n  </div>', { gfm });
      assert.deepEqual(codeTokens(tokens), []);
      assert.equal(tokens[0].items[0].tokens[0].type, 'html');
    });

    it('does not restore content in an indented-code token', () => {
      const codes = codeTokens(Lexer.lex('-     ```\n      \tfoo\n      ```', { gfm }));
      assert.equal(codes[0].codeBlockStyle, 'indented');
      assert.equal(codes[0].text, '```\n  foo\n```');
    });

    it('restores the outer source after a same-source block extension re-enters', () => {
      let active = false;
      const inner = [];
      const marked = new Marked({ gfm });
      marked.use({
        extensions: [{
          name: 'observe',
          level: 'block',
          tokenizer(src) {
            if (!active && src.startsWith('```')) {
              active = true;
              try {
                inner.push(...codeTokens(this.lexer.blockTokens(src, [])));
              } finally {
                active = false;
              }
            }
          },
        }],
      });
      const outer = codeTokens(marked.lexer('- ```\n  \tfoo\n  ```\n\n  after'));
      assert.equal(inner.length, 1);
      assert.equal(inner[0].text, '\tfoo');
      assert.equal(outer.length, 1);
      assert.equal(outer[0].text, '\tfoo');
    });

    it('restores the outer source after a tokenizer subclass re-enters', () => {
      let active = false;
      const inner = [];
      class ObservingTokenizer extends Tokenizer {
        fences(src) {
          if (!active && src.startsWith('```')) {
            active = true;
            try {
              inner.push(...codeTokens(this.lexer.blockTokens(src, [])));
            } finally {
              active = false;
            }
          }
          return super.fences(src);
        }
      }
      const outer = codeTokens(Lexer.lex('- ```\n  \tfoo\n  ```\n\n  after', {
        gfm,
        tokenizer: new ObservingTokenizer(),
      }));
      assert.equal(inner.length, 1);
      assert.equal(inner[0].text, '\tfoo');
      assert.equal(outer.length, 1);
      assert.equal(outer[0].text, '\tfoo');
    });

    it('lets a custom tokenizer use and modify the builtin fence result', () => {
      class WrappingTokenizer extends Tokenizer {
        fences(src) {
          const token = super.fences(src);
          if (token) token.text = `[custom]${token.text}[/custom]`;
          return token;
        }
      }
      const codes = codeTokens(Lexer.lex('- ```\n  \tfoo\n  ```', {
        gfm,
        tokenizer: new WrappingTokenizer(),
      }));
      assert.equal(codes[0].text, '[custom]\tfoo[/custom]');
    });

    it('keeps text returned by a custom fence tokenizer unchanged', () => {
      class CustomTokenizer extends Tokenizer {
        fences(src) {
          const cap = this.rules.block.fences.exec(src);
          if (cap) return { type: 'code', raw: cap[0], text: '  CUSTOM', lang: '' };
        }
      }
      const codes = codeTokens(Lexer.lex('- ```\n  \tfoo\n  ```', {
        gfm,
        tokenizer: new CustomTokenizer(),
      }));
      assert.equal(codes[0].text, '  CUSTOM');
    });

    it('clears source context when an extension throws before a fence', () => {
      let throwOnce = true;
      const lexer = new Lexer({
        gfm,
        extensions: {
          block: [function(src) {
            if (throwOnce && src.startsWith('```')) {
              throwOnce = false;
              throw new Error('fixture stop');
            }
          }],
        },
      });
      assert.throws(() => lexer.lex('- ```\n  \tfoo\n  ```'), /fixture stop/);
      const ordinary = codeTokens(lexer.lex('```\n  LITERAL\n```'));
      assert.equal(ordinary.at(-1).text, '  LITERAL');
      const mapped = codeTokens(lexer.lex('- ```\n  \tfoo\n  ```'));
      assert.equal(mapped.at(-1).text, '\tfoo');
    });
  });
}
