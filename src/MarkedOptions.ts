import type { CustomToken, Token, TokensList } from './Tokens.ts';
import type { _Parser } from './Parser.ts';
import type { _Lexer } from './Lexer.ts';
import type { _Renderer } from './Renderer.ts';
import type { _Tokenizer } from './Tokenizer.ts';
import type { _Hooks } from './Hooks.ts';

export interface TokenizerThis {
  lexer: _Lexer;
}

export type TokenizerExtensionFunction<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> = (this: TokenizerThis, src: string, tokens: Token[] | TokensList) => CustomToken<N, T> | undefined;

export type TokenizerStartFunction = (this: TokenizerThis, src: string) => number | void;

export interface TokenizerExtension<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> {
  name: N;
  level: 'block' | 'inline';
  start?: TokenizerStartFunction | undefined;
  tokenizer: TokenizerExtensionFunction<N, T>;
  childTokens?: string[] | undefined;
}

export interface RendererThis {
  parser: _Parser;
}

export type RendererExtensionFunction<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> = (this: RendererThis, token: CustomToken<N, T>) => string | false | undefined;

export interface RendererExtension<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> {
  name: N;
  renderer: RendererExtensionFunction<N, T>;
}

export type TokenizerAndRendererExtension<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> = TokenizerExtension<N, T> | RendererExtension<N, T> | (TokenizerExtension<N, T> & RendererExtension<N, T>);

type HooksApi = Omit<_Hooks, 'constructor' | 'options'>;
type HooksObject = {
  [K in keyof HooksApi]?: (...args: Parameters<HooksApi[K]>) => ReturnType<HooksApi[K]> | Promise<ReturnType<HooksApi[K]>>
};

type RendererApi = Omit<_Renderer, 'constructor' | 'options'>;
type RendererObject = {
  [K in keyof RendererApi]?: (...args: Parameters<RendererApi[K]>) => ReturnType<RendererApi[K]> | false
};

type TokenizerApi = Omit<_Tokenizer, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject = {
  [K in keyof TokenizerApi]?: (...args: Parameters<TokenizerApi[K]>) => ReturnType<TokenizerApi[K]> | false
};

export interface MarkedExtension<
  N extends string = string,
  T extends Record<string, unknown> = Record<string, any>
> {
  /**
   * True will tell marked to await any walkTokens functions before parsing the tokens and returning an HTML string.
   */
  async?: boolean;

  /**
   * Enable GFM line breaks. This option requires the gfm option to be true.
   */
  breaks?: boolean | undefined;

  /**
   * Add tokenizers and renderers to marked
   */
  extensions?:
    | TokenizerAndRendererExtension<N, T>[]
    | undefined | null;

  /**
   * Enable GitHub flavored markdown.
   */
  gfm?: boolean | undefined;

  /**
   * Hooks are methods that hook into some part of marked.
   * preprocess is called to process markdown before sending it to marked.
   * processAllTokens is called with the TokensList before walkTokens.
   * postprocess is called to process html after marked has finished parsing.
   */
  hooks?: HooksObject | undefined | null;

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
   * Shows an HTML error message when rendering fails.
   */
  silent?: boolean | undefined;

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
}

export interface MarkedOptions extends Omit<MarkedExtension, 'hooks' | 'renderer' | 'tokenizer' | 'extensions' | 'walkTokens'> {
  /**
   * Hooks are methods that hook into some part of marked.
   */
  hooks?: _Hooks | undefined | null;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: _Renderer | undefined | null;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: _Tokenizer | undefined | null;

  /**
   * Custom extensions
   */
  extensions?: null | {
  renderers: {
    [name: string]: RendererExtensionFunction;
  };
  childTokens: {
    [name: string]: string[];
  };
  inline?: TokenizerExtensionFunction[];
  block?: TokenizerExtensionFunction[];
  startInline?: TokenizerStartFunction[];
  startBlock?: TokenizerStartFunction[];
  };

  /**
   * walkTokens function returns array of values for Promise.all
   */
  walkTokens?: null | ((token: Token) => void | Promise<void> | (void | Promise<void>)[]);
}
