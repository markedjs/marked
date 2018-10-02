"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lexer = _interopRequireDefault(require("./lexer"));

var _parser = _interopRequireDefault(require("./parser"));

var _renderer = _interopRequireDefault(require("./renderer"));

var _inlineLexer = _interopRequireDefault(require("./inlineLexer"));

var _textRenderer = _interopRequireDefault(require("./textRenderer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var marked = function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }

  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
  }

  if (callback || typeof opt === 'function') {
    var _ret = function () {
      if (!callback) {
        callback = opt;
        opt = null;
      }

      opt = _objectSpread({}, marked.defaults, opt || {});
      var highlight = opt.highlight;
      var tokens;
      var pending;
      var i = 0;

      try {
        tokens = _lexer.default.lex(src, opt);
      } catch (e) {
        return {
          v: callback(e)
        };
      }

      pending = tokens.length;

      var done = function done(err) {
        if (err) {
          opt.highlight = highlight;
          return callback(err);
        }

        var out;

        try {
          out = _parser.default.parse(tokens, opt);
        } catch (e) {
          err = e;
        }

        opt.highlight = highlight;
        return err ? callback(err) : callback(null, out);
      };

      if (!highlight || highlight.length < 3) {
        return {
          v: done()
        };
      }

      delete opt.highlight;
      if (!pending) return {
        v: done()
      };

      var _loop = function _loop() {
        var token = tokens[i];

        if (token.type !== 'code') {
          return {
            v: {
              v: --pending || done()
            }
          };
        }

        return {
          v: {
            v: highlight(token.text, token.lang, function (err, code) {
              if (err) return done(err);

              if (code == null || code === token.text) {
                return --pending || done();
              }

              token.text = code;
              token.escaped = true;
              --pending || done();
            })
          }
        };
      };

      for (; i < tokens.length; i++) {
        var _ret2 = _loop();

        if (_typeof(_ret2) === "object") return _ret2.v;
      }

      return {
        v: void 0
      };
    }();

    if (_typeof(_ret) === "object") return _ret.v;
  }

  try {
    if (opt) opt = _objectSpread({}, marked.defaults, opt);
    return _parser.default.parse(_lexer.default.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';

    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
    }

    throw e;
  }
};

marked.getDefaults = function () {
  return {
    baseUrl: null,
    breaks: false,
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    highlight: null,
    langPrefix: 'language-',
    mangle: true,
    pedantic: false,
    renderer: null,
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    tables: true,
    xhtml: false
  };
};

marked.defaults = marked.getDefaults();
marked.Parser = _parser.default;
marked.Renderer = _renderer.default;
marked.Lexer = _lexer.default;
marked.InlineLexer = _inlineLexer.default;
marked.TextRenderer = _textRenderer.default;
marked.parser = _parser.default.parse;
marked.lexer = _lexer.default.lex;
marked.inlineLexer = _inlineLexer.default.output;

marked.setOptions = function (opt) {
  for (var k in opt) {
    if (opt.hasOwnProperty(k)) {
      marked.defaults[k] = opt[k];
    }
  }
};

marked.options = marked.setOptions;
marked.parse = marked;
var _default = marked;
exports.default = _default;
module.exports = exports.default;