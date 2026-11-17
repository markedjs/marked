import { Lexer, Tokenizer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('blockquote list replay context', () => {
  it('does not crash when the outer block run ends in text', () => {
    for (const gfm of [false, true]) {
      const tokens = Lexer.lex('- [\n  >-\n--', { gfm });
      assert.equal(tokens[0].type, 'list');
      const quote = tokens[0].items[0].tokens.find(token => token.type === 'blockquote');
      assert.equal(quote.tokens[0].type, 'list');
      assert.equal(quote.tokens[0].items.length, 1);
    }
  });

  it('restores the outer context after replay succeeds or throws', () => {
    for (const fail of [false, true]) {
      const tokenizer = new Tokenizer();
      const lexer = new Lexer({ tokenizer, gfm: false });
      const outer = { type: 'text', raw: 'outer', text: 'outer', tokens: [] };
      lexer.state.lastToken = outer;
      const originalList = tokenizer.list;
      let replayed = false;
      tokenizer.list = function(src) {
        if (src === '-\ntail') {
          replayed = true;
          assert.equal(lexer.state.lastToken, undefined);
          if (fail) {
            throw new Error('replay failed');
          }
        }
        return originalList.call(this, src);
      };
      if (fail) {
        assert.throws(() => tokenizer.blockquote('>-\ntail'), /replay failed/);
      } else {
        assert.equal(tokenizer.blockquote('>-\ntail').tokens[0].type, 'list');
      }
      assert.equal(replayed, true);
      assert.equal(lexer.state.lastToken, outer);
    }
  });
});
