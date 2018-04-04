var marked = require('../../lib/marked.js');

it('should run the test', function () {
  spyOn(marked, 'parse').and.callThrough();
  marked.parse('Hello World!');
  expect(marked.parse).toHaveBeenCalled();
});

describe('Test heading ID functionality', function() {
	it('should add id attribute by default', function() {
		var renderer = new marked.Renderer(marked.defaults);
		var header = renderer.heading('test', 1, 'test');
		expect(header).toBe('<h1 id="test">test</h1>\n');
	});

	it('should NOT add id attribute when options set false', function() {
		var renderer = new marked.Renderer({ headerIds: false });
		var header = renderer.heading('test', 1, 'test');
		expect(header).toBe('<h1>test</h1>\n');
	});
});
