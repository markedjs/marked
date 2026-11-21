import { Lexer } from '../../lib/marked.esm.js';
import { it } from 'node:test';
import assert from 'node:assert';

it('keeps destination whitespace in link and image raw text', () => {
  for (const gfm of [false, true]) {
    for (const raw of ['[x]( a)', '[x](  a(b))', '![x]( a)', '[x](\na)', '[x](\ta)', '[x]( a\\))']) {
      const tokens = new Lexer({ gfm }).inlineTokens(raw + ')');
      assert.strictEqual(tokens[0].raw, raw);
      assert.strictEqual(tokens[1].raw, ')');
      assert.strictEqual(tokens.map(token => token.raw).join(''), raw + ')');
    }
  }
});
