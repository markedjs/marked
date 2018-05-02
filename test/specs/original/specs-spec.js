var marked = require('../../../lib/marked.js');
var specTests = require('../../index.js');

it('should run spec tests', function () {
  // hide output
  spyOn(console, 'log');
  if (!specTests({stop: true})) {
    // if tests fail rerun tests and show output
    console.log.and.callThrough();
    specTests();
    fail();
  }
});

it('should use the correct paragraph type', function () {
  const md = `
A Paragraph.

> A blockquote

- list item

`;

  const tokens = marked.lexer(md);

  expect(tokens[0].type).toBe('paragraph');
  expect(tokens[3].type).toBe('paragraph');
  expect(tokens[7].type).toBe('text');
});
