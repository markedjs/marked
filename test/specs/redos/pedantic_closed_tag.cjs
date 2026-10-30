module.exports = {
  options: { pedantic: true, gfm: false },
  markdown: '<test>a</test>' + ' '.repeat(50000) + 'b',
  html: '<p><test>a</test> b</p>\n',
};
