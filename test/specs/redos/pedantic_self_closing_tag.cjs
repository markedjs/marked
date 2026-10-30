module.exports = {
  options: { pedantic: true, gfm: false },
  markdown: '<test/>' + ' '.repeat(50000) + 'b',
  html: '<p><test/> b</p>\n',
};
