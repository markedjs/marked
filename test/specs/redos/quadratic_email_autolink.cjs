module.exports = [
  {
    markdown: 'a_'.repeat(50000),
    html: `<p>${'a_'.repeat(50000)}</p>`,
  },
  {
    markdown: 'a*'.repeat(50000),
    html: `<p>${'a<em>a</em>'.repeat(25000)}</p>`,
  },
];
