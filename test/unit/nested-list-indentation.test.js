import { Marked } from '../../lib/marked.esm.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('nested list indentation', () => {
  const marked = new Marked();

  it('should parse nested list with 4-space indentation correctly', () => {
    const markdown = `- title
    - desc
    -`;
    const expected = '<ul>\n<li>title</li>\n<li>desc</li>\n<li></li>\n</ul>\n';
    const result = marked.parse(markdown);
    assert.strictEqual(result, expected);
  });

  it('should parse nested list with 2-space indentation correctly', () => {
    const markdown = `- title
  - desc
  -`;
    const expected = '<ul>\n<li>title</li>\n<li>desc</li>\n<li></li>\n</ul>\n';
    const result = marked.parse(markdown);
    assert.strictEqual(result, expected);
  });
});