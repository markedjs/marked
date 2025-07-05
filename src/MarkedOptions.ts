import type { Token, Tokens, TokensList } from './Tokens.ts';
import type { _Parser } from './Parser.ts';
import type { _Lexer } from './Lexer.ts';
import type { _Renderer } from './Renderer.ts';
import type { _Tokenizer } from './Tokenizer.ts';
import type { _Hooks } from './Hooks.ts';

export interface TokenizerThis {
  lexer: _Lexer;
}

export type TokenizerExtensionFunction = (this: TokenizerThis, src: string, tokens: Token[] | TokensList) => Tokens.Generic | undefined;

export type TokenizerStartFunction = (this: TokenizerThis, src: string) => number | void;

export interface TokenizerExtension {
  name: string;
  level: 'block' | 'inline';
  start?: TokenizerStartFunction;
  tokenizer: TokenizerExtensionFunction;
  childTokens?: string[];
}

export interface RendererThis<P = string, R = string> {
  parser: _Parser<P, R>;
}

export type RendererExtensionFunction<P = string, R = string> = (this: RendererThis<P, R>, token: Tokens.Generic) => R | false | undefined;

export interface RendererExtension<P = string, R = string> {
  name: string;
  renderer: RendererExtensionFunction<P, R>;
}

export type TokenizerAndRendererExtension<P = string, R = string> = TokenizerExtension | RendererExtension<P, R> | (TokenizerExtension & RendererExtension<P, R>);

type HooksApi<P = string, R = string> = Omit<_Hooks<P, R>, 'constructor' | 'options' | 'block'>;
type HooksObject<P = string, R = string> = {
  [K in keyof HooksApi<P, R>]?: (this: _Hooks<P, R>, ...args: Parameters<HooksApi<P, R>[K]>) => ReturnType<HooksApi<P, R>[K]> | Promise<ReturnType<HooksApi<P, R>[K]>>
};

type RendererApi<P = string, R = string> = Omit<_Renderer<P, R>, 'constructor' | 'options' | 'parser'>;
type RendererObject<P = string, R = string> = {
  [K in keyof RendererApi<P, R>]?: (this: _Renderer<P, R>, ...args: Parameters<RendererApi<P, R>[K]>) => ReturnType<RendererApi<P, R>[K]> | false
};

type TokenizerApi<P = string, R = string> = Omit<_Tokenizer<P, R>, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject<P = string, R = string> = {
  [K in keyof TokenizerApi<P, R>]?: (this: _Tokenizer<P, R>, ...args: Parameters<TokenizerApi<P, R>[K]>) => ReturnType<TokenizerApi<P, R>[K]> | false
};

export interface MarkedExtension<P = string, R = string> {
  /**
   * True will tell marked to await any walkTokens functions before parsing the tokens and returning an HTML string.
   */
  async?: boolean;

  /**
   * Enable GFM line breaks. This option requires the gfm option to be true.
   */
  breaks?: boolean;

  /**
   * Add tokenizers and renderers to marked
   */
  extensions?:
    | TokenizerAndRendererExtension<P, R>[]
    | null;

  /**
   * Enable GitHub flavored markdown.
   */
  gfm?: boolean;

  /**
   * Hooks are methods that hook into some part of marked.
   * preprocess is called to process markdown before sending it to marked.
   * processAllTokens is called with the TokensList before walkTokens.
   * postprocess is called to process html after marked has finished parsing.
   * provideLexer is called to provide a function to tokenize markdown.
   * provideParser is called to provide a function to parse tokens.
   */
  hooks?: HooksObject<P, R> | null;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix any of the original markdown bugs or poor behavior.
   */
  pedantic?: boolean;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: RendererObject<P, R> | null;

  /**
   * Shows an HTML error message when rendering fails.
   */
  silent?: boolean;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: TokenizerObject | null;

  /**
   * The walkTokens function gets called with every token.
   * Child tokens are called before moving on to sibling tokens.
   * Each token is passed by reference so updates are persisted when passed to the parser.
   * The return value of the function is ignored.
   */
  walkTokens?: ((token: Token) => void | Promise<void>) | null;
}

export interface MarkedOptions<P = string, R = string> extends Omit<MarkedExtension<P, R>, 'hooks' | 'renderer' | 'tokenizer' | 'extensions' | 'walkTokens'> {
  /**
   * Hooks are methods that hook into some part of marked.
   */
  hooks?: _Hooks<P, R> | null;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: _Renderer<P, R> | null;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: _Tokenizer<P, R> | null;

  /**
   * Custom extensions
   */
  extensions?: null | {
    renderers: {
      [name: string]: RendererExtensionFunction<P, R>;
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
