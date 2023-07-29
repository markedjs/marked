import type { Token, Tokens, TokensList } from './Tokens.ts';
import { _Parser } from './Parser.ts';
import { _Lexer } from './Lexer.ts';
import { _Renderer } from './Renderer.ts';
import { _Tokenizer } from './Tokenizer.ts';

export interface SluggerOptions {
  /** Generates the next unique slug without updating the internal accumulator. */
  dryrun?: boolean;
}

export interface TokenizerThis {
  lexer: _Lexer;
}

export interface TokenizerExtension {
  name: string;
  level: 'block' | 'inline';
  start?: ((this: TokenizerThis, src: string) => number | void) | undefined;
  tokenizer: (this: TokenizerThis, src: string, tokens: Token[] | TokensList) => Tokens.Generic | void;
  childTokens?: string[] | undefined;
}

export interface RendererThis {
  parser: _Parser;
}

export interface RendererExtension {
  name: string;
  renderer: (this: RendererThis, token: Tokens.Generic) => string | false | undefined;
}

export type TokenizerAndRendererExtension = TokenizerExtension | RendererExtension | (TokenizerExtension & RendererExtension);

type RendererApi = Omit<_Renderer, 'constructor' | 'options'>;
type RendererObject = {
  [K in keyof RendererApi]?: (...args: Parameters<RendererApi[K]>) => ReturnType<RendererApi[K]> | false
};

type TokenizerApi = Omit<_Tokenizer, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject = {
  [K in keyof TokenizerApi]?: (...args: Parameters<TokenizerApi[K]>) => ReturnType<TokenizerApi[K]> | false
};

export interface MarkedExtension {
  /**
   * True will tell marked to await any walkTokens functions before parsing the tokens and returning an HTML string.
   */
  async?: boolean;

  /**
   * A prefix URL for any relative link.
   * @deprecated Deprecated in v5.0.0 use marked-base-url to prefix url for any relative link.
   */
  baseUrl?: string | undefined | null;

  /**
   * Enable GFM line breaks. This option requires the gfm option to be true.
   */
  breaks?: boolean | undefined;

  /**
   * Add tokenizers and renderers to marked
   */
  extensions?:
    | TokenizerAndRendererExtension[]
    | undefined | null;

  /**
   * Enable GitHub flavored markdown.
   */
  gfm?: boolean | undefined;

  /**
   * Include an id attribute when emitting headings.
   * @deprecated Deprecated in v5.0.0 use marked-gfm-heading-id to include an id attribute when emitting headings (h1, h2, h3, etc).
   */
  headerIds?: boolean | undefined;

  /**
   * Set the prefix for header tag ids.
   * @deprecated Deprecated in v5.0.0 use marked-gfm-heading-id to add a string to prefix the id attribute when emitting headings (h1, h2, h3, etc).
   */
  headerPrefix?: string | undefined;

  /**
   * A function to highlight code blocks. The function can either be
   * synchronous (returning a string) or asynchronous (callback invoked
   * with an error if any occurred during highlighting and a string
   * if highlighting was successful)
   * @deprecated Deprecated in v5.0.0 use marked-highlight to add highlighting to code blocks.
   */
  highlight?: ((code: string, lang: string | undefined, callback?: (error: Error, code?: string) => void) => string | void) | null;

  /**
   * Hooks are methods that hook into some part of marked.
   * preprocess is called to process markdown before sending it to marked.
   * postprocess is called to process html after marked has finished parsing.
   */
  hooks?: {
    preprocess: (markdown: string) => string,
    postprocess: (html: string | undefined) => string | undefined,
    // eslint-disable-next-line no-use-before-define
    options?: MarkedOptions
  } | null;

  /**
   * Set the prefix for code block classes.
   * @deprecated Deprecated in v5.0.0 use marked-highlight to prefix the className in a <code> block. Useful for syntax highlighting.
   */
  langPrefix?: string | undefined;

  /**
   * Mangle autolinks (<email@domain.com>).
   * @deprecated Deprecated in v5.0.0 use marked-mangle to mangle email addresses.
   */
  mangle?: boolean | undefined;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix any of the original markdown bugs or poor behavior.
   */
  pedantic?: boolean | undefined;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: RendererObject | undefined | null;

  /**
   * Sanitize the output. Ignore any HTML that has been input. If true, sanitize the HTML passed into markdownString with the sanitizer function.
   * @deprecated Warning: This feature is deprecated and it should NOT be used as it cannot be considered secure. Instead use a sanitize library, like DOMPurify (recommended), sanitize-html or insane on the output HTML!
   */
  sanitize?: boolean | undefined;

  /**
   * Optionally sanitize found HTML with a sanitizer function.
   * @deprecated A function to sanitize the HTML passed into markdownString.
   */
  sanitizer?: ((html: string) => string) | null;

  /**
   * Shows an HTML error message when rendering fails.
   */
  silent?: boolean | undefined;

  /**
   * Use smarter list behavior than the original markdown. May eventually be default with the old behavior moved into pedantic.
   */
  smartLists?: boolean | undefined;

  /**
   * Use "smart" typograhic punctuation for things like quotes and dashes.
   * @deprecated Deprecated in v5.0.0 use marked-smartypants to use "smart" typographic punctuation for things like quotes and dashes.
   */
  smartypants?: boolean | undefined;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: TokenizerObject | undefined | null;

  /**
   * The walkTokens function gets called with every token.
   * Child tokens are called before moving on to sibling tokens.
   * Each token is passed by reference so updates are persisted when passed to the parser.
   * The return value of the function is ignored.
   */
  walkTokens?: ((token: Token) => void | Promise<void>) | undefined | null;
  /**
   * Generate closing slash for self-closing tags (<br/> instead of <br>)
   * @deprecated Deprecated in v5.0.0 use marked-xhtml to emit self-closing HTML tags for void elements (<br/>, <img/>, etc.) with a "/" as required by XHTML.
   */
  xhtml?: boolean | undefined;
}

export interface MarkedOptions extends Omit<MarkedExtension, 'extensions' | 'renderer' | 'tokenizer' | 'walkTokens'> {
  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: Omit<_Renderer, 'constructor'> | undefined | null;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: Omit<_Tokenizer, 'constructor'> | undefined | null;

  /**
   * The walkTokens function gets called with every token.
   * Child tokens are called before moving on to sibling tokens.
   * Each token is passed by reference so updates are persisted when passed to the parser.
   * The return value of the function is ignored.
   */
  walkTokens?: ((token: Token) => void | Promise<void> | Array<void | Promise<void>>) | undefined | null;

  /**
   * Add tokenizers and renderers to marked
   */
  extensions?:
    | (TokenizerAndRendererExtension[] & {
    renderers: Record<string, (this: RendererThis, token: Tokens.Generic) => string | false | undefined>,
    childTokens: Record<string, string[]>,
    block: any[],
    inline: any[],
    startBlock: Array<(this: TokenizerThis, src: string) => number | void>,
    startInline: Array<(this: TokenizerThis, src: string) => number | void>
  })
    | undefined | null;
}
