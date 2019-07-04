/**
 * Lib entry
 */

import {
  merge, escape, getDefaultOptions,
} from './utils'

import Lexer from './lexer'
import Parser from './parser'
import Renderer from './render'
import TextRenderer from './renderText'
import InlineLexer from './inlineLexer'
import Slugger from './slugger'

class Marked {
  constructor() {
    this.defaults = getDefaultOptions(Renderer)
  }

  getDefaults() {
    return this.defaults
  }

  setOptions(opt) {
    merge(this.defaults, opt);
    return this.marked
  }

  marked(src, opt, callback) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
      throw new Error('marked(): input parameter is of type '
        + Object.prototype.toString.call(src) + ', string expected');
    }

    if (callback || typeof opt === 'function') {
      if (!callback) {
        callback = opt;
        opt = null;
      }

      opt = merge({}, this.defaults, opt || {});

      var highlight = opt.highlight,
          tokens,
          pending,
          i = 0;

      try {
        tokens = Lexer.lex(src, opt);
      } catch (e) {
        return callback(e);
      }

      pending = tokens.length;

      var done = function(err) {
        if (err) {
          opt.highlight = highlight;
          return callback(err);
        }

        var out;

        try {
          out = Parser.parse(tokens, opt);
        } catch (e) {
          err = e;
        }

        opt.highlight = highlight;

        return err
          ? callback(err)
          : callback(null, out);
      };

      if (!highlight || highlight.length < 3) {
        return done();
      }

      delete opt.highlight;

      if (!pending) return done();

      for (; i < tokens.length; i++) {
        (function(token) {
          if (token.type !== 'code') {
            return --pending || done();
          }
          return highlight(token.text, token.lang, function(err, code) {
            if (err) return done(err);
            if (code == null || code === token.text) {
              return --pending || done();
            }
            token.text = code;
            token.escaped = true;
            --pending || done();
          });
        })(tokens[i]);
      }

      return;
    }
    try {
      if (opt) opt = merge({}, this.defaults, opt);
      return Parser.parse(Lexer.lex(src, opt), opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';
      if ((opt || this.defaults).silent) {
        return '<p>An error occurred:</p><pre>'
          + escape(e.message + '', true)
          + '</pre>';
      }
      throw e;
    }
  }

  Renderer(...rest) {
    return Renderer(...rest)
  }

  TextRenderer(...rest) {
    return TextRenderer(...rest)
  }

  Slugger(...rest) {
    return Slugger(...rest)
  }

  Parser(...rest) {
    return Parser(...rest)
  }

  parser(...rest) {
    return Parser.parse(...rest)
  }

  Lexer(...rest) {
    return Lexer(...rest)
  }

  lexer(...rest) {
    return Lexer.lex(...rest)
  }

  InlineLexer(...rest) {
    return InlineLexer(...rest)
  }

  inlineLexer(...rest) {
    return InlineLexer.output(...rest)
  }

  parse(...rest) {
    return this.marked(...rest)
  }
}

const marked = new Marked()

export default marked
