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

export interface RendererThis<ParserOutput = string, RendererOutput = string> {
  parser: _Parser<ParserOutput, RendererOutput>;
}

export type RendererExtensionFunction<ParserOutput = string, RendererOutput = string> = (this: RendererThis<ParserOutput, RendererOutput>, token: Tokens.Generic) => RendererOutput | false | undefined;

export interface RendererExtension<ParserOutput = string, RendererOutput = string> {
  name: string;
  renderer: RendererExtensionFunction<ParserOutput, RendererOutput>;
}

export type TokenizerAndRendererExtension<ParserOutput = string, RendererOutput = string> = TokenizerExtension | RendererExtension<ParserOutput, RendererOutput> | (TokenizerExtension & RendererExtension<ParserOutput, RendererOutput>);

type HooksApi<ParserOutput = string, RendererOutput = string> = Omit<_Hooks<ParserOutput, RendererOutput>, 'constructor' | 'options' | 'block'>;
type HooksObject<ParserOutput = string, RendererOutput = string> = {
  [K in keyof HooksApi<ParserOutput, RendererOutput>]?: (this: _Hooks<ParserOutput, RendererOutput>, ...args: Parameters<HooksApi<ParserOutput, RendererOutput>[K]>) => ReturnType<HooksApi<ParserOutput, RendererOutput>[K]> | Promise<ReturnType<HooksApi<ParserOutput, RendererOutput>[K]>>
};

type RendererApi<ParserOutput = string, RendererOutput = string> = Omit<_Renderer<ParserOutput, RendererOutput>, 'constructor' | 'options' | 'parser'>;
type RendererObject<ParserOutput = string, RendererOutput = string> = {
  [K in keyof RendererApi<ParserOutput, RendererOutput>]?: (this: _Renderer<ParserOutput, RendererOutput>, ...args: Parameters<RendererApi<ParserOutput, RendererOutput>[K]>) => ReturnType<RendererApi<ParserOutput, RendererOutput>[K]> | false
};

type TokenizerApi<ParserOutput = string, RendererOutput = string> = Omit<_Tokenizer<ParserOutput, RendererOutput>, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject<ParserOutput = string, RendererOutput = string> = {
  [K in keyof TokenizerApi<ParserOutput, RendererOutput>]?: (this: _Tokenizer<ParserOutput, RendererOutput>, ...args: Parameters<TokenizerApi<ParserOutput, RendererOutput>[K]>) => ReturnType<TokenizerApi<ParserOutput, RendererOutput>[K]> | false
};

export interface MarkedExtension<ParserOutput = string, RendererOutput = string> {
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
    | TokenizerAndRendererExtension<ParserOutput, RendererOutput>[]
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
  hooks?: HooksObject<ParserOutput, RendererOutput> | null;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix any of the original markdown bugs or poor behavior.
   */
  pedantic?: boolean;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: RendererObject<ParserOutput, RendererOutput> | null;

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

export interface MarkedOptions<ParserOutput = string, RendererOutput = string> extends Omit<MarkedExtension<ParserOutput, RendererOutput>, 'hooks' | 'renderer' | 'tokenizer' | 'extensions' | 'walkTokens'> {
  /**
   * Hooks are methods that hook into some part of marked.
   */
  hooks?: _Hooks<ParserOutput, RendererOutput> | null;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: _Renderer<ParserOutput, RendererOutput> | null;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: _Tokenizer<ParserOutput, RendererOutput> | null;

  /**
   * Custom extensions
   */
  extensions?: null | {
    renderers: {
      [name: string]: RendererExtensionFunction<ParserOutput, RendererOutput>;
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
