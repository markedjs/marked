module.exports = [
  {
    // Each unmatched bracket must not rescan the remaining backticks.
    markdown: '['.repeat(6000) + '`'.repeat(6000),
    html: `<p>${'['.repeat(6000)}${'`'.repeat(6000)}</p>`,
  },
  {
    // A backtick run must not execute the code span rule once per backtick.
    markdown: '[' + '`'.repeat(65536) + '](x)',
    html: `<p><a href="x">${'`'.repeat(65536)}</a></p>`,
  },
];
