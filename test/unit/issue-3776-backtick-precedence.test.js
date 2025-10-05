import { Marked } from '../../src/marked.ts';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Issue #3776: Backtick precedence', () => {
  describe('Single backticks', () => {
    it('should handle single backticks with emphasis correctly', () => {
      const marked = new Marked();
      const input = '**text `**` more**';
      const expected = '<strong>text <code>**</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle single backticks with underscore emphasis', () => {
      const marked = new Marked();
      const input = '__text `__` more__';
      const expected = '<strong>text <code>__</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Double backticks', () => {
    it('should handle double backticks with emphasis correctly', () => {
      const marked = new Marked();
      const input = '**text ``**`` more**';
      const expected = '<strong>text <code>**</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle double backticks with nested single backticks', () => {
      const marked = new Marked();
      const input = '**text ``code with ` backtick`` more**';
      const expected = '<strong>text <code>code with ` backtick</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle double backticks with underscore emphasis', () => {
      const marked = new Marked();
      const input = '__text ``__`` more__';
      const expected = '<strong>text <code>__</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Triple backticks', () => {
    it('should handle triple backticks with emphasis correctly', () => {
      const marked = new Marked();
      const input = '**text ```**``` more**';
      const expected = '<strong>text <code>**</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle triple backticks with nested backticks', () => {
      const marked = new Marked();
      const input = '**text ```code with `` double backticks``` more**';
      const expected = '<strong>text <code>code with `` double backticks</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Quadruple backticks', () => {
    it('should handle quadruple backticks with emphasis correctly', () => {
      const marked = new Marked();
      const input = '**text ````**```` more**';
      const expected = '<strong>text <code>**</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle quadruple backticks with nested triple backticks', () => {
      const marked = new Marked();
      const input = '**text ````code with ``` triple backticks```` more**';
      const expected = '<strong>text <code>code with ``` triple backticks</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Mixed emphasis and code combinations', () => {
    it('should handle multiple code spans in emphasis', () => {
      const marked = new Marked();
      const input = '**start `code1` middle ``code2`` end**';
      const expected = '<strong>start <code>code1</code> middle <code>code2</code> end</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle emphasis inside code spans (should not process)', () => {
      const marked = new Marked();
      const input = '`**not bold**`';
      const expected = '<code>**not bold**</code>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle complex nested scenarios', () => {
      const marked = new Marked();
      const input = '*italic `code **not bold**` more italic*';
      const expected = '<em>italic <code>code **not bold**</code> more italic</em>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle links with code spans', () => {
      const marked = new Marked();
      const input = '[link with `code`](url)';
      const expected = '<a href="url">link with <code>code</code></a>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Regression tests for normal emphasis and code', () => {
    it('should still handle normal emphasis correctly', () => {
      const marked = new Marked();
      const input = '**bold text**';
      const expected = '<strong>bold text</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should still handle normal code correctly', () => {
      const marked = new Marked();
      const input = '`code`';
      const expected = '<code>code</code>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle emphasis and code separately', () => {
      const marked = new Marked();
      const input = '**bold** and `code`';
      const expected = '<strong>bold</strong> and <code>code</code>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle nested emphasis correctly', () => {
      const marked = new Marked();
      const input = '**bold _italic_ bold**';
      const expected = '<strong>bold <em>italic</em> bold</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });

  describe('Edge cases', () => {
    it('should handle unmatched backticks', () => {
      const marked = new Marked();
      const input = '**text ` unmatched**';
      const expected = '<strong>text ` unmatched</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle empty code spans', () => {
      const marked = new Marked();
      const input = '**text `` `` more**';
      const expected = '<strong>text <code> </code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle code spans at boundaries', () => {
      const marked = new Marked();
      const input = '``code`` **bold**';
      const expected = '<code>code</code> <strong>bold</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });

    it('should handle code spans with HTML entities', () => {
      const marked = new Marked();
      const input = '**text `&lt;tag&gt;` more**';
      const expected = '<strong>text <code>&amp;lt;tag&amp;gt;</code> more</strong>';
      
      const result = marked.parseInline(input);
      assert.strictEqual(result, expected);
    });
  });
});