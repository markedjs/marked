import { Marked, Lexer, Parser } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('literal null input characters', () => {
  it('normalizes both block and inline lexer entry points', () => {
    for (const options of [{ gfm: false }, { gfm: true }, { pedantic: true }]) {
      assert.equal(Parser.parse(Lexer.lex('a\0b', options), options), '<p>a\ufffdb</p>\n');
      assert.equal(Parser.parseInline(Lexer.lexInline('a\0b', options), options), 'a\ufffdb');
      assert.equal(Parser.parseInline(new Lexer(options).inlineTokens('a\0b'), options), 'a\ufffdb');
    }
  });

  it('normalizes preprocessed source before default lexing without changing hook input', () => {
    const marked = new Marked({
      hooks: {
        preprocess(src) {
          assert.equal(src, 'a\0b');
          return `${src}\0c`;
        },
      },
    });
    assert.equal(marked.parse('a\0b'), '<p>a\ufffdb\ufffdc</p>\n');
    assert.equal(marked.parseInline('a\0b'), 'a\ufffdb\ufffdc');
  });

  it('also normalizes an asynchronous preprocess result', async() => {
    const marked = new Marked({
      async: true,
      hooks: {
        async preprocess(src) {
          return `${src}\0c`;
        },
      },
    });
    assert.equal(await marked.parse('a\0b'), '<p>a\ufffdb\ufffdc</p>\n');
    assert.equal(await marked.parseInline('a\0b'), 'a\ufffdb\ufffdc');
  });

  it('keeps custom lexer ownership of its source', () => {
    const marked = new Marked({
      hooks: {
        provideLexer() {
          return src => {
            assert.equal(src, 'a\0b');
            return [{ type: 'text', raw: src, text: 'custom' }];
          };
        },
      },
    });
    assert.equal(marked.parseInline('a\0b'), 'custom');
  });
});
