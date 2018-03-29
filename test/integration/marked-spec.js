var sut = require('../../marked.min.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var since = require('jasmine2-custom-message');

describe('CommonMark 0.28', function() {
	var htmlDiffer = new HtmlDiffer();
	cmSpec.forEach(function(example) {
		var consoleString = 'should pass example ' + example.example;
		var expected = example.html.replace(' />', '>');
		var actual = sut(example.markdown);
		// sut.setOptions({xhtml:true});
		it(consoleString, function() {
			since('CommonMark:\n' + expected + '\n------\n\nMarked:\n' + actual).expect(
				htmlDiffer.isEqual(expected, actual)				
			).toEqual(true);
		});
	});
});
