var marked = require('../../marked.min.js');
var HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer();
var since = require('jasmine2-custom-message');

it('should run the test', function () {
  expect(marked('Hello World!')).toBe('<p>Hello World!</p>\n');
});

// http://spec.commonmark.org/0.28/#example-230
it('should start an ordered list at 0 when requested', function () {
  expect(
    marked('0. ok')).
    toBe("<ol start=\"0\">\n<li>ok</li>\n</ol>\n")
});

// http://spec.commonmark.org/0.28/#example-234
it('indents code within an explicitly-started ordered list', function () {
  expect(marked("  10.  foo\n\n           bar")).
  toBe("<ol start=\"10\">\n<li><p>foo</p>\n<pre><code>bar\n</code></pre></li>\n</ol>\n");
});

it('should be able to change options', function() {
	marked.setOptions({ xhtml: true });
	expect(marked.options.xhtml).toBe(true);
});

it('should add header ID by default', function () {
  var markdown = '# hello';

  var expected = '<h1 id="hello">hello</h1>';
  var actual = marked(markdown);
  
  var message = 'Default options adds header id:\n' 
                + markdown 
                + '\n------\n\nExpected:\n' + expected 
                + '\n------\n\nMarked:\n' + actual;  
  
  var diff = htmlDiffer.isEqual(expected, actual);
  
  since(message).expect(diff).toBe(true);

});

it('should NOT add header ID when option is false', function () {
  marked.setOptions({ headerIds: false });

  var markdown = '# hello';
  var expected = '<h1>hello</h1>';
  var actual = marked(markdown);

  var message = 'Custom options does NOT adds header id:\n' 
                + markdown 
                + '\n------\n\nExpected:\n' + expected 
                + '\n------\n\nMarked:\n' + actual + '\n\n'
                + JSON.stringify(marked.options);  
  
  var diff = htmlDiffer.isEqual(expected, actual);
  
  since(message).expect(diff).toBe(true);

});
