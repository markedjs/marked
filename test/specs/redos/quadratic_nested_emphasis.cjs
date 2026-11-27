// Deeply nested emphasis and strikethrough previously ran in quadratic time
// and overflowed the call stack in the lexer (issue #4286).
module.exports = [
  {
    markdown: '*a '.repeat(2000) + 'b' + ' c*'.repeat(2000),
    html: `<p>${'<em>a '.repeat(2000)}b${' c</em>'.repeat(2000)}</p>`,
  },
  {
    markdown: '**a '.repeat(2000) + 'b' + ' c**'.repeat(2000),
    html: `<p>${'<strong>a '.repeat(2000)}b${' c</strong>'.repeat(2000)}</p>`,
  },
  {
    markdown: '*a '.repeat(2000) + 'c*',
    html: `<p>${'*a '.repeat(1999)}<em>a c</em></p>`,
  },
  {
    markdown: '~~a '.repeat(2000) + 'b' + ' c~~'.repeat(2000),
    html: `<p>${'<del>a '.repeat(2000)}b${' c</del>'.repeat(2000)}</p>`,
  },
];
