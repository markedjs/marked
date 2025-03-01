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

export const tokenizerBlockPositions = [
  'afterBlockStart',
  'beforeSpace',
  'afterSpace',
  'beforeCode',
  'afterCode',
  'beforeFences',
  'afterFences',
  'beforeHeading',
  'afterHeading',
  'beforeHr',
  'afterHr',
  'beforeBlockquote',
  'afterBlockquote',
  'beforeList',
  'afterList',
  'beforeHtml',
  'afterHtml',
  'beforeDef',
  'afterDef',
  'beforeTable',
  'afterTable',
  'beforeLheading',
  'afterLheading',
  'beforeParagraph',
  'afterParagraph',
  'beforeBlockText',
  'afterBlockText',
  'beforeBlockEnd',
] as const;

export const tokenizerInlinePositions = [
  'afterInlineStart',
  'beforeEscape',
  'afterEscape',
  'beforeTag',
  'afterTag',
  'beforeLink',
  'afterLink',
  'beforeReflink',
  'afterReflink',
  'beforeEmStrong',
  'afterEmStrong',
  'beforeCodespan',
  'afterCodespan',
  'beforeBr',
  'afterBr',
  'beforeDel',
  'afterDel',
  'beforeAutolink',
  'afterAutolink',
  'beforeUrl',
  'afterUrl',
  'beforeInlineText',
  'afterInlineText',
  'beforeInlineEnd',
] as const;

export const tokenPositionMap = {
  'afterBlockStart': 'beforeSpace',
  'beforeSpace': 'beforeSpace',
  'afterSpace': 'beforeCode',
  'beforeCode': 'beforeCode',
  'afterCode': 'beforeFences',
  'beforeFences': 'beforeFences',
  'afterFences': 'beforeHeading',
  'beforeHeading': 'beforeHeading',
  'afterHeading': 'beforeHr',
  'beforeHr': 'beforeHr',
  'afterHr': 'beforeBlockquote',
  'beforeBlockquote': 'beforeBlockquote',
  'afterBlockquote': 'beforeList',
  'beforeList': 'beforeList',
  'afterList': 'beforeHtml',
  'beforeHtml': 'beforeHtml',
  'afterHtml': 'beforeDef',
  'beforeDef': 'beforeDef',
  'afterDef': 'beforeTable',
  'beforeTable': 'beforeTable',
  'afterTable': 'beforeLheading',
  'beforeLheading': 'beforeLheading',
  'afterLheading': 'beforeParagraph',
  'beforeParagraph': 'beforeParagraph',
  'afterParagraph': 'beforeBlockText',
  'beforeBlockText': 'beforeBlockText',
  'afterBlockText': 'beforeBlockEnd',
  'beforeBlockEnd': 'beforeBlockEnd',
  'afterInlineStart': 'beforeEscape',
  'beforeEscape': 'beforeEscape',
  'afterEscape': 'beforeTag',
  'beforeTag': 'beforeTag',
  'afterTag': 'beforeLink',
  'beforeLink': 'beforeLink',
  'afterLink': 'beforeReflink',
  'beforeReflink': 'beforeReflink',
  'afterReflink': 'beforeEmStrong',
  'beforeEmStrong': 'beforeEmStrong',
  'afterEmStrong': 'beforeCodespan',
  'beforeCodespan': 'beforeCodespan',
  'afterCodespan': 'beforeBr',
  'beforeBr': 'beforeBr',
  'afterBr': 'beforeDel',
  'beforeDel': 'beforeDel',
  'afterDel': 'beforeAutolink',
  'beforeAutolink': 'beforeAutolink',
  'afterAutolink': 'beforeUrl',
  'beforeUrl': 'beforeUrl',
  'afterUrl': 'beforeInlineText',
  'beforeInlineText': 'beforeInlineText',
  'afterInlineText': 'beforeInlineEnd',
  'beforeInlineEnd': 'beforeInlineEnd',
} as const

export type LexerPosition = typeof tokenPositionMap[keyof typeof tokenPositionMap];
export type TokenizerPosition = typeof tokenizerBlockPositions[number] | typeof tokenizerInlinePositions[number];

interface TokenizerPositionExtension {
  name: string;
  position: TokenizerPosition;
  level?: 'block' | 'inline';
  start?: TokenizerStartFunction;
  tokenizer: TokenizerExtensionFunction;
  childTokens?: string[];
}
interface TokenizerLevelExtension {
  name: string;
  position?: TokenizerPosition;
  level: 'block' | 'inline';
  start?: TokenizerStartFunction;
  tokenizer: TokenizerExtensionFunction;
  childTokens?: string[];
}

export type TokenizerExtension = TokenizerPositionExtension | TokenizerLevelExtension;

export interface RendererThis {
  parser: _Parser;
}

export type RendererExtensionFunction = (this: RendererThis, token: Tokens.Generic) => string | false | undefined;

export interface RendererExtension {
  name: string;
  renderer: RendererExtensionFunction;
}

export type TokenizerAndRendererExtension = TokenizerExtension | RendererExtension | (TokenizerExtension & RendererExtension);

type HooksApi = Omit<_Hooks, 'constructor' | 'options' | 'block'>;
type HooksObject = {
  [K in keyof HooksApi]?: (this: _Hooks, ...args: Parameters<HooksApi[K]>) => ReturnType<HooksApi[K]> | Promise<ReturnType<HooksApi[K]>>
};

type RendererApi = Omit<_Renderer, 'constructor' | 'options' | 'parser'>;
type RendererObject = {
  [K in keyof RendererApi]?: (this: _Renderer, ...args: Parameters<RendererApi[K]>) => ReturnType<RendererApi[K]> | false
};

type TokenizerApi = Omit<_Tokenizer, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject = {
  [K in keyof TokenizerApi]?: (this: _Tokenizer, ...args: Parameters<TokenizerApi[K]>) => ReturnType<TokenizerApi[K]> | false
};

export interface MarkedExtension {
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
    | TokenizerAndRendererExtension[]
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
  hooks?: HooksObject | null;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix any of the original markdown bugs or poor behavior.
   */
  pedantic?: boolean;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: RendererObject | null;

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

export interface MarkedOptions extends Omit<MarkedExtension, 'hooks' | 'renderer' | 'tokenizer' | 'extensions' | 'walkTokens'> {
  /**
   * Hooks are methods that hook into some part of marked.
   */
  hooks?: _Hooks | null;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: _Renderer | null;

  /**
   * The tokenizer defines how to turn markdown text into tokens.
   */
  tokenizer?: _Tokenizer | null;

  /**
   * Custom extensions
   */
  extensions?: null | {
    renderers: {
      [name: string]: RendererExtensionFunction;
    };
    tokenizers: {
      [k in LexerPosition]?: TokenizerExtensionFunction[];
    };
    childTokens: {
      [name: string]: string[];
    };
    startInline?: TokenizerStartFunction[];
    startBlock?: TokenizerStartFunction[];
  };

  /**
   * walkTokens function returns array of values for Promise.all
   */
  walkTokens?: null | ((token: Token) => void | Promise<void> | (void | Promise<void>)[]);
}
