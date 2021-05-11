const Lexer = require('./Lexer.js');
const Parser = require('./Parser.js');
const Tokenizer = require('./Tokenizer.js');
const Renderer = require('./Renderer.js');
const TextRenderer = require('./TextRenderer.js');
const Slugger = require('./Slugger.js');
const {
  merge,
  checkSanitizeDeprecation,
  escape
} = require('./helpers.js');
const {
  getDefaults,
  changeDefaults,
  defaults
} = require('./defaults.js');

/**
 * Marked
 */
function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }
  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type '
      + Object.prototype.toString.call(src) + ', string expected');
  }

  if (typeof opt === 'function') {
    callback = opt;
    opt = null;
  }

  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);

  if (callback) {
    const highlight = opt.highlight;
    let tokens;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    const done = function(err) {
      let out;

      if (!err) {
        try {
          if (opt.walkTokens) {
            marked.walkTokens(tokens, opt.walkTokens);
          }
          out = Parser.parse(tokens, opt);
        } catch (e) {
          err = e;
        }
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

    if (!tokens.length) return done();

    let pending = 0;
    marked.walkTokens(tokens, function(token) {
      if (token.type === 'code') {
        pending++;
        setTimeout(() => {
          highlight(token.text, token.lang, function(err, code) {
            if (err) {
              return done(err);
            }
            if (code != null && code !== token.text) {
              token.text = code;
              token.escaped = true;
            }

            pending--;
            if (pending === 0) {
              done();
            }
          });
        }, 0);
      }
    });

    if (pending === 0) {
      done();
    }

    return;
  }

  try {
    const tokens = Lexer.lex(src, opt);
    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }
    return Parser.parse(tokens, opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if (opt.silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  changeDefaults(marked.defaults);
  return marked;
};

marked.getDefaults = getDefaults;

marked.defaults = defaults;

/**
 * Use Extension
 */

marked.use = function(extension) {
  if (!Array.isArray(extension)) { // Wrap in array if not already to unify processing
    extension = [extension];
  }
  const opts = merge({}, ...extension);
  opts.tokenizer = null;
  opts.renderer = null;
  const extensions = {};

  extension.forEach((ext) => {
    //= =-- Parse "addon" extensions --==//
    if (ext.renderer && ext.name) { // Renderers must have 'name' property
      extensions[ext.name] = ext.renderer;
    }
    if (ext.tokenizer && ext.before) { // Tokenizers must have 'before' property
      if (extensions[ext.before]) {
        extensions[ext.before].push(ext.tokenizer);
      } else {
        extensions[ext.before] = [ext.tokenizer];
      }
      if (ext.start && ext.level) { // Start regex must have 'level' property
        if (ext.level === 'block') {
          extensions.startBlock = extensions.startBlock
            ? new RegExp(extensions.startBlock.source + '|' + ext.start.source)
            : ext.start;
        } else if (ext.level === 'inline') {
          extensions.startInline = extensions.startInline
            ? new RegExp(extensions.startInline.source + '|' + ext.start.source)
            : ext.start;
        }
      }
    }
    if (Object.keys(extensions).length) {
      opts.extensions = extensions;
    }

    //= =-- Parse "overwrite" extensions --==//
    if (ext.renderer && !ext.name) {
      const renderer = marked.defaults.renderer || new Renderer();
      for (const prop in ext.renderer) {
        const prevRenderer = renderer[prop];
        renderer[prop] = (...args) => {
          let ret = ext.renderer[prop].apply(renderer, args);
          if (ret === false) {
            ret = prevRenderer.apply(renderer, args);
          }
          return ret;
        };
      }
      opts.renderer = renderer;
    }
    if (ext.tokenizer && !ext.before) {
      const tokenizer = marked.defaults.tokenizer || new Tokenizer();
      for (const prop in ext.tokenizer) {
        const prevTokenizer = tokenizer[prop];
        tokenizer[prop] = (...args) => {
          let ret = ext.tokenizer[prop].apply(tokenizer, args);
          if (ret === false) {
            ret = prevTokenizer.apply(tokenizer, args);
          }
          return ret;
        };
      }
      opts.tokenizer = tokenizer;
    }

    //= =-- Parse WalkTokens extensions --==//
    if (ext.walkTokens) {
      const walkTokens = marked.defaults.walkTokens;
      opts.walkTokens = (token) => {
        ext.walkTokens(token);
        if (walkTokens) {
          walkTokens(token);
        }
      };
    }
  });

  marked.setOptions(opts);
};

/**
 * Run callback for every token
 */

marked.walkTokens = function(tokens, callback) {
  for (const token of tokens) {
    callback(token);
    switch (token.type) {
      case 'table': {
        for (const cell of token.tokens.header) {
          marked.walkTokens(cell, callback);
        }
        for (const row of token.tokens.cells) {
          for (const cell of row) {
            marked.walkTokens(cell, callback);
          }
        }
        break;
      }
      case 'list': {
        marked.walkTokens(token.items, callback);
        break;
      }
      default: {
        if (token.tokens) {
          marked.walkTokens(token.tokens, callback);
        }
      }
    }
  }
};

/**
 * Parse Inline
 */
marked.parseInline = function(src, opt) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked.parseInline(): input parameter is undefined or null');
  }
  if (typeof src !== 'string') {
    throw new Error('marked.parseInline(): input parameter is of type '
      + Object.prototype.toString.call(src) + ', string expected');
  }

  opt = merge({}, marked.defaults, opt || {});
  checkSanitizeDeprecation(opt);

  try {
    const tokens = Lexer.lexInline(src, opt);
    if (opt.walkTokens) {
      marked.walkTokens(tokens, opt.walkTokens);
    }
    return Parser.parseInline(tokens, opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if (opt.silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.Tokenizer = Tokenizer;

marked.Slugger = Slugger;

marked.parse = marked;

module.exports = marked;
