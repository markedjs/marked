const { defaults } = require('./defaults.js');
const {
  escape,
  unescape
} = require('./helpers.js');

module.exports = class Hooks {
  constructor(options) {
    this.options = options || defaults;
  }

  /**
   * Process markdown before marked
   */
  preprocess(markdown) {
    return markdown;
  }

  /**
   * Process HTML after marked is finished
   */
  postprocess(html) {
    return html;
  }

  /**
   * Sanitize HTML
   */
  sanitize(text) {
    return text;
  }

  /**
   * Apply smartypants transformation on text
   */
  smartypants(text) {
    return text;
  }

  /**
   * Handle marked error
   */
  error(ex) {
    throw ex;
  }

  /**
   * escape html entities for attributes
   */
  escape(text) {
    return escape(text, false);
  }

  /**
   * Unescape header text for id
   */
  unescape(html) {
    return unescape(html);
  }

  /**
   * code language class
   */
  languageClass(lang) {
    if (!lang) {
      return '';
    }
    return 'language-' + this.encode(lang);
  }

  /**
   * encode html entities for code blocks
   */
  encode(text) {
    return escape(text, true);
  }

  /**
   * create header id
   */
  headerId(text, slugger) {
    return slugger.slug(text);
  }

  /**
   * clean href
   */
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

  /**
   * highlight code
   */
  highlight(code, lang, callback) {
    if (typeof callback === 'function') {
      callback(null, null);
    }
    return null;
  }

  /**
   * null hooks when hooks === false
   */
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
