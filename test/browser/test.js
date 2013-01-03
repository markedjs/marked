;(function() {

var files = __TESTS__;

var BREAK_ON_ERROR = false;

function print(text) {
  var args = Array.prototype.slice.call(arguments, 1)
    , i = 0;

  text = text.replace(/%\w/g, function() {
    return args[i++] || '';
  });

  if (window.console) window.console.log(text);
  document.body.innerHTML += '<pre>' + escape(text) + '</pre>';
}

var console = { log: print };

function load() {}

Object.keys = Object.keys || function(obj) {
  var out = []
    , key;

  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out.push(key);
    }
  }

  return out;
};

String.prototype.trim = String.prototype.trim || function() {
  return this.replace(/^\s+|\s+$/g, '');
};

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

(__MAIN__)();

}).call(this);
