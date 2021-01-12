const Tokenizer = require('./Tokenizer.js');
const { defaults } = require('./defaults.js');
const { block, inline } = require('./rules.js');
const { repeatString } = require('./helpers.js');
// Function.prototype.bind = require('fast-bind');

/**
 * smartypants text replacement
 */
function smartypants(text) {
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
}

/**
 * mangle email addresses
 */
function mangle(text) {
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
 * Block Lexer
 */
module.exports = class Lexer {
  constructor(options) {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.options = options || defaults;
    this.options.tokenizer = this.options.tokenizer || new Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;

    const rules = {
      block: block.normal,
      inline: inline.normal
    };

    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;

    this.blockTokenizers = [
      { name: 'newline', func: this.newline },
      { name: 'code', func: this.code },
      { name: 'fences', func: this.fences },
      { name: 'nptable', func: this.nptable },
      { name: 'heading', func: this.heading },
      { name: 'hr', func: this.hr },
      { name: 'blockquote', func: this.blockquote },
      { name: 'list', func: this.list },
      { name: 'html', func: this.html },
      { name: 'def', func: this.def },
      { name: 'table', func: this.table },
      { name: 'lheading', func: this.lheading },
      { name: 'paragraph', func: this.paragraph },
      { name: 'text', func: this.text }
    ];

    this.inlineTokenizers = [
      { name: 'escape', func: this.escape },
      { name: 'tag', func: this.tag },
      { name: 'link', func: this.link },
      { name: 'reflink', func: this.reflink },
      { name: 'strong', func: this.strong },
      { name: 'em', func: this.em },
      { name: 'codespan', func: this.codespan },
      { name: 'br', func: this.br },
      { name: 'del', func: this.del },
      { name: 'autolink', func: this.autolink },
      { name: 'url', func: this.url },
      { name: 'inlineText', func: this.inlineText }
    ];
  }

  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block,
      inline
    };
  }

  /**
   * Static Lex Method
   */
  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
  }

  /**
   * Static Lex Inline Method
   */
  static lexInline(src, options) {
    const lexer = new Lexer(options);
    return lexer.inlineTokens(src);
  }

  /**
   * Preprocessing
   */
  lex(src) {
    src = src
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ');

    this.blockTokens(src, this.tokens, true);

    this.inline(this.tokens);

    return this.tokens;
  }

  /**
   * Lexing
   */

  //= === Block tokenizers ====//
  // newline
  newline(c, src, params) {
    let token;
    if (token = c.tokenizer.space(src)) {
      return token;
    }
  }

  // code
  code(c, src, params) {
    let token;
    if (token = c.tokenizer.code(src, params.lastToken)) {
      return token;
    }
  }

  // fences
  fences(c, src, params) {
    let token;
    if (token = c.tokenizer.fences(src)) {
      return token;
    }
  }

  // table no leading pipe (gfm)
  nptable(c, src, params) {
    let token;
    if (token = c.tokenizer.nptable(src)) {
      return token;
    }
  }

  // heading
  heading(c, src, params) {
    let token;
    if (token = c.tokenizer.heading(src)) {
      return token;
    }
  }

  // hr
  hr(c, src, params) {
    let token;
    if (token = c.tokenizer.hr(src)) {
      return token;
    }
  }

  // blockquote
  blockquote(c, src, params) {
    let token;
    if (token = c.tokenizer.blockquote(src)) {
      token.tokens = c.blockTokens(token.text, [], params.top);
      return token;
    }
  }

  // list
  list(c, src, params) {
    let token;
    if (token = c.tokenizer.list(src)) {
      const l = token.items.length;
      let i;
      for (i = 0; i < l; i++) {
        token.items[i].tokens = c.blockTokens(token.items[i].text, [], false);
      }
      return token;
    }
  }

  // html
  html(c, src, params) {
    let token;
    if (token = c.tokenizer.html(src)) {
      return token;
    }
  }

  // def
  def(c, src, params) {
    let token;
    if (params.top && (token = c.tokenizer.def(src))) {
      if (!c.tokens.links[token.tag]) {
        c.tokens.links[token.tag] = {
          href: token.href,
          title: token.title
        };
      }
      return token;
    }
  }

  // table (gfm)
  table(c, src, params) {
    let token;
    if (token = c.tokenizer.table(src)) {
      return token;
    }
  }

  // lheading
  lheading(c, src, params) {
    let token;
    if (token = c.tokenizer.lheading(src, params)) {
      return token;
    }
  }

  // top-level paragraph
  paragraph(c, src, params) {
    let token;
    if (params.top && (token = c.tokenizer.paragraph(src))) {
      return token;
    }
  }

  // text
  text(c, src, params) {
    let token;
    if (token = c.tokenizer.text(src, params.lastToken)) {
      return token;
    }
  }

  blockTokens(src, tokens = [], top = true) {
    let token;
    src = src.replace(/^ +$/gm, '');

    const blockParams = {
      top: top,
      lastToken: null
    };

    while (src) {
      if (this.blockTokenizers.some((fn) => token = fn.func(this, src, blockParams))) {
        src = src.substring(token.raw.length);
        if (token.type) {
          if (token.type === 'continue') {
            blockParams.lastToken.raw += '\n' + token.raw;
            blockParams.lastToken.text += '\n' + token.text;
          } else {
            tokens.push(token);
            blockParams.lastToken = token;
          }
        }
        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return tokens;
  }

  inline(tokens) {
    let i,
      j,
      k,
      l2,
      row,
      token;

    const l = tokens.length;
    for (i = 0; i < l; i++) {
      token = tokens[i];
      switch (token.type) {
        case 'paragraph':
        case 'text':
        case 'heading': {
          token.tokens = [];
          this.inlineTokens(token.text, token.tokens);
          break;
        }
        case 'table': {
          token.tokens = {
            header: [],
            cells: []
          };

          // header
          l2 = token.header.length;
          for (j = 0; j < l2; j++) {
            token.tokens.header[j] = [];
            this.inlineTokens(token.header[j], token.tokens.header[j]);
          }

          // cells
          l2 = token.cells.length;
          for (j = 0; j < l2; j++) {
            row = token.cells[j];
            token.tokens.cells[j] = [];
            for (k = 0; k < row.length; k++) {
              token.tokens.cells[j][k] = [];
              this.inlineTokens(row[k], token.tokens.cells[j][k]);
            }
          }

          break;
        }
        case 'blockquote': {
          this.inline(token.tokens);
          break;
        }
        case 'list': {
          l2 = token.items.length;
          for (j = 0; j < l2; j++) {
            this.inline(token.items[j].tokens);
          }
          break;
        }
        default: {
          // do nothing
        }
      }
    }

    return tokens;
  }

  //= === Inline Tokenizers ====//
  // escape
  escape(c, src, params) {
    let token;
    if (token = c.tokenizer.escape(src)) {
      return token;
    }
  }

  // tag
  tag(c, src, params) {
    let token;
    if (token = c.tokenizer.tag(src, params.inLink, params.inRawBlock)) {
      params.inLink = token.inLink;
      params.inRawBlock = token.inRawBlock;
      return token;
    }
  }

  // link
  link(c, src, params) {
    let token;
    if (token = c.tokenizer.link(src)) {
      if (token.type === 'link') {
        token.tokens = c.inlineTokens(token.text, [], true, params.inRawBlock);
      }
      return token;
    }
  }

  // reflink, nolink
  reflink(c, src, params) {
    let token;
    if (token = c.tokenizer.reflink(src, c.tokens.links)) {
      if (token.type === 'link') {
        token.tokens = c.inlineTokens(token.text, [], true, params.inRawBlock);
      }
      return token;
    }
  }

  // strong
  strong(c, src, params) {
    let token;
    if (token = c.tokenizer.strong(src, params.maskedSrc, params.prevChar)) {
      token.tokens = c.inlineTokens(token.text, [], params.inLink, params.inRawBlock);
      return token;
    }
  }

  // em
  em(c, src, params) {
    let token;
    if (token = c.tokenizer.em(src, params.maskedSrc, params.prevChar)) {
      token.tokens = c.inlineTokens(token.text, [], params.inLink, params.inRawBlock);
      return token;
    }
  }

  // code
  codespan(c, src, params) {
    let token;
    if (token = c.tokenizer.codespan(src)) {
      return token;
    }
  }

  // br
  br(c, src, params) {
    let token;
    if (token = c.tokenizer.br(src)) {
      return token;
    }
  }

  // del (gfm)
  del(c, src, params) {
    let token;
    if (token = c.tokenizer.del(src)) {
      token.tokens = c.inlineTokens(token.text, [], params.inLink, params.inRawBlock);
      return token;
    }
  }

  // autolink
  autolink(c, src, params) {
    let token;
    if (token = c.tokenizer.autolink(src, params.mangle)) {
      return token;
    }
  }

  // url (gfm)
  url(c, src, params) {
    let token;
    if (!params.inLink && (token = c.tokenizer.url(src, params.mangle))) {
      return token;
    }
  }

  // text
  inlineText(c, src, params) {
    let token;
    if (token = c.tokenizer.inlineText(src, params.inRawBlock, params.smartypants)) {
      params.prevChar = token.raw.slice(-1);
      params.keepPrevChar = true;
      return token;
    }
  }

  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = [], inLink = false, inRawBlock = false) {
    let match, token;
    let maskedSrc = src;

    // Mask out reflinks to avoid interference with em and strong
    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);
      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
            maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    }
    // Mask out other blocks
    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }

    const inlineParams = {
      inLink: inLink,
      inRawBlock: inRawBlock,
      maskedSrc: maskedSrc,
      prevChar: false,
      keepPrevChar: false,

      mangle: mangle,
      smartypants: smartypants
    };

    while (src) {
      if (!inlineParams.keepPrevChar) {
        inlineParams.prevChar = '';
      }
      inlineParams.keepPrevChar = false;

      if (this.inlineTokenizers.some(fn => token = fn.func(this, src, inlineParams))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      if (src) {
        const errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return tokens;
  }
};
