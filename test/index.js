/**
 * Test
 */

var md = require('../')
  , assert = require('assert')
  , fs = require('fs')
  , text = fs.readFileSync(__dirname + '/in.md', 'utf8');

var a = md(text)
  , b = fs.readFileSync(__dirname + '/out.md', 'utf8');

console.log(a);
console.log('----------------------------------------------------------------');
console.log(b);

a = a.replace(/\s+/g, '');
b = b.replace(/\s+/g, '');

assert.ok(a === b, 'Failed.');
console.log('Complete.');