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

    // TOO SLOW
    // this.blockTokenizers = new Map([
    //   ['newline', this.newline],
    //   ['code', this.code],
    //   ['fences', this.fences],
    //   ['nptable', this.nptable],
    //   ['heading', this.heading],
    //   ['hr', this.hr],
    //   ['blockquote', this.blockquote],
    //   ['list', this.list],
    //   ['html', this.html],
    //   ['def', this.def],
    //   ['table', this.table],
    //   ['lheading', this.lheading],
    //   ['paragraph', this.paragraph],
    //   ['text', this.text]
    // ]);

    // this.blockTokenizers = [
    //   this.newline,
    //   this.code,
    //   this.fences,
    //   this.nptable,
    //   this.heading,
    //   this.hr,
    //   this.blockquote,
    //   this.list,
    //   this.html,
    //   this.def,
    //   this.table,
    //   this.lheading,
    //   this.paragraph,
    //   this.text
    // ];

    // Array of objects only slightly slower than raw array (~4720 -> ~4750 ms)
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

    // TOO SLOW
    // this.inlineTokenizers = new Map([
    //   ['escape', this.escape],
    //   ['tag', this.tag],
    //   ['link', this.link],
    //   ['reflink', this.reflink],
    //   ['strong', this.strong],
    //   ['em', this.em],
    //   ['codespan', this.codespan],
    //   ['br', this.br],
    //   ['del', this.del],
    //   ['autolink', this.autolink],
    //   ['url', this.url],
    //   ['inlineText', this.inlineText]
    // ]);

    // this.inlineTokenizers = [
    //   this.escape,
    //   this.tag,
    //   this.link,
    //   this.reflink,
    //   this.strong,
    //   this.em,
    //   this.codespan,
    //   this.br,
    //   this.del,
    //   this.autolink,
    //   this.url,
    //   this.inlineText
    // ];

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

    blockTokenizerLoop:
    while (blockParams.src) {
      for (fn of this.blockTokenizers) {
        if (fn.func.call(this, blockParams)) {
          continue blockTokenizerLoop;
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

  // escape
  escape(params) {
    if (params.token = this.tokenizer.escape(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // tag
  tag(params) {
    if (params.token = this.tokenizer.tag(params.src, params.inLink, params.inRawBlock)) {
      params.src = params.src.substring(params.token.raw.length);
      params.inLink = params.token.inLink;
      params.inRawBlock = params.token.inRawBlock;
      params.tokens.push(params.token);
      return true;
    }
  }

  // link
  link(params) {
    if (params.token = this.tokenizer.link(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      if (params.token.type === 'link') {
        params.token.tokens = this.inlineTokens(params.token.text, [], true, params.inRawBlock);
      }
      params.tokens.push(params.token);
      return true;
    }
  }

  // reflink, nolink
  reflink(params) {
    if (params.token = this.tokenizer.reflink(params.src, this.tokens.links)) {
      params.src = params.src.substring(params.token.raw.length);
      if (params.token.type === 'link') {
        params.token.tokens = this.inlineTokens(params.token.text, [], true, params.inRawBlock);
      }
      params.tokens.push(params.token);
      return true;
    }
  }

  // strong
  strong(params) {
    if (params.token = this.tokenizer.strong(params.src, params.maskedSrc, params.prevChar)) {
      params.src = params.src.substring(params.token.raw.length);
      params.token.tokens = this.inlineTokens(params.token.text, [], params.inLink, params.inRawBlock);
      params.tokens.push(params.token);
      return true;
    }
  }

  // em
  em(params) {
    if (params.token = this.tokenizer.em(params.src, params.maskedSrc, params.prevChar)) {
      params.src = params.src.substring(params.token.raw.length);
      params.token.tokens = this.inlineTokens(params.token.text, [], params.inLink, params.inRawBlock);
      params.tokens.push(params.token);
      return true;
    }
  }

  // code
  codespan(params) {
    if (params.token = this.tokenizer.codespan(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // br
  br(params) {
    if (params.token = this.tokenizer.br(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // del (gfm)
  del(params) {
    if (params.token = this.tokenizer.del(params.src)) {
      params.src = params.src.substring(params.token.raw.length);
      params.token.tokens = this.inlineTokens(params.token.text, [], params.inLink, params.inRawBlock);
      params.tokens.push(params.token);
      return true;
    }
  }

  // autolink
  autolink(params) {
    if (params.token = this.tokenizer.autolink(params.src, params.mangle)) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // url (gfm)
  url(params) {
    if (!params.inLink && (params.token = this.tokenizer.url(params.src, params.mangle))) {
      params.src = params.src.substring(params.token.raw.length);
      params.tokens.push(params.token);
      return true;
    }
  }

  // text
  inlineText(params) {
    if (params.token = this.tokenizer.inlineText(params.src, params.inRawBlock, params.smartypants)) {
      params.src = params.src.substring(params.token.raw.length);
      params.prevChar = params.token.raw.slice(-1);
      params.keepPrevChar = true;
      params.tokens.push(params.token);
      return true;
    }
  }

  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = [], inLink = false, inRawBlock = false) {
    let token;

    // String with links masked to avoid interference with em and strong
    let match;
    let maskedSrc = src;
    let keepPrevChar, prevChar, fn;

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

    const inlineParams = {
      src: src,
      tokens: tokens,
      inLink: inLink,
      inRawBlock: inRawBlock,
      maskedSrc: maskedSrc,
      prevChar: prevChar,
      keepPrevChar: keepPrevChar,
      token: token,

      mangle: mangle,
      smartypants: smartypants
    };

    inlineTokenizerLoop:
    while (inlineParams.src) {
      if (!inlineParams.keepPrevChar) {
        inlineParams.prevChar = '';
      }
      inlineParams.keepPrevChar = false;

      for (fn of this.inlineTokenizers) {
        if (fn.func.call(this, inlineParams)) {
          continue inlineTokenizerLoop;
        }
      }

      if (inlineParams.src) {
        const errMsg = 'Infinite loop on byte: ' + inlineParams.src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }

    return inlineParams.tokens;
  }
};
