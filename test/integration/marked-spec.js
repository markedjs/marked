var sut = require('../../marked.min.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var since = require('jasmine2-custom-message');

describe('CommonMark 0.28', function() {
	var htmlDiffer = new HtmlDiffer();
	cmSpec.forEach(function(spec) {
		var consoleString = 'should pass example ' + spec.example;

		// Remove XHTML closing slash (~30 examples from CM spec use HTML explicit closure)
		var expected = spec.html.replace(' />', '>');

		var actual = sut(spec.markdown);

		var message = 'CommonMark (' + spec.section + '):\n' 
			+ spec.markdown 
			+ '\n------\n\nExpected:\n' + expected 
			+ '\n------\n\nMarked:\n' + actual;

		var diff = htmlDiffer.isEqual(expected, actual);

		it(consoleString, function() {
			since(message).expect(
				diff
			).toEqual(true);
		});
	});
});
