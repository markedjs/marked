module.exports = [
  {
    // Adjacent inline links without separating spaces: previously the greedy
    // unbracketed href pattern scanned to the end of the paragraph on every
    // link, making this quadratic (#4273).
    markdown: '[a](b)'.repeat(40000),
    html: `<p>${'<a href="b">a</a>'.repeat(40000)}</p>`,
  },
];
