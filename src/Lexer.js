const Tokenizer = require('./Tokenizer.js');
const { defaults } = require('./defaults.js');

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
    this.tokenizer.initialize();
  }

  /**
   * Expose Block Rules
   */
  static get rules() {
    return Tokenizer.rules;
  }

  /**
   * Static Lex Method
   */
  static lex(src, options) {
    const lexer = new Lexer(options);
    return lexer.lex(src);
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
  blockTokens(src, tokens = [], top = true) {
    src = src.replace(/^ +$/gm, '');
    let token;

    while (src) {
      // newline
      if (token = this.tokenizer.space(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        if (token.type) {
          tokens.push(token);
        }
        continue;
      }

      // code
      if (token = this.tokenizer.code(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // fences
      if (token = this.tokenizer.fences(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // heading
      if (token = this.tokenizer.heading(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // table no leading pipe (gfm)
      if (token = this.tokenizer.nptable(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // hr
      if (token = this.tokenizer.hr(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // blockquote
      if (token = this.tokenizer.blockquote(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // list
      if (token = this.tokenizer.list(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // html
      if (token = this.tokenizer.html(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // def
      if (top && (token = this.tokenizer.def(this, src, tokens, top))) {
        src = src.substring(token.raw.length);
        if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title
          };
        }
        continue;
      }

      // table (gfm)
      if (token = this.tokenizer.table(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // lheading
      if (token = this.tokenizer.lheading(this, src, tokens, top)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // top-level paragraph
      if (top && (token = this.tokenizer.paragraph(this, src, tokens, top))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // text
      if (token = this.tokenizer.text(this, src, tokens, top)) {
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
  inlineTokens(src, tokens = []) {
    let token;

    while (src) {
      // escape
      if (token = this.tokenizer.escape(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // tag
      if (token = this.tokenizer.tag(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // link
      if (token = this.tokenizer.link(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // reflink, nolink
      if (token = this.tokenizer.reflink(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // strong
      if (token = this.tokenizer.strong(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // em
      if (token = this.tokenizer.em(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // code
      if (token = this.tokenizer.codespan(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // br
      if (token = this.tokenizer.br(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // del (gfm)
      if (token = this.tokenizer.del(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // autolink
      if (token = this.tokenizer.autolink(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // url (gfm)
      if (token = this.tokenizer.url(this, src, tokens)) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }

      // text
      if (token = this.tokenizer.inlineText(this, src, tokens)) {
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
