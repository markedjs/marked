module.exports = [
  {
    // Unterminated inline links: each '[' starts a link candidate whose
    // href backtracking scanned the whole remainder before the paren-hint
    // fast fail in Tokenizer.link landed.
    markdown: '[a](b'.repeat(50000),
    html: `<p>${'[a](b'.repeat(50000)}</p>`,
  },
];
