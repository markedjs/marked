var marked = require('../../'),
    fs = require('fs'),
    path = require('path');
var tests = [], failed = 0;
var test = tests.push;

test(function() {
  var content = fs.readFileSync(path.join(__dirname, './resources/complex_html.md'), 'utf8');
  var nodes = marked.lexer(content);
  assertEqual('heading', nodes[0].type);
  assertEqual('html', nodes[1].type);
  assertEqual('<div>\nThis HTML has\n<div>\nNested Divs\n</div>\n\n<div>\nIn a messy structure\n</div>\n\n</div>', nodes[1].text);
  assertEqual(2, nodes.length);
});

function assertEqual(expected, actual) {
  if (expected !== actual) {
    throw "Expected: "+expected+"\nActual: "+actual;
  }
}

console.log('\nLexer tests\n-----------');
tests.forEach(function(t) {
  try {
    t();
  } catch(e) {
    console.log("Failed:", e);
    failed += 1;
  }
});
console.log(failed === 0 ? 'All tests passed' : failed + ' tests failed');
