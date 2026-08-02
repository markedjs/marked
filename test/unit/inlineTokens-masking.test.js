import { marked } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Regression: many reference definitions + references must not be quadratic.
 *
 * Lexer.inlineTokens rebuilt its reflink-masking preamble (Object.keys over
 * every link definition, then a reflinkSearch replace) on *every* call —
 * including recursive link-text calls whose text cannot contain a reflink.
 * With n defs and n refs that is O(n²) allocation churn (measured exponent
 * ~3: 24s at n=13000). The fix skips the masking block when the source has
 * no '[' (reflinkSearch cannot match without one) and uses a Set lookup.
 */
function footnoteShape(n) {
  let refs = '';
  const defs = [];
  for (let i = 0; i < n; i++) {
    refs += `[^${i}] `;
    defs.push(`[^${i}]: x`);
  }
  return refs + '\n\n' + defs.join('\n');
}

function parseSeconds(text) {
  marked.parse('warmup');
  const t0 = process.hrtime.bigint();
  marked.parse(text);
  return Number(process.hrtime.bigint() - t0) / 1e9;
}

describe('inlineTokens masking scaling', () => {
  it('stays near-linear over a doubling ladder', () => {
    const t1 = parseSeconds(footnoteShape(2000));
    const t2 = parseSeconds(footnoteShape(4000));
    // pre-fix this ratio is ~5+ (exponent > 2); linear growth is ~2.
    // Assert on the growth ratio directly (epsilon floor avoids divide-by-zero)
    // so the check stays sensitive on fast runners instead of falling back to
    // an absolute-time bound that can mask superlinear behavior.
    const ratio = t2 / Math.max(t1, 1e-4);
    assert.ok(
      ratio < 3.5,
      `superlinear growth suspected: ${t1.toFixed(3)}s -> ${t2.toFixed(3)}s (ratio ${ratio.toFixed(2)})`,
    );
  });

  it('renders reference links identically to the unmasked path', () => {
    assert.strictEqual(
      marked.parse('[a][b]\n\n[b]: /url "t"'),
      '<p><a href="/url" title="t">a</a></p>\n',
    );
  });
});
