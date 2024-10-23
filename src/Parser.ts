import { _Renderer } from "./Renderer.ts";
import { _TextRenderer } from "./TextRenderer.ts";
import { _defaults } from "./defaults.ts";
import type { Token, Tokens } from "./Tokens.ts";
import type { MarkedOptions } from "./MarkedOptions.ts";

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
    this.renderer.parser = this;
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
    let out = "";

    const renderers: { [key: string]: (token: Token) => string } = {
      space: (token) => this.renderer.space(token as Tokens.Space),
      hr: (token) => this.renderer.hr(token as Tokens.Hr),
      heading: (token) => this.renderer.heading(token as Tokens.Heading),
      code: (token) => this.renderer.code(token as Tokens.Code),
      table: (token) => this.renderer.table(token as Tokens.Table),
      blockquote: (token) =>
        this.renderer.blockquote(token as Tokens.Blockquote),
      list: (token) => this.renderer.list(token as Tokens.List),
      html: (token) => this.renderer.html(token as Tokens.HTML),
      paragraph: (token) => this.renderer.paragraph(token as Tokens.Paragraph),
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      const extensionOutput = this.handleRendererExtensions(token, renderers);
      if (extensionOutput !== null) {
        out += extensionOutput;
        continue;
      }

      if (token.type === "text") {
        out += this.handleTextToken(tokens, i, top);
        while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
          i++;
        }
      } else {
        out += this.handleStandardToken(token, renderers);
      }
    }

    return out;
  }

  /**
   * Parse Inline Tokens
   */
  parseInline(tokens: Token[], renderer?: _Renderer | _TextRenderer): string {
    let out = "";

    const renderers: { [key: string]: (token: Token) => string } = {
      escape: (token) => this.renderer.text(token as Tokens.Escape),
      html: (token) => this.renderer.html(token as Tokens.HTML),
      link: (token) => this.renderer.link(token as Tokens.Link),
      image: (token) => this.renderer.image(token as Tokens.Image),
      strong: (token) => this.renderer.strong(token as Tokens.Strong),
      em: (token) => this.renderer.em(token as Tokens.Em),
      codespan: (token) => this.renderer.codespan(token as Tokens.Codespan),
      br: (token) => this.renderer.br(token as Tokens.Br),
      del: (token) => this.renderer.del(token as Tokens.Del),
      text: (token) => this.renderer.text(token as Tokens.Text),
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      const extensionOutput = this.handleRendererExtensions(token, renderers);
      if (extensionOutput !== null) {
        out += extensionOutput;
        continue;
      }

      const renderFunction = renderers[token.type];
      if (renderFunction) {
        out += renderFunction(token);
      } else {
        out += this.handleUnknownToken(token);
      }
    }

    return out;
  }

  private handleRendererExtensions(
    token: Token,
    renderers: { [key: string]: (token: Token) => string }
  ): string | null {
    const rendererExtension = this.options.extensions?.renderers?.[token.type];
    if (rendererExtension) {
      const ret = rendererExtension.call({ parser: this }, token);
      if (
        ret !== false ||
        !Object.prototype.hasOwnProperty.call(renderers, token.type)
      ) {
        return ret || "";
      }
    }
    return null;
  }

  private handleTextToken(
    tokens: Token[],
    startIndex: number,
    top: boolean
  ): string {
    const concatenatedText = this.getConcatenatedText(tokens, startIndex);

    return !top
      ? concatenatedText
      : this.renderer.paragraph({
          type: "paragraph",
          raw: concatenatedText,
          text: concatenatedText,
          tokens: [
            { type: "text", raw: concatenatedText, text: concatenatedText },
          ],
        });
  }

  private getConcatenatedText(tokens: Token[], startIndex: number): string {
    let currentIndex = startIndex;
    let body = this.renderer.text(tokens[currentIndex] as Tokens.Text);

    while (
      currentIndex + 1 < tokens.length &&
      tokens[currentIndex + 1].type === "text"
    ) {
      currentIndex++;
      body += "\n" + this.renderer.text(tokens[currentIndex] as Tokens.Text);
    }

    return body;
  }

  private handleStandardToken(
    token: Token,
    renderers: { [key: string]: (token: Token) => string }
  ): string {
    const renderFunction = renderers[token.type];
    if (renderFunction) {
      return renderFunction(token);
    } else {
      return this.handleUnknownToken(token);
    }
  }

  private handleUnknownToken(token: Token): string {
    const errMsg = `Token with "${token.type}" type was not found.`;
    if (this.options.silent) {
      console.error(errMsg);
      return "";
    } else {
      throw new Error(errMsg);
    }
  }
}
