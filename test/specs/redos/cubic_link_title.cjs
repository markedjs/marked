module.exports = {
  markdown: 'a[b](c'.repeat(1000),
  html: `<p>${'a[b](c'.repeat(1000)}</p>\n`,
};
