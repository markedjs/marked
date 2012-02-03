/**
 * Markdown Test Suite Fixer
 */

// this file is responsible for "fixing"
// the markdown test suite. there are
// certain aspects of the suite that
// are strange or will make my tests
// fail for reasons unrelated to
// conformance.

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
    .replace(/'/g, '&#39;')
    .replace(/&__QUOT__;/g, '"')
    .replace(/&__APOS__;/g, '\'');

  fs.writeFileSync(file, html);
});

// turn <hr /> into <hr>
fs.readdirSync(dir).forEach(function(file) {
  var file = path.join(dir, file)
    , text = fs.readFileSync(file, 'utf8');

  text = text.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');

  fs.writeFileSync(file, text);
});

// markdown does some strange things.
// it does not encode naked `>`, marked does.
(function() {
  var file = dir + '/amps_and_angles_encoding.html';
  var html = fs.readFileSync(file, 'utf8')
    .replace('6 > 5.', '6 &gt; 5.');

  fs.writeFileSync(file, html);
})();
