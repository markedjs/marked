import { Lexer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('setext content lines', () => {
  it('keeps a non-ASCII whitespace-only line inside heading text', () => {
    for (const gfm of [false, true]) {
      const [token] = Lexer.lex('first\n\u00a0\nlast\n---', { gfm });
      assert.equal(token.type, 'heading');
      assert.equal(token.text, 'first\n\u00a0\nlast');
      assert.equal(token.depth, 2);
    }
  });

  it('still ends the heading paragraph at an ASCII blank line', () => {
    for (const blank of ['', ' ', '\t', ' \t ']) {
      const tokens = Lexer.lex(`first\n${blank}\nlast\n---`, { gfm: false });
      assert.equal(tokens[0].type, 'paragraph');
      assert.equal(tokens.at(-1).type, 'heading');
      assert.equal(tokens.at(-1).text, 'last');
    }
  });
});
