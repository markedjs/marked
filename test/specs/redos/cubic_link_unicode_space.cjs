// Same shape as quadratic_link_empty_href, with the ASCII space replaced by U+00A0.
// The gap before a link destination used to be \s*, which also matches unicode
// whitespace, while the destination class only excluded ASCII space, tab and newline.
// A run of unicode whitespace could therefore be split between the two in n ways.
module.exports = {
  markdown: '[](' + ' '.repeat(50000),
  html: `<p>[](${' '.repeat(50000)}</p>`,
};
