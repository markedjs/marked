import Renderer from './renderer';
import InlineLexer from './inlineLexer';
import TextRenderer from './textRenderer';
import { unescape } from './util';
import marked from './marked';

/**
 * Parsing & Compiling
 */
export default class Parser {
  constructor(options) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;
    this.options.renderer = this.options.renderer || new Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
  }

  /**
   * Static Parse Method
   */
  static parse(src, options) {
    const parser = new Parser(options);
    return parser.parse(src);
  }

  /**
   * Parse Loop
   */
  parse(src) {
    this.inline = new InlineLexer(src.links, this.options);
    // use an InlineLexer with a TextRenderer to extract pure text
    this.inlineText = new InlineLexer(
      src.links,
      { ...this.options, renderer: new TextRenderer() }
    );
    this.tokens = src.reverse();

    let out = '';
    while (this.next()) {
      out += this.tok();
    }

    return out;
  }

  /**
   * Next Token
   */
  next() {
    return this.token = this.tokens.pop();
  }

  /**
   * Preview Next Token
   */
  peek() {
    return this.tokens[this.tokens.length - 1] || 0;
  }

  /**
   * Parse Text Tokens
   */
  parseText() {
    let body = this.token.text;

    while (this.peek().type === 'text') {
      body += '\n' + this.next().text;
    }

    return this.inline.output(body);
  }

  /**
   * Parse Current Token
   */
  tok() {
    switch (this.token.type) {
      case 'space':
        return '';
      case 'hr':
        return this.renderer.hr();
      case 'heading':
        return this.renderer.heading(
          this.inline.output(this.token.text),
          this.token.depth,
          unescape(this.inlineText.output(this.token.text)));
      case 'code':
        return this.renderer.code(this.token.text,
          this.token.lang,
          this.token.escaped);
      case 'table': {
        let header = '';
        let body = '';
        let cell = '';

        // header
        for (let i = 0; i < this.token.header.length; i++) {
          cell += this.renderer.tablecell(
            this.inline.output(this.token.header[i]),
            { header: true, align: this.token.align[i] }
          );
        }
        header += this.renderer.tablerow(cell);

        for (let i = 0; i < this.token.cells.length; i++) {
          const row = this.token.cells[i];

          cell = '';
          for (let j = 0; j < row.length; j++) {
            cell += this.renderer.tablecell(
              this.inline.output(row[j]),
              { header: false, align: this.token.align[j] }
            );
          }

          body += this.renderer.tablerow(cell);
        }
        return this.renderer.table(header, body);
      }
      case 'blockquote_start': {
        let body = '';

        while (this.next().type !== 'blockquote_end') {
          body += this.tok();
        }

        return this.renderer.blockquote(body);
      }
      case 'list_start': {
        let body = '';
        const ordered = this.token.ordered;
        const start = this.token.start;

        while (this.next().type !== 'list_end') {
          body += this.tok();
        }

        return this.renderer.list(body, ordered, start);
      }
      case 'list_item_start': {
        let body = '';
        const loose = this.token.loose;

        if (this.token.task) {
          body += this.renderer.checkbox(this.token.checked);
        }

        while (this.next().type !== 'list_item_end') {
          body += !loose && this.token.type === 'text'
            ? this.parseText()
            : this.tok();
        }

        return this.renderer.listitem(body);
      }
      case 'html':
        // TODO parse inline content if parameter markdown=1
        return this.renderer.html(this.token.text);
      case 'paragraph':
        return this.renderer.paragraph(this.inline.output(this.token.text));
      case 'text':
        return this.renderer.paragraph(this.parseText());
    }
  }
}
