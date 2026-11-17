module.exports = [false, true].flatMap(gfm => [
  '\u00a0', '\u1680', '\u2003', '\u2028', '\u2029', '\u202f', '\u3000', '\ufeff',
].flatMap(space => ['', '!'].flatMap(image => [
  `${space}/url`, `/url${space}`, `${space}/url${space}`,
].map(href => ({
  markdown: `${image}[x](${href})`,
  html: image
    ? `<p><img src="${encodeURI(href)}" alt="x"></p>\n`
    : `<p><a href="${encodeURI(href)}">x</a></p>\n`,
  options: { gfm, renderExact: true },
})))));
