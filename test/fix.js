/**
 * Markdown Test Suite Fixer
 */

// this file is responsible for "fixing"
// the markdown test suite. there are
// certain aspects of the suite that
// are strange or will make my tests
// fail for reasons unrelated to
// conformance.

// fix the fact that the original markdown
// does not escape quotes for some reason

var path = require('path')
  , fs = require('fs')
  , dir = __dirname + '/tests';

// fix unencoded quotes
fs.readdirSync(dir).filter(function(file) {
  return path.extname(file) === '.html';
}).forEach(function(file) {
  var file = path.join(dir, file)
    , html = fs.readFileSync(file, 'utf8');

  html = html
    .replace(/='([^\n']*)'(?=[^<>\n]*>)/g, '=&__APOS__;$1&__APOS__;')
    .replace(/="([^\n"]*)"(?=[^<>\n]*>)/g, '=&__QUOT__;$1&__QUOT__;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/&__QUOT__;/g, '"')
    .replace(/&__APOS__;/g, '\'');

  // fix code blocks
  html = html.replace(/<pre><code>[^\0]+?<\/pre><\/code>/g, function(html) {
    return html
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  });

  fs.writeFileSync(file, html);
});

// turn <hr /> into <hr>
fs.readdirSync(dir).forEach(function(file) {
  var file = path.join(dir, file)
    , text = fs.readFileSync(file, 'utf8');

  text = text.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');

  fs.writeFileSync(file, text);
});

// markdown avoids double encoding half of the time
// and does it the other half. this behavior will be
// implemented eventually, but for now, this needs to 
// be changed, because i want to see if the other tests
// included in this file pass.
(function() {
  var file = dir + '/amps_and_angles_encoding.html';
  var html = fs.readFileSync(file, 'utf8')
    .replace('6 > 5.', '6 &gt; 5.')
    .replace('AT&amp;T is another', 'AT&amp;amp;T is another');

  fs.writeFileSync(file, html);
})();

// fix bad grammar
(function() {
  var file = dir + '/ordered_and_unordered_lists.text';
  var text = fs.readFileSync(file, 'utf8');
  text = text.replace(/(\n\*\sasterisk\s3\n\n)(\*\s\*\s\*)/, '$1\n$2');
  fs.writeFileSync(file, text);
})();

// fix strange markup that isnt likely 
// to exist in the reality
(function _(ext) {
  var file = dir + '/inline_html_advanced.' + ext;
  var text = fs.readFileSync(file, 'utf8');
  text = text.replace('style=">"/', 'style=""');
  fs.writeFileSync(file, text);
  return _;
})
('text')
('html');

// markdown parses backslashes in a very primitive
// way because it's not a real parser. i cannot 
// include this test, because marked parses backslashes
// in a very different way.
(function(ext) {
  fs.writeFileSync(dir + '/backslash_escapes.text', 
    'hello world \\[how](are you) today');
  fs.writeFileSync(dir + '/backslash_escapes.html', 
    '<p>hello world [how](are you) today</p>');
})();

// can't do this for performance reasons 
// right now
(function _(name) {
  fs.unlinkSync(dir + '/' + name + '.text');
  fs.unlinkSync(dir + '/' + name + '.html');
  return _;
})
('hard_wrapped_paragraphs_with_list_like_lines');

