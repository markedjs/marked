var fs = require('fs')
  , text = fs.readFileSync(__dirname + '/in.md', 'utf8');

var benchmark = function(func, t) {
  var start = new Date()
    , i = t || 10000;
  while (i--) func();
  console.log('%s: %sms', func.name, new Date() - start);
};

var md_ = require('../');
benchmark(function md() {
  md_(text);
});

var showdown_ = require('showdown');
benchmark(function showdown() {
  showdown_(text);
});

var markdown_ = require('markdown');
benchmark(function markdownjs() {
  markdown_.toHTML(text);
});