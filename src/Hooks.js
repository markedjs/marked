const { defaults } = require('./defaults.js');
const Slugger = require('./Slugger.js');
const {
  escape,
  unescape
} = require('./helpers.js');

module.exports = class Hooks {
  constructor(options) {
    this.options = options || defaults;
    this.slugger = new Slugger();
  }

  preprocess(markdown) {
    return markdown;
  }

  postprocess(html) {
    return html;
  }

  sanitize(text) {
    return text;
  }

  smartypants(text) {
    return text;
  }

  error(ex) {
    throw ex;
  }

  escape(text) {
    return escape(text, false);
  }

  unescape(html) {
    return unescape(html);
  }

  languageClass(lang) {
    return 'language-' + this.encode(lang);
  }

  encode(text) {
    return escape(text, true);
  }

  headerId(text) {
    return this.slugger.slug(text);
  }

  cleanUrl(href) {
    try {
      return encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
      return null;
    }
  }

  /**
   * mangle email address
   */
  mangle(text) {
    let out = '',
      i,
      ch;

    const l = text.length;
    for (i = 0; i < l; i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }
      out += '&#' + ch + ';';
    }

    return out;
  }

  highlight(code, lang, callback) {
    if (typeof callback === 'function') {
      callback(null, null);
    }
    return null;
  }

  static get nullHooks() {
    return {
      preprocess: (s) => s,
      postprocess: (s) => s,
      sanitize: (s) => s,
      smartypants: (s) => s,
      error: () => {},
      escape: (s) => s,
      unescape: (s) => s,
      languageClass: (s) => s,
      encode: (s) => s,
      headerId: () => null,
      cleanUrl: (s) => s,
      mangle: (s) => s,
      highlight: (code, lang, callback) => {
        if (typeof callback === 'function') {
          callback(null, null);
        }
        return null;
      }
    };
  }
};
