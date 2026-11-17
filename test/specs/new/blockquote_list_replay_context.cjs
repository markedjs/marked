module.exports = [false, true].flatMap(gfm => ['-', '*', '+', '2.'].map(marker => ({
  markdown: `- a\n  \n  b\n  >${marker}\n  tail`,
  html: `<ul>\n<li><p>a</p>\n<p>b</p>\n<blockquote>\n${marker === '2.' ? '<ol start="2">' : '<ul>'}\n<li></li>\n${marker === '2.' ? '</ol>' : '</ul>'}\n</blockquote>\n<p>tail</p>\n</li>\n</ul>\n`,
  options: { gfm, renderExact: true },
})));
