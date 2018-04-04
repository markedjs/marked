var marked = require('../../marked.min.js');
var cmSpec = require('./commonmark.json');
var HtmlDiffer = require('html-differ').HtmlDiffer;
var since = require('jasmine2-custom-message');

describe('CommonMark 0.28', function() {
	var htmlDiffer = new HtmlDiffer();
	cmSpec.forEach(function(spec) {
		var consoleString = 'should pass example ' + spec.example;

		// Remove XHTML closing slash (~30 examples from CM spec use HTML explicit closure)
		var expected = spec.html.replace(' />', '>');

		// marked.setOptions({ headerIds: false });
		var renderer = new marked.Renderer({ headerIds: false });
		var actual = marked(spec.markdown);

		var message = 'CommonMark (' + spec.section + '):\n' 
			+ spec.markdown 
			+ '\n------\n\nExpected:\n' + expected 
			+ '\n------\n\nMarked:\n' + actual;

		var diff = htmlDiffer.isEqual(expected, actual);

		// Toggle shouldPassButFails to run all spec-based example tests.
		// 
		// 
		var shouldPassButFails = [];
		// var shouldPassButFails = [1, 2, 3, 7, 10, 13, 17, 19, 29, 32, 36, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 
		// 	              51, 52, 53, 55, 56, 58, 59, 60, 62, 64, 65, 67, 71, 72, 82, 84, 93, 95, 96, 97, 101, 102, 106, 108,
		// 	              110, 111, 112, 113, 116, 118, 119, 120, 123, 124, 125, 126, 127, 129, 130, 131, 132, 133, 134, 135,
		// 	              137, 138, 139, 140, 141, 143, 144, 145, 147, 148, 149, 153, 155, 156, 158, 167, 171, 179, 185, 186,
		// 	              190, 191, 192, 193, 195, 198, 199, 200, 201, 218, 220, 225, 227, 229, 236, 237, 239, 241, 243, 244,
		// 	              246, 247, 258, 259, 260, 263, 264, 265, 267, 269, 270, 273, 274, 275, 276, 277, 278, 279, 280, 282,
		// 	              289, 290, 291, 293, 297, 298, 299, 300, 301, 308, 309, 310, 311, 316, 320, 322, 323, 327, 328, 330,
		// 	              332, 333, 334, 342, 346, 347, 348, 349, 353, 355, 356, 359, 360, 363, 364, 368, 369, 371, 372, 377,
		// 	              378, 380, 381, 382, 387, 388, 389, 392, 395, 396, 398, 402, 403, 404, 409, 414, 416, 420, 421, 422,
		// 	              423, 424, 426, 427, 428, 431, 432, 433, 434, 435, 436, 443, 444, 445, 447, 448, 449, 450, 451, 452,
		// 	              453, 454, 455, 456, 457, 458, 463, 464, 465, 466, 467, 468, 469, 470, 471, 473, 474, 475, 476, 477,
		// 	              478, 479, 483, 484, 489, 490, 491, 492, 495, 496, 497, 499, 503, 504, 505, 507, 508, 509, 512, 513,
		// 	              514, 523, 527, 535, 539, 544, 545, 546, 547, 548, 556, 558, 560, 573, 574, 579, 582, 583, 586, 587,
		// 	              588, 590, 595, 597, 598, 599, 600, 601, 604, 606, 609, 611, 613, 618, 619, 621];

		if (shouldPassButFails.indexOf(spec.example) < 0) {
			it(consoleString, function() {
				since(message).expect(
					diff
				).toEqual(true);
			});
		}
	});
});

