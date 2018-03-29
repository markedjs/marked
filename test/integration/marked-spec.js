var sut = require('../../marked.min.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var since = require('jasmine2-custom-message');

describe('CommonMark 0.28', function() {
	var htmlDiffer = new HtmlDiffer();
	var failures = [];
	cmSpec.forEach(function(example) {
		var consoleString = 'should pass example ' + example.example;

		// Remove XHTML closing slash (~30 examples from CM spec use HTML explicit closure)
		var expected = example.html.replace(' />', '>');

		var actual = sut(example.markdown);

		var message = 'CommonMark:\n' + expected + '\n------\n\nMarked:\n' + actual;

		var diff = htmlDiffer.isEqual(expected, actual);

		it(consoleString, function() {
			since(message).expect(
				diff
			).toEqual(true);
		});
	});
});
