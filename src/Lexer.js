const Tokenizer = require('./Tokenizer.js');
const { defaults } = require('./defaults.js');
const { block, inline } = require('./rules.js');
const { repeatString } = require('./helpers.js');

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

    this.blockTokenizers = new Map([
      ['newline', this.newline],
      ['code', this.code],
      ['fences', this.fences],
      ['nptable', this.nptable],
      ['heading', this.heading],
      ['hr', this.hr],
      ['blockquote', this.blockquote],
      ['list', this.list],
      ['html', this.html],
      ['def', this.def],
      ['table', this.table],
      ['lheading', this.lheading],
      ['paragraph', this.paragraph],
      ['text', this.text]
    ]);
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

  // newline
  newline(params) {
    if (params.token = this.tokenizer.space(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      if (params.token.type) {
        params.tokens.push(params.token);
      }
      return true;
    }
  }

  // code
  code(params) {
    if (params.token = this.tokenizer.code(params.src, params.tokens)) {
      params.src = params.src.substring(params.token.raw.length);
      if (params.token.type) {
        params.tokens.push(params.token);
      } else {
        params.lastToken = params.tokens[params.tokens.length - 1];
        params.lastToken.raw += '\n' + params.token.raw;
        params.lastToken.text += '\n' + params.token.text;
      }
      return true;
    }
  }

  // fences
  fences(params) {
    if (params.token = this.tokenizer.fences(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // table no leading pipe (gfm)
  nptable(params) {
    if (params.token = this.tokenizer.nptable(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // heading
  heading(params) {
    if (params.token = this.tokenizer.heading(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // hr
  hr(params) {
    if (params.token = this.tokenizer.hr(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // blockquote
  blockquote(params) {
    if (params.token = this.tokenizer.blockquote(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.token.tokens = this.blockTokens(params.token.text, [], params.top);
      params.tokens.push(params.token);
      return true;
    }
  }

  // list
  list(params) {
    if (params.token = this.tokenizer.list(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.l = params.token.items.length;
      for (params.i = 0; params.i < params.l; params.i++) {
        params.token.items[params.i].tokens = this.blockTokens(params.token.items[params.i].text, [], false);
      }
      params.tokens.push(params.token);
      return true;
    }
  }

  // html
  html(params) {
    if (params.token = this.tokenizer.html(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // def
  def(params) {
    if (params.top && (params.token = this.tokenizer.def(params.src))) {
      params.src = params.src.substring(params.token.raw.length);
      if (!this.tokens.links[params.token.tag]) {
        this.tokens.links[params.token.tag] = {
          href: params.token.href,
          title: params.token.title
        };
      }
      return true;
    }
  }

  // table (gfm)
  table(params) {
    if (params.token = this.tokenizer.table(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // lheading
  lheading(params) {
    if (params.token = this.tokenizer.lheading(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // top-level paragraph
  paragraph(params) {
    if (params.top && (params.token = this.tokenizer.paragraph(params.src))) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // text
  text(params) {
    if (params.token = this.tokenizer.text(params.src, params.tokens)) {
      params.src = params.src.substring(params.token.raw.length);
      if (params.token.type) {
        params.tokens.push(params.token);
      } else {
        params.lastToken = params.tokens[params.tokens.length - 1];
        params.lastToken.raw += '\n' + params.token.raw;
        params.lastToken.text += '\n' + params.token.text;
      }
      return true;
    }
  }

  blockTokens(src, tokens = [], top = true) {
    src = src.replace(/^ +$/gm, '');
    let token, lastToken, i, l, fn;

    const blockParams = {
      src: src,
      tokens: tokens,
      top: top,
      token: token,
      lastToken: lastToken,
      i: i,
      l: l
    };

    outerLoop:
    while (blockParams.src) {
      for (fn of this.blockTokenizers.values()) {
        if (fn.call(this, blockParams)) {
          continue outerLoop;
        }
      }

      if (blockParams.src) {
        const errMsg = 'Infinite loop on byte: ' + blockParams.src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return blockParams.tokens;
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

  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = [], inLink = false, inRawBlock = false) {
    let token;

    // String with links masked to avoid interference with em and strong
    let maskedSrc = src;
    let match;
    let keepPrevChar, prevChar;

    // Mask out reflinks
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

    while (src) {
      if (!keepPrevChar) {
        prevChar = '';
      }
      keepPrevChar = false;
      // escape
      if (token = this.tokenizer.escape(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // tag
      if (token = this.tokenizer.tag(src, inLink, inRawBlock)) {
        src = src.substring(token.raw.length);
        inLink = token.inLink;
        inRawBlock = token.inRawBlock;
        tokens.push(token);
        continue;
      }

      // link
      if (token = this.tokenizer.link(src)) {
        src = src.substring(token.raw.length);
        if (token.type === 'link') {
          token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
        }
        tokens.push(token);
        continue;
      }

      // reflink, nolink
      if (token = this.tokenizer.reflink(src, this.tokens.links)) {
        src = src.substring(token.raw.length);
        if (token.type === 'link') {
          token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
        }
        tokens.push(token);
        continue;
      }

      // strong
      if (token = this.tokenizer.strong(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      }

      // em
      if (token = this.tokenizer.em(src, maskedSrc, prevChar)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      }

      // code
      if (token = this.tokenizer.codespan(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // br
      if (token = this.tokenizer.br(src)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // del (gfm)
      if (token = this.tokenizer.del(src)) {
        src = src.substring(token.raw.length);
        token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
        tokens.push(token);
        continue;
      }

      // autolink
      if (token = this.tokenizer.autolink(src, mangle)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // url (gfm)
      if (!inLink && (token = this.tokenizer.url(src, mangle))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // text
      if (token = this.tokenizer.inlineText(src, inRawBlock, smartypants)) {
        src = src.substring(token.raw.length);
        prevChar = token.raw.slice(-1);
        keepPrevChar = true;
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
