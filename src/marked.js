import Lexer from './lexer';
import Parser from './parser';
import Renderer from './renderer';
import InlineLexer from './inlineLexer';
import TextRenderer from './textRenderer';

const marked = function marked(src, opt, callback) {
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

    opt = { ...marked.defaults, ...(opt || {}) };

    const highlight = opt.highlight;
    let tokens;
    let pending;
    let i = 0;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    const done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      let out;

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
      const token = tokens[i];
      if (token.type !== 'code') {
        return --pending || done();
      }
      return highlight(token.text, token.lang, (err, code) => {
        if (err) return done(err);
        if (code == null || code === token.text) {
          return --pending || done();
        }
        token.text = code;
        token.escaped = true;
        --pending || done();
      });
    }

    return;
  }
  try {
    if (opt) opt = { ...marked.defaults, ...opt };
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
};

marked.getDefaults = function() {
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
marked.Parser = Parser;
marked.Renderer = Renderer;
marked.Lexer = Lexer;
marked.InlineLexer = InlineLexer;
marked.TextRenderer = TextRenderer;

marked.parser = Parser.parse;
marked.lexer = Lexer.lex;
marked.inlineLexer = InlineLexer.output;

marked.setOptions = (opt) => {
  for (const k in opt) {
    if (opt.hasOwnProperty(k)) {
      marked.defaults[k] = opt[k];
    }
  }
};

marked.options = marked.setOptions;
marked.parse = marked;

export default marked;
