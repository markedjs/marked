var marked = require('../../lib/marked.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var since = require('jasmine2-custom-message');

describe('CommonMark 0.28', function() {
	cmSpec.forEach(function(spec) {
		var shouldPassButFails = [];
		var tabs           = [3, 2, 1, 7];
		var thematicBreaks = [13, 17, 19];
		var setextHeadings = [56, 52, 62, 64, 51, 67];
		var atxHeadings    = [49, 40, 45, 47, 46];
		var paragraphs     = [185, 186];
		var blockQuotes    = [198, 199, 200, 201];
		var listItems      = [229, 237, 236, 227, 218, 243, 259, 241, 239, 247, 
							  246, 225, 220, 258, 260, 244];
		var lists          = [282, 270, 280, 278, 273, 275, 274, 264, 277, 265, 
							  276, 279, 267, 269];
		var links          = [499, 489, 471, 484, 466, 483, 535, 476, 474, 508, 
							  468, 523, 527, 475, 467, 509, 539, 464, 497, 473, 
							  507, 463, 492, 478, 504, 514, 479, 491, 512, 477, 
							  503, 513, 496, 470, 495, 505, 490, 469];
		var autolinks      = [582, 574, 573, 579, 583];
		var images         = [556, 465, 548, 545, 544, 546, 558, 547, 560];
		var rawHtml        = [600, 601, 604, 588, 595, 587, 590, 599, 597, 586, 598];
		var htmlBlocks     = [132, 126, 147, 124, 120, 153, 133, 119, 127, 118, 
							  141, 116, 158, 123, 143, 130, 137, 140, 125, 134, 
							  131, 144, 145, 148, 139, 149, 129, 156, 135, 138, 155];
		var codeSpans      = [330, 316, 327, 328, 320, 323, 322];
		// Fenced code blocks
		var fencedCode     = [113, 112, 102, 101, 93, 106, 95, 96, 108, 97, 111];
		// Indented code blocks
		var indentedCode   = [82];
		// Hard line breaks
		var hardBreaks     = [611, 606, 609, 613];
		// Soft line breaks
		var softBreaks     = [621];
		// Entity and numeric character references
		var entityRef      = [311, 309, 310, 308];
		// Backslash escapes
		var backslashEsc   = [290, 291, 289, 293, 297, 301, 299, 298, 300];
		// Link reference definitions
		var linkRefDef     = [167, 171];
		// Emphasis and strong emphasis
		var emphasisStrong = [447, 450, 445, 409, 448, 444, 395, 402, 443, 396, 
							  398, 403, 372, 389, 456, 404, 371, 420, 455, 422, 
							  387, 414, 452, 458, 421, 457, 424, 451, 426, 423, 
							  416, 454, 349, 347, 453, 346, 353, 432, 378, 428, 
							  369, 332, 381, 431, 363, 359, 380, 360, 355, 356, 
							  342, 388, 364, 368, 433, 435, 434, 392, 348, 382, 
							  436, 333, 449, 427, 377, 334];

		// Toggle to run all spec-based examples.
		var shouldPassButFails = shouldPassButFails.concat(tabs, thematicBreaks,
				setextHeadings, atxHeadings, paragraphs, blockQuotes, listItems,
				lists, links, autolinks, images, rawHtml, htmlBlocks, codeSpans,
				fencedCode, indentedCode, hardBreaks, softBreaks, entityRef, backslashEsc,
				linkRefDef, emphasisStrong);


		if (shouldPassButFails.indexOf(spec.example) < 0) {
			marked.setOptions({ headerIds: false });
			
			var htmlDiffer = new HtmlDiffer();

			var consoleString = 'should pass example ' + spec.example;

			// Remove XHTML closing slash (~30 examples from CM spec use HTML explicit closure)
			var expected = spec.html.replace(' />', '>');

			// marked.Renderer({ headerIds: false });
			var actual = marked(spec.markdown);

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
		}
	});
});

