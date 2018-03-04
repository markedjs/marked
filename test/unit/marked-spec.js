var marked = require('../../lib/marked.js');

it('should run the test', function () {
  expect(marked('Hello World!')).toContain('Hello World!');
});
