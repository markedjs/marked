var compose = require('fn-compose');

var ellipses = require('typographic-ellipses');
var singleSpaces = require('typographic-single-spaces');

var apostrophes = require('typographic-apostrophes');
var quotes = require('typographic-quotes');
var apostrophesForPlurals = require('typographic-apostrophes-for-possessive-plurals');

var endashes = require('typographic-en-dashes');
var emdashes = require('typographic-em-dashes');

module.exports = compose(
  apostrophes,
  quotes,
  apostrophesForPlurals,
  endashes,
  emdashes,
  ellipses,
  singleSpaces
);
