var fs = require('fs')
  , text = fs.readFileSync(__dirname + '/in.md', 'utf8');

var benchmark = function(func, t) {
  var start = new Date()
    , i = t || 10000;
  while (i--) func();
  console.log('%s: %sms', func.name, new Date() - start);
};

var marked_ = require('../');
benchmark(function marked() {
  marked_(text);
});

/**
 * There's two ways to benchmark showdown here.
 * The first way is to create a new converter
 * every time, this will renew any closured
 * variables. It is the "proper" way of using
 * showdown. However, for this benchmark, 
 * I will use the completely improper method
 * which is must faster, just to be fair.
 */

var showdown_ = (function() {
  var Showdown = require('showdown').Showdown;
  var convert = new Showdown.converter();
  return function(str) {
    return convert.makeHtml(str);
  };
})();
benchmark(function showdown() {
  showdown_(text);
});

var markdownjs_ = require('markdown-js');
benchmark(function markdownjs() {
  markdownjs_.toHTML(text);
});
