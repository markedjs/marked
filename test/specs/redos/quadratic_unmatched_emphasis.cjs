// Unmatched left-flanking emphasis / strikethrough delimiters. Before the
// last-closer early-exit, each opener walked every later delimiter
// (issue #4099). These sizes exceed the spec harness 1s budget on that path.
module.exports = [
  {
    markdown: ('- *').repeat(2000),
    html: `<ul>\n<li>${'*- '.repeat(1999)}*</li>\n</ul>\n`,
  },
  {
    markdown: ('+ _').repeat(2000),
    html: `<ul>\n<li>${'_+ '.repeat(1999)}_</li>\n</ul>\n`,
  },
  {
    markdown: ('*x *x ').repeat(2000),
    html: `<p>${'*x *x '.repeat(2000)}</p>\n`,
  },
  {
    markdown: ('~x ~x ').repeat(2000),
    html: `<p>${'~x ~x '.repeat(2000)}</p>\n`,
  },
];
