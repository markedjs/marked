var marked = require('../../lib/marked.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer,
	htmlDiffer = new HtmlDiffer();
var since = require('jasmine2-custom-message');

var Messenger = function() {}

Messenger.prototype.message = function(spec, expected, actual) {
	return 'CommonMark (' + spec.section + '):\n' 
		+ spec.markdown 
		+ '\n------\n\nExpected:\n' + expected 
		+ '\n------\n\nMarked:\n' + actual;	
}

Messenger.prototype.test = function(spec, section, ignore) {
	if (spec.section == section && ignore.indexOf(spec.example) < 0) {
		var expected = spec.html;

		var actual = marked(spec.markdown, { headerIds: false, xhtml: true });

		it('should pass example ' + spec.example, function() {
			since(messenger.message(spec, expected, actual)).expect(
				htmlDiffer.isEqual(expected, actual)
			).toEqual(true);
		});
	}
}

var messenger = new Messenger();
/*
|Section                     |Count    |Percent   |
|:---------------------------|:-------:|---------:|
|Tabs                        |7 of 11  |63%       |
|Thematic breaks             |16 of 19 |84%       |
|ATX headings                |13 of 18 |72%       |
|Setext headings             |20 of 26 |77%       |
|Indented code blocks        |11 of 12 |92%       |
|Fenced code blocks          |17 of 28 |61%       |
|HTML blocks                 |12 of 43 |28%       |
|Link reference definitions  |21 of 23 |91%       |
|Paragraphs                  |6 of 8   |75%       |
|Block quotes                |21 of 25 |84%       |
|List items                  |32 of 48 |67%       |
|Lists                       |10 of 24 |42%       |
|Backslash escapes           |4 of 13  |31%       |
|Entity and numeric character references|8 of 12|67%|
|Code spans                  |10 of 17 |59%       |
|Emphasis and strong emphasis|62 of 128|48%       |
|Links                       |46 of 84 |55%       |
|Images                      |13 of 22 |59%       |
|Autolinks                   |14 of 19 |74%       |
|Hard line breaks            |32 of 36 |89%       |
|Soft line breaks            |1 of 2   |50%       |
*/

describe('CommonMark 0.28 Tabs', function() {
	var section = 'Tabs';

	cmSpec.forEach(function(spec, shouldPassButFails) {
		// These tests probably should pass but don't for some reason.
		// This is the easiest way to demonstrate limitations  or defects 
		// within Marked. Toggle comments for nex two lines to see which examples
		// are known failures. Note: If all array are empty, it means Marked is
		// 100% compliant with that section of the given specification.
		// 
		// var shouldPassButFails = [];
		var shouldPassButFails = [1, 2, 3, 7];

		// Identifies examples that the Marked core team has determined beyond
		// the ability or desire to correct; thereby, implicitly requesting
		// outside help and assistance.
		var willNotBeAttemptedByCoreTeam = [];

		// Combine known failures and skips.
		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

		// Run test.
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Precedence', function() {
	var section = 'Precedence';

	cmSpec.forEach(function(spec, shouldPassButFails) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

		messenger.test(spec, section, ignore);
	});
});


describe('CommonMark 0.28 Thematic breaks', function() {
	var section = 'Thematic breaks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [19];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 ATX headings', function() {
	var section = 'ATX headings';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [40, 45, 46, 49];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Setext headings', function() {
	var section = 'Setext headings';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [51, 52, 56, 62, 64];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Indented code blocks', function() {
	var section = 'Indented code blocks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [82];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Fenced code blocks', function() {
	var section = 'Fenced code blocks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [93, 95, 96, 97, 101, 102, 106, 108, 111, 112, 113];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 HTML blocks', function() {
	var section = 'HTML blocks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [132, 126, 147, 124, 120, 153, 133, 119, 127, 118, 
							      141, 116, 158, 123, 143, 130, 137, 140, 125, 134, 
							      131, 144, 145, 148, 139, 149, 129, 156, 135, 138, 
							      155];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Link reference definitions', function() {
	var section = 'Link reference definitions';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [167, 171];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Paragraphs', function() {
	var section = 'Paragraphs';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [185, 186];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Blank lines', function() {
	var section = 'Blank lines';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Block quotes', function() {
	var section = 'Block quotes';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [198, 199, 200, 201];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 List items', function() {
	var section = 'List items';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [229, 237, 236, 227, 218, 243, 259, 241, 239, 247, 
							      246, 225, 220, 258, 260, 244];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Lists', function() {
	var section = 'Lists';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [282, 270, 280, 278, 273, 275, 274, 264, 277, 265, 
							      276, 279, 267, 269];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Inlines', function() {
	var section = 'Inlines';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Backslash escapes', function() {
	var section = 'Backslash escapes';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [290, 291, 289, 293, 297, 301, 299, 298, 300];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Entity and numeric character references', function() {
	var section = 'Entity and numeric character references';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [311, 309, 310, 308];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Code spans', function() {
	var section = 'Code spans';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [330, 316, 327, 328, 320, 323, 322];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Emphasis and strong emphasis', function() {
	var section = 'Emphasis and strong emphasis';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [447, 450, 445, 409, 448, 444, 395, 402, 443, 396, 
							      398, 403, 372, 389, 456, 404, 371, 420, 455, 422, 
							      387, 414, 452, 458, 421, 457, 424, 451, 426, 423, 
							      416, 454, 349, 347, 453, 346, 353, 432, 378, 428, 
							      369, 332, 381, 431, 363, 359, 380, 360, 355, 356, 
							      342, 388, 364, 368, 433, 435, 434, 392, 348, 382, 
							      436, 333, 449, 427, 377, 334];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Links', function() {
	var section = 'Links';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [499, 489, 471, 484, 466, 483, 535, 476, 474, 508, 
							      468, 523, 527, 475, 467, 509, 539, 464, 497, 473, 
							      507, 463, 492, 478, 504, 514, 479, 491, 512, 477, 
							      503, 513, 496, 470, 495, 505, 490, 469, 465];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Images', function() {
	var section = 'Images';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [556, 465, 548, 545, 544, 546, 558, 547, 560];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Autolinks', function() {
	var section = 'Autolinks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [582, 574, 573, 579, 583];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Raw HTML', function() {
	var section = 'Raw HTML';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [590, 595, 597, 598, 599, 600, 601, 604];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Hard line breaks', function() {
	var section = 'Hard line breaks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [611, 606, 609, 613];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Soft line breaks', function() {
	var section = 'Soft line breaks';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [621];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});

describe('CommonMark 0.28 Textual content', function() {
	var section = 'Textual content';

	cmSpec.forEach(function(spec) {
		// var shouldPassButFails = [];
		var shouldPassButFails = [];

		var willNotBeAttemptedByCoreTeam = [];

		var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);
		
		messenger.test(spec, section, ignore);
	});
});