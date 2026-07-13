module.exports = [
  {
    markdown: '\\.'.repeat(100000),
    html: `<p>${'.'.repeat(100000)}</p>`,
  },
  {
    markdown: '`x` '.repeat(60000),
    html: `<p>${'<code>x</code> '.repeat(60000)}</p>`,
  },
  {
    markdown: '[a]: x\n\n' + '[a] '.repeat(100000),
    html: `<p>${'<a href="x">a</a> '.repeat(100000)}</p>`,
  },
];
