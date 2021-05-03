const Renderer = require('./Renderer.js');
const TextRenderer = require('./TextRenderer.js');
const Slugger = require('./Slugger.js');
const { defaults } = require('./defaults.js');
const { unescape, isFun } = require('./helpers.js');

function Null() {}
Null.prototype = null;

/**
 * Parsing & Compiling
 */
module.exports = class Parser extends Null {
  constructor(options) {
    super();
    this.options = options || defaults;
    this.options.renderer = this.options.renderer || new Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.textRenderer = new TextRenderer();
    this.slugger = new Slugger();
    this.context = undefined;
    this.textContext = undefined;
    this.looseContext = undefined;
  }

  /**
   * Static Parse Method
   */
  static parse(tokens, options) {
    const parser = new Parser(options);
    return parser.parse(tokens);
  }

  /**
   * Parse Loop
   */
  parse(tokens, ctx) {
    ctx = ctx || this.getContext();

    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const { type } = token;

      if (isFun(this[type])) out += this[type](token, ctx);
      else out += this.default(token, ctx);
    }
    return out;
  }

  getContext(_ctx) {
    return this.context || (this.context = { renderer: this.renderer });
  }

  getTextContext(_ctx) {
    return this.textContext || (this.textContext = { renderer: this.textRenderer });
  }

  getLooseContext(_ctx) {
    return this.looseContext || (this.looseContext = { renderer: this.renderer, loose: true });
  }

  space() {
    return '';
  }

  hr(_token, ctx) {
    return ctx.renderer.hr();
  }

  heading(token, ctx) {
    return ctx.renderer.heading(
      this.parse(token.tokens, ctx),
      token.depth,
      unescape(this.parse(token.tokens, this.getTextContext(ctx))),
      this.slugger
    );
  }

  code(token, ctx) {
    return ctx.renderer.code(token.text, token.lang, token.escaped);
  }

  table(token, ctx) {
    return ctx.renderer.table(this.tableheader(token, ctx), this.tablebody(token, ctx));
  }

  tableheader(token, ctx) {
    const { header, tokens, align } = token;

    let cell = '';
    const l = header.length;
    for (let i = 0; i < l; i++) {
      cell += ctx.renderer.tablecell(
        this.parse(tokens.header[i], ctx),
        { header: true, align: align[i] }
      );
    }
    return ctx.renderer.tablerow(cell);
  }

  tablebody(token, ctx) {
    const { cells, tokens, align } = token;

    let body = '';
    const l = cells.length;

    for (let i = 0; i < l; i++) {
      const row = tokens.cells[i];

      let cell = '';
      const rl = row.length;

      for (let j = 0; j < rl; j++) {
        cell += ctx.renderer.tablecell(
          this.parse(row[j], ctx),
          { header: false, align: align[j] }
        );
      }

      body += ctx.renderer.tablerow(cell);
    }

    return body;
  }

  blockquote(token, ctx) {
    return ctx.renderer.blockquote(this.parse(token.tokens, ctx));
  }

  list(token, ctx) {
    const { ordered, start, items, loose } = token;
    if (loose) ctx = this.getLooseContext(ctx);

    let body = '';
    const l = items.length;
    for (let i = 0; i < l; i++) {
      body += this.listitem(items[i], ctx);
    }

    return ctx.renderer.list(body, ordered, start);
  }

  listitem(item, ctx) {
    const { checked, task, tokens } = item;
    const loose = ctx.loose;

    let body = '';
    if (task) {
      const checkbox = ctx.renderer.checkbox(checked);
      if (loose) {
        if (tokens.length > 0 && tokens[0].type === 'text') {
          tokens[0].text = checkbox + ' ' + tokens[0].text;
          if (tokens[0].tokens && tokens[0].tokens.length > 0 && tokens[0].tokens[0].type === 'text') {
            tokens[0].tokens[0].text = checkbox + ' ' + tokens[0].tokens[0].text;
          }
        } else {
          tokens.unshift({ type: 'text', text: checkbox });
        }
      } else {
        body += checkbox;
      }
    }

    body += this.parse(tokens, ctx);

    // Regression/placeholder, TODO revise logic. See comment on `.text()`.
    if (loose) body = ctx.renderer.paragraph(body);

    return ctx.renderer.listitem(body, task, checked);
  }

  // TODO parse inline content if parameter markdown=1
  html(token, ctx) {
    return ctx.renderer.html(token.text);
  }

  paragraph(token, ctx) {
    return ctx.renderer.paragraph(this.parse(token.tokens, ctx));
  }

  // Regression; missing features:
  //   * Join adjacent text tokens with '\n'.
  //   * In loose list items, wrap adjacent text tokens into a paragraph. May
  //     want to revise this requirement.
  text(token, ctx) {
    return token.tokens ? this.parse(token.tokens, ctx) : token.text;
  }

  escape(token, ctx) {
    return ctx.renderer.text(token.text);
  }

  link(token, ctx) {
    return ctx.renderer.link(token.href, token.title, this.parse(token.tokens, ctx));
  }

  image(token, ctx) {
    return ctx.renderer.image(token.href, token.title, token.text);
  }

  strong(token, ctx) {
    return ctx.renderer.strong(this.parse(token.tokens, ctx));
  }

  em(token, ctx) {
    return ctx.renderer.em(this.parse(token.tokens, ctx));
  }

  codespan(token, ctx) {
    return ctx.renderer.codespan(token.text);
  }

  br(_token, ctx) {
    return ctx.renderer.br();
  }

  del(token, ctx) {
    return ctx.renderer.del(this.parse(token.tokens, ctx));
  }

  default({ type }) {
    const errMsg = 'Token with "' + type + '" type was unexpected in this context.';
    if (this.options.silent) {
      console.error(errMsg);
      return '';
    }
    throw new Error(errMsg);
  }
};
