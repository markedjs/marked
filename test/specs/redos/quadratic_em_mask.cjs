module.exports = [
  {
    markdown: '['.repeat(100000),
    html: `<p>${'['.repeat(100000)}</p>`
  },
  {
    markdown: '[.'.repeat(50000),
    html: `<p>${'[.'.repeat(50000)}</p>`
  },
  {
    markdown: '<'.repeat(100000),
    html: `<p>${'<'.repeat(100000)}</p>`
  },
  {
    markdown: '<.'.repeat(50000),
    html: `<p>${'<.'.repeat(50000)}</p>`
  }
];
