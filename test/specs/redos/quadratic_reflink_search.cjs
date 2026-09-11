// Regression: `reflinkSearch` is unanchored and runs with the global flag, so
// every '[' in the source is a start position. A label crosses a bracket only
// by escaping it, and nothing capped how often it could, so a candidate that
// can never match still scanned to the end of the source. 188 KB of the first
// shape took 21s to parse with default options.
const escapedBracket = 18000;
const escapedPair = 14000;

module.exports = [
  {
    markdown: '[' + '\t\\['.repeat(escapedBracket) + '[',
    html: `<p>[${'\t['.repeat(escapedBracket)}[</p>`,
  },
  {
    markdown: '[' + '\t\\[\\]'.repeat(escapedPair) + '[',
    html: `<p>[${'\t[]'.repeat(escapedPair)}[</p>`,
  },
];
