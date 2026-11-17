// Keep the input in strings: a Markdown file's terminal newline would hide
// the end-of-input case this fixture covers.
module.exports = [false, true].flatMap(gfm =>
  ['pre', 'script', 'style', 'textarea'].flatMap(tag => [
    {
      markdown: `<${tag}`,
      html: `<${tag}`,
      options: { gfm, renderExact: true },
    },
    {
      markdown: `paragraph\n<${tag}`,
      html: `<p>paragraph</p>\n<${tag}`,
      options: { gfm, renderExact: true },
    },
  ]),
);
