import { _Renderer } from './Renderer.ts';
import { _TextRenderer } from './TextRenderer.ts';
import { _defaults } from './defaults.ts';
import type { MarkedToken, Token, Tokens } from './Tokens.ts';
import type { MarkedOptions } from './MarkedOptions.ts';

/**
 * Parsing & Compiling
 */
export class _Parser<P = string, R = string> {
  options: MarkedOptions<P, R>;
  renderer: _Renderer<P, R>;
  textRenderer: _TextRenderer<R>;
  constructor(options?: MarkedOptions<P, R>) {
    this.options = options || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.renderer.parser = this;
    this.textRenderer = new _TextRenderer();
  }

  /**
   * Static Parse Method
   */
  static parse<P = string, R = string>(tokens: Token[], options?: MarkedOptions<P, R>) {
    const parser = new _Parser<P, R>(options);
    return parser.parse(tokens);
  }

  /**
   * Static Parse Inline Method
   */
  static parseInline<P = string, R = string>(tokens: Token[], options?: MarkedOptions<P, R>) {
    const parser = new _Parser<P, R>(options);
    return parser.parseInline(tokens);
  }

  /**
   * Parse Loop
   */
  parse(tokens: Token[], top = true): P {
    let out = '';

    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];

      // Run any renderer extensions
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const genericToken = anyToken as Tokens.Generic;
        const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
        if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(genericToken.type)) {
          out += ret || '';
          continue;
        }
      }

      const token = anyToken as MarkedToken;

      switch (token.type) {
        case 'space': {
          out += this.renderer.space(token);
          continue;
        }
        case 'hr': {
          out += this.renderer.hr(token);
          continue;
        }
        case 'heading': {
          out += this.renderer.heading(token);
          continue;
        }
        case 'code': {
          out += this.renderer.code(token);
          continue;
        }
        case 'table': {
          out += this.renderer.table(token);
          continue;
        }
        case 'blockquote': {
          out += this.renderer.blockquote(token);
          continue;
        }
        case 'list': {
          out += this.renderer.list(token);
          continue;
        }
        case 'html': {
          out += this.renderer.html(token);
          continue;
        }
        case 'paragraph': {
          out += this.renderer.paragraph(token);
          continue;
        }
        case 'text': {
          let textToken = token;
          let body = this.renderer.text(textToken) as string;
          while (i + 1 < tokens.length && tokens[i + 1].type === 'text') {
            textToken = tokens[++i] as Tokens.Text;
            body += ('\n' + this.renderer.text(textToken));
          }
          if (top) {
            out += this.renderer.paragraph({
              type: 'paragraph',
              raw: body,
              text: body,
              tokens: [{ type: 'text', raw: body, text: body, escaped: true }],
            });
          } else {
            out += body;
          }
          continue;
        }

        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return '' as P;
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }

    return out as P;
  }

  /**
   * Parse Inline Tokens
   */
  parseInline(tokens: Token[], renderer: _Renderer<P, R> | _TextRenderer<R> = this.renderer): P {
    let out = '';

    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];

      // Run any renderer extensions
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
        if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(anyToken.type)) {
          out += ret || '';
          continue;
        }
      }

      const token = anyToken as MarkedToken;

      switch (token.type) {
        case 'escape': {
          out += renderer.text(token);
          break;
        }
        case 'html': {
          out += renderer.html(token);
          break;
        }
        case 'link': {
          out += renderer.link(token);
          break;
        }
        case 'image': {
          out += renderer.image(token);
          break;
        }
        case 'strong': {
          out += renderer.strong(token);
          break;
        }
        case 'em': {
          out += renderer.em(token);
          break;
        }
        case 'codespan': {
          out += renderer.codespan(token);
          break;
        }
        case 'br': {
          out += renderer.br(token);
          break;
        }
        case 'del': {
          out += renderer.del(token);
          break;
        }
        case 'text': {
          out += renderer.text(token);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return '' as P;
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out as P;
  }
}
