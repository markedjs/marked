// Long paragraphs of emphasis spans, underscore-joined words, or non-email
// characters before an optional email previously ran the inline text email
// look-ahead and url email scan across the remainder of the paragraph on every
// token, causing O(n^2) time (issue #4272).
module.exports = [
  {
    markdown: '*a*'.repeat(40001),
    html: `<p><em>${'a<strong>a</strong>'.repeat(20000)}a</em></p>`,
  },
  {
    markdown: 'a_'.repeat(25000),
    html: `<p>${'a_'.repeat(25000)}</p>`,
  },
  {
    markdown: '_a_'.repeat(15000),
    html: `<p><em>${'a__'.repeat(14999)}a</em></p>`,
  },
  {
    markdown: `${'a_'.repeat(20000)}@`,
    html: `<p>${'a_'.repeat(20000)}@</p>`,
  },
  {
    markdown: `${'a_'.repeat(25000)} foo@bar.com`,
    html: `<p>${'a_'.repeat(25000)} <a href="mailto:foo@bar.com">foo@bar.com</a></p>`,
  },
  {
    markdown: `${'*a*'.repeat(40001)}b@example.com`,
    html: `<p><em>${'a<strong>a</strong>'.repeat(20000)}a</em><a href="mailto:b@example.com">b@example.com</a></p>`,
  },
  {
    markdown: `${'a!'.repeat(40000)}b@example.com`,
    html: `<p>${'a!'.repeat(40000)}<a href="mailto:b@example.com">b@example.com</a></p>`,
  },
  {
    markdown: `[${'a_'.repeat(40000)}@example.com](https://example.com)`,
    html: `<p><a href="https://example.com">${'a_'.repeat(40000)}@example.com</a></p>`,
  },
  {
    options: { breaks: true },
    markdown: 'a_'.repeat(25000),
    html: `<p>${'a_'.repeat(25000)}</p>`,
  },
];
