import { marked } from '../../lib/marked.esm.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Issue #3776: Even-numbered backtick strings have incorrect precedence', () => {
  const backtickTests = [
    { name: 'single', ticks: '`' },
    { name: 'double', ticks: '``' },
    { name: 'triple', ticks: '```' },
    { name: 'quadruple', ticks: '````' },
  ];

  for (const { name, ticks } of backtickTests) {
    it(`should prioritize codespans over emphasis for ${name} backticks`, () => {
      const input = `**You might think this should be bold, but: ${ticks}**${ticks}`;
      const html = marked(input);

      // Should create a codespan containing **, not emphasis
      assert.ok(html.includes('<code>**</code>'), 'Should contain codespan with **');
      assert.ok(!html.includes('<strong>'), 'Should not contain strong tags');
    });
  }

  it('should allow emphasis when codespan does not contain emphasis markers', () => {
    const input = '**This should be bold** and `this should be code`';
    const html = marked(input);
    
    // Should have both emphasis and codespan
    assert.ok(html.includes('<strong>This should be bold</strong>'), 'Should contain strong tags');
    assert.ok(html.includes('<code>this should be code</code>'), 'Should contain codespan');
  });

  it('should handle nested cases correctly', () => {
    const input = '**start ``contains **`` end**';
    const html = marked(input);
    
    // The codespan should consume the ** and be created correctly
    assert.ok(html.includes('<code>contains **</code>'), 'Should contain codespan with emphasis markers');
    // The outer ** should create emphasis around the whole thing
    assert.ok(html.includes('<strong>start <code>contains **</code> end</strong>'), 'Should have emphasis around the whole construct');
  });
});