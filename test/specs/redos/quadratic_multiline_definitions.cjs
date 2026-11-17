// Checking a multiline definition title must not scan the remaining document
// again for every definition. Keep the paragraph probe within the match.
const n = 16000;
const definitions = Array.from({ length: n }, (_, i) => `[id-${i}]: /url "first\nsecond"`);

module.exports = {
  markdown: `${definitions.join('\n')}\n\n[id-0] [id-${n - 1}]`,
  html: '<p><a href="/url" title="first\nsecond">id-0</a> <a href="/url" title="first\nsecond">id-15999</a></p>\n',
};
