import { _Renderer } from './Renderer.ts';
import { _TextRenderer } from './TextRenderer.ts';
import { _defaults } from './defaults.ts';
import {
  unescape
} from './helpers.ts';
import type { Token, Tokens } from './Tokens.ts';
import type { MarkedOptions } from './MarkedOptions.ts';

/**
 * Parsing & Compiling
 */
export class _Parser {
  options: MarkedOptions;
  renderer: _Renderer;
  textRenderer: _TextRenderer;
  constructor(options?: MarkedOptions) {
    this.options = options || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.textRenderer = new _TextRenderer();
  }

  /**
   * Static Parse Method
   */
  static parse(tokens: Token[], options?: MarkedOptions) {
    const parser = new _Parser(options);
    return parser.parse(tokens);
  }

  /**
   * Static Parse Inline Method
   */
  static parseInline(tokens: Token[], options?: MarkedOptions) {
    const parser = new _Parser(options);
    return parser.parseInline(tokens);
  }

  /**
   * Parse Loop
   */
  parse(tokens: Token[], top = true): string {
    let out = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Run any renderer extensions
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        const genericToken = token as Tokens.Generic;
        const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
        if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(genericToken.type)) {
          out += ret || '';
          continue;
        }
      }

      switch (token.type) {
        case 'space': {
          continue;
        }
        case 'hr': {
          out += this.renderer.hr();
          continue;
        }
        case 'heading': {
          const headingToken = token as Tokens.Heading;
          out += this.renderer.heading(
            this.parseInline(headingToken.tokens),
            headingToken.depth,
            unescape(this.parseInline(headingToken.tokens, this.textRenderer)));
          continue;
        }
        case 'code': {
          const codeToken = token as Tokens.Code;
          out += this.renderer.code(codeToken.text,
            codeToken.lang,
            !!codeToken.escaped);
          continue;
        }
        case 'table': {
          const tableToken = token as Tokens.Table;
          let header = '';

          // header
          let cell = '';
          for (let j = 0; j < tableToken.header.length; j++) {
            cell += this.renderer.tablecell(
              this.parseInline(tableToken.header[j].tokens),
              { header: true, align: tableToken.align[j] }
            );
          }
          header += this.renderer.tablerow(cell);

          let body = '';
          for (let j = 0; j < tableToken.rows.length; j++) {
            const row = tableToken.rows[j];

            cell = '';
            for (let k = 0; k < row.length; k++) {
              cell += this.renderer.tablecell(
                this.parseInline(row[k].tokens),
                { header: false, align: tableToken.align[k] }
              );
            }

            body += this.renderer.tablerow(cell);
          }
          out += this.renderer.table(header, body);
          continue;
        }
        case 'blockquote': {
          const blockquoteToken = token as Tokens.Blockquote;
          const body = this.parse(blockquoteToken.tokens);
          out += this.renderer.blockquote(body);
          continue;
        }
        case 'list': {
          const listToken = token as Tokens.List;
          const ordered = listToken.ordered;
          const start = listToken.start;
          const loose = listToken.loose;

          let body = '';
          for (let j = 0; j < listToken.items.length; j++) {
            const item = listToken.items[j];
            const checked = item.checked;
            const task = item.task;

            let itemBody = '';
            if (item.task) {
              const checkbox = this.renderer.checkbox(!!checked);
              if (loose) {
                if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
                  item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                  if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                    item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                  }
                } else {
                  item.tokens.unshift({
                    type: 'text',
                    text: checkbox + ' '
                  } as Tokens.Text);
                }
              } else {
                itemBody += checkbox + ' ';
              }
            }

            itemBody += this.parse(item.tokens, loose);
            body += this.renderer.listitem(itemBody, task, !!checked);
          }

          out += this.renderer.list(body, ordered, start);
          continue;
        }
        case 'html': {
          const htmlToken = token as Tokens.HTML;
          out += this.renderer.html(htmlToken.text, htmlToken.block);
          continue;
        }
        case 'paragraph': {
          const paragraphToken = token as Tokens.Paragraph;
          out += this.renderer.paragraph(this.parseInline(paragraphToken.tokens));
          continue;
        }
        case 'text': {
          let textToken = token as Tokens.Text;
          let body = textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text;
          while (i + 1 < tokens.length && tokens[i + 1].type === 'text') {
            textToken = tokens[++i] as Tokens.Text;
            body += '\n' + (textToken.tokens ? this.parseInline(textToken.tokens) : textToken.text);
          }
          out += top ? this.renderer.paragraph(body) : body;
          continue;
        }

        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return '';
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }

    return out;
  }

  /**
   * Parse Inline Tokens
   */
  parseInline(tokens: Token[], renderer?: _Renderer | _TextRenderer): string {
    renderer = renderer || this.renderer;
    let out = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Run any renderer extensions
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
        const ret = this.options.extensions.renderers[token.type].call({ parser: this }, token);
        if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(token.type)) {
          out += ret || '';
          continue;
        }
      }

      switch (token.type) {
        case 'escape': {
          const escapeToken = token as Tokens.Escape;
          out += renderer.text(escapeToken.text);
          break;
        }
        case 'html': {
          const tagToken = token as Tokens.Tag;
          out += renderer.html(tagToken.text);
          break;
        }
        case 'link': {
          const linkToken = token as Tokens.Link;
          out += renderer.link(linkToken.href, linkToken.title, this.parseInline(linkToken.tokens, renderer));
          break;
        }
        case 'image': {
          const imageToken = token as Tokens.Image;
          out += renderer.image(imageToken.href, imageToken.title, imageToken.text);
          break;
        }
        case 'strong': {
          const strongToken = token as Tokens.Strong;
          out += renderer.strong(this.parseInline(strongToken.tokens, renderer));
          break;
        }
        case 'em': {
          const emToken = token as Tokens.Em;
          out += renderer.em(this.parseInline(emToken.tokens, renderer));
          break;
        }
        case 'codespan': {
          const codespanToken = token as Tokens.Codespan;
          out += renderer.codespan(codespanToken.text);
          break;
        }
        case 'br': {
          out += renderer.br();
          break;
        }
        case 'del': {
          const delToken = token as Tokens.Del;
          out += renderer.del(this.parseInline(delToken.tokens, renderer));
          break;
        }
        case 'text': {
          const textToken = token as Tokens.Text;
          out += renderer.text(textToken.text);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return '';
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
}
