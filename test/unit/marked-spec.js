var marked = require('../../lib/marked.js');

it('should run the test', function () {
  spyOn(marked, 'parse').and.callThrough();
  marked.parse('Hello World!');
  expect(marked.parse).toHaveBeenCalled();
});
