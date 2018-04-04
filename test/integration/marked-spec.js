// Make explicit that marked is the system under test
var sut = require('../../lib/marked.js');

var HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer();
var since = require('jasmine2-custom-message');

it('should run the test', function () {
  expect(sut('Hello World!')).toBe('<p>Hello World!</p>\n');
});

// http://spec.commonmark.org/0.28/#example-230
it('should start an ordered list at 0 when requested', function () {
  expect(
    sut('0. ok')).
    toBe("<ol start=\"0\">\n<li>ok</li>\n</ol>\n")
});

// http://spec.commonmark.org/0.28/#example-234
it('indents code within an explicitly-started ordered list', function () {
  expect(sut("  10.  foo\n\n           bar")).
  toBe("<ol start=\"10\">\n<li><p>foo</p>\n<pre><code>bar\n</code></pre></li>\n</ol>\n");
});
