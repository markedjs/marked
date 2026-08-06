// Regression: many reference definitions + references must not be quadratic.
// Lexer.inlineTokens rebuilt its reflink-masking preamble on every call;
// with n defs and n refs that took ~24s at n=13000 (exponent ~3).
const n = 13000;
let refs = '';
const defs = [];
const links = [];
for (let i = 0; i < n; i++) {
  refs += `[^${i}] `;
  defs.push(`[^${i}]: x`);
  links.push(`<a href="x">^${i}</a>`);
}

module.exports = {
  markdown: `${refs}\n\n${defs.join('\n')}`,
  html: `<p>${links.join(' ')}</p>\n`,
};
