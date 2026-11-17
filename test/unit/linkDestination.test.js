import { Lexer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('link destination whitespace', () => {
  it('preserves non-ASCII destination edges in modern links and images', () => {
    for (const gfm of [false, true]) {
      for (const image of ['', '!']) {
        for (const space of ['\u00a0', '\u1680', '\u2003', '\u2028', '\u2029', '\u202f', '\u3000', '\ufeff']) {
          for (const href of [`${space}/url`, `/url${space}`, `${space}/url${space}`]) {
            const raw = `${image}[x](${href})`;
            const [token] = Lexer.lexInline(raw, { gfm });
            assert.equal(token.type, image ? 'image' : 'link');
            assert.equal(token.href, href);
            assert.equal(token.raw, raw);
          }
        }
      }
    }
  });

  it('keeps ASCII gaps, angle destinations, titles and pedantic behavior', () => {
    for (const gfm of [false, true]) {
      for (const raw of ['[x]( \t/url \t)', '[x](\n/url\n)']) {
        assert.equal(Lexer.lexInline(raw, { gfm })[0].href, '/url');
      }
      const [angle] = Lexer.lexInline('[x](<\u00a0/url\u00a0> "title")', { gfm });
      assert.equal(angle.href, '\u00a0/url\u00a0');
      assert.equal(angle.title, 'title');
      const [titled] = Lexer.lexInline('[x](\u00a0/url\u00a0 "title")', { gfm });
      assert.equal(titled.href, '\u00a0/url\u00a0');
      assert.equal(titled.title, 'title');
    }
    assert.equal(Lexer.lexInline('[x](\u00a0/url\u00a0)', { pedantic: true })[0].href, '/url');
  });
});
