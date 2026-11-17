const cases = [
  ['left\0right', '<p>left\ufffdright</p>\n'],
  ['`left\0right`', '<p><code>left\ufffdright</code></p>\n'],
  ['    left\0right', '<pre><code>left\ufffdright\n</code></pre>\n'],
  ['```\nleft\0right\n```', '<pre><code>left\ufffdright\n</code></pre>\n'],
  ['[x](/a\0b)', '<p><a href="/a%EF%BF%BDb">x</a></p>\n'],
  ['[x](/u "a\0b")', '<p><a href="/u" title="a\ufffdb">x</a></p>\n'],
  ['[x]: /a\0b\n\n[x]', '<p><a href="/a%EF%BF%BDb">x</a></p>\n'],
  ['<https://a.test/\0>', '<p><a href="https://a.test/%EF%BF%BD">https://a.test/\ufffd</a></p>\n'],
  ['<i data-x="\0">x</i>', '<p><i data-x="\ufffd">x</i></p>\n'],
  ['<script>\0</script>', '<script>\ufffd</script>'],
  ['<!--\0-->', '<!--\ufffd-->'],
  ['&#0;', '<p>\ufffd</p>\n'],
  ['\\0', '<p>\\0</p>\n'],
];
module.exports = [false, true].flatMap(gfm => cases.map(([markdown, html]) => ({
  markdown,
  html,
  options: { gfm, renderExact: true },
})));
