var marked = require('../../marked.min.js');

it('should run the test', function () {
  expect(marked('Hello World!')).toBe('<p>Hello World!</p>\n');
});
