/**
 * Test
 */

var marked = require('../')
  , assert = require('assert')
  , fs = require('fs')
  , text = fs.readFileSync(__dirname + '/in.md', 'utf8');

var a = marked(text)
  , b = fs.readFileSync(__dirname + '/out.html', 'utf8');

console.log(a);
console.log('----------------------------------------------------------------');
console.log(b);
console.log('----------------------------------------------------------------');

a = a.replace(/\s+/g, '');
b = b.replace(/\s+/g, '');

assert.ok(a === b, 'Failed.');
console.log('Complete.');
