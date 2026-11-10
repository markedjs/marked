module.exports = {
  markdown: '- a\n' + '  text of a long list item\n'.repeat(5000),
  html: `<ul><li>a${'\ntext of a long list item'.repeat(5000)}</li></ul>`,
};
