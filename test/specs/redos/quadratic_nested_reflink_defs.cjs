// Regression: recursive link text containing '[' must not rebuild lookup state
// for every reference when many link definitions are present.
const n = 13000;
const defs = ['[id]: /url'];
const links = [];
for (let i = 0; i < n; i++) {
  defs.push(`[unused-${i}]: /${i}`);
  links.push('<a href="/url">[x]</a>');
}

module.exports = {
  markdown: `${'[[x]][id] '.repeat(n)}\n\n${defs.join('\n')}`,
  html: `<p>${links.join(' ')}</p>\n`,
};
