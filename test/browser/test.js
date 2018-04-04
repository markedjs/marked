
;(function() {
  var console = {},
      files = __TESTS__; // eslint-disable-line no-undef

  console.log = function(text) {
    var args = Array.prototype.slice.call(arguments, 1),
        i = 0;

    text = text.replace(/%\w/g, function() {
      return args[i++] || '';
    });

    if (window.console) window.console.log(text);
    document.body.innerHTML += '<pre>' + escape(text) + '</pre>';
  };

  if (!Object.keys) {
    Object.keys = function(obj) {
      var out = [],
          key;

      for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          out.push(key);
        }
      }

      return out;
    };
  }

  if (!Array.prototype.forEach) {
    // eslint-disable-next-line no-extend-native
    Array.prototype.forEach = function(callback, context) {
      for (var i = 0; i < this.length; i++) {
        callback.call(context || null, this[i], i, this);
      }
    };
  }

  if (!String.prototype.trim) {
    // eslint-disable-next-line no-extend-native
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  // eslint-disable-next-line no-unused-vars
  function load() {
    return files;
  }

  function escape(html, encode) {
    return html
      .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  __LIBS__; // eslint-disable-line no-undef, no-unused-expressions

  (__MAIN__)(); // eslint-disable-line no-undef
}).call(this);
