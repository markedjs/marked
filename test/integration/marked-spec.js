var sut = require('../../marked.min.js');
var cmSpec = require('./commonmark.json');

describe('CommonMark 0.28', function() {
	cmSpec.forEach(function(example) {
		var consoleString = 'should pass example ' + example.example;
		// sut.setOptions({xhtml:true});
		it(consoleString, function() {
			expect(
				sut(example.markdown)
			).toBe(example.html);
		});
	});
});
// it('should run the test', function () {
//   expect(marked('Hello World!')).toBe('<p>Hello World!</p>\n');
// });

// // http://spec.commonmark.org/0.28/#example-230
// it('should start an ordered list at 0 when requested', function () {
//   expect(
//     marked('0. ok')).
//     toBe("<ol start=\"0\">\n<li>ok</li>\n</ol>\n")
// });

// // http://spec.commonmark.org/0.28/#example-234
// it('indents code within an explicitly-started ordered list', function () {
//   expect(marked("  10.  foo\n\n           bar")).
//   toBe("<ol start=\"10\">\n<li><p>foo</p>\n<pre><code>bar\n</code></pre></li>\n</ol>\n");
// });
