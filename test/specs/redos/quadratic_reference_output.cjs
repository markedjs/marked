const href = '/' + 'x'.repeat(50000);
const link = `<a href="${href}">a</a>`;

module.exports = [
  {
    markdown: `[a]: ${href}\n\n` + '[a] '.repeat(5000),
    html: `<p>${link} ${link} ${'[a] '.repeat(4998)}</p>`,
  },
  {
    markdown: '[a]: /b "t"\n\n' + '[a] '.repeat(20000),
    html: `<p>${'<a href="/b" title="t">a</a> '.repeat(20000)}</p>`,
  },
];
