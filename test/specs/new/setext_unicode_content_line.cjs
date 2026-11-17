module.exports = [false, true].flatMap(gfm => [
  '\u00a0', '\u1680', '\u2003', '\u202f', '\u3000', '\ufeff',
].flatMap(space => ['---', '==='].map(marker => ({
  markdown: `first\n${space}\nlast\n${marker}`,
  html: `<h${marker[0] === '=' ? 1 : 2}>first\n${space}\nlast</h${marker[0] === '=' ? 1 : 2}>\n`,
  options: { gfm, renderExact: true },
}))));
