import { Marked } from '../../lib/marked.esm.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('list continuation tab stops', () => {
  for (const gfm of [false, true]) {
    for (const [marker, tag, spaces, indent] of [['-', 'ul', 2, 2], ['1.', 'ol', 3, 3], ['10.', 'ol', 3, 4]]) {
      it(`does not turn a tab-aligned paragraph into code (${marker}, gfm=${gfm})`, () => {
        const markdown = `${marker} foo\n\n${' '.repeat(spaces)}\tbar`;
        assert.equal(new Marked({ gfm }).parse(markdown),
          `<${tag}${marker === '10.' ? ' start="10"' : ''}>\n<li><p>foo</p>\n<p>${' '.repeat(4 - indent)}bar</p>\n</li>\n</${tag}>\n`);
      });
    }

    it(`keeps enough indentation for a genuine code block (gfm=${gfm})`, () => {
      assert.equal(new Marked({ gfm }).parse('- foo\n\n  \t\tbar'),
        '<ul>\n<li><p>foo</p>\n<pre><code>  bar\n</code></pre>\n</li>\n</ul>\n');
    });

    it(`leaves non-leading tabs untouched (gfm=${gfm})`, () => {
      assert.equal(new Marked({ gfm }).parse('- foo\n\n  \tbar\tbaz'),
        '<ul>\n<li><p>foo</p>\n<p>  bar\tbaz</p>\n</li>\n</ul>\n');
    });

    it(`handles tab-only blank lines (gfm=${gfm})`, () => {
      assert.equal(new Marked({ gfm }).parse('- foo\n  \t\n  \tbar'),
        '<ul>\n<li><p>foo</p>\n<p>  bar</p>\n</li>\n</ul>\n');
    });

    it(`retains structural indentation in a nested list (gfm=${gfm})`, () => {
      assert.equal(new Marked({ gfm }).parse('- outer\n  - foo\n\n    \tbar'),
        '<ul>\n<li>outer<ul>\n<li><p>foo</p>\n<pre><code>bar\n</code></pre>\n</li>\n</ul>\n</li>\n</ul>\n');
    });
  }
});
