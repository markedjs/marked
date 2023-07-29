import { _Lexer } from './Lexer.ts';
import { _Parser } from './Parser.ts';
import { _Tokenizer } from './Tokenizer.ts';
import { _Renderer } from './Renderer.ts';
import { _TextRenderer } from './TextRenderer.ts';
import { _Slugger } from './Slugger.ts';
import { _Hooks } from './Hooks.ts';
import { Marked } from './Instance.ts';
import {
  _getDefaults,
  changeDefaults,
  _defaults
} from './defaults.ts';
import type { MarkedExtension, MarkedOptions } from './MarkedOptions.ts';
import type { Token, TokensList } from './Tokens.ts';

export type ResultCallback = (error: Error | null, parseResult?: string) => undefined | void;

const markedInstance = new Marked();

/**
 * Compiles markdown to HTML asynchronously.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options, having async: true
 * @return Promise of string of compiled HTML
 */
export function marked(src: string, options: MarkedOptions & { async: true }): Promise<string>;

/**
 * Compiles markdown to HTML synchronously.
 *
 * @param src String of markdown source to be compiled
 * @param options Optional hash of options
 * @return String of compiled HTML
 */
export function marked(src: string, options?: MarkedOptions): string;

/**
 * Compiles markdown to HTML asynchronously with a callback.
 *
 * @param src String of markdown source to be compiled
 * @param callback Function called when the markdownString has been fully parsed when using async highlighting
 */
export function marked(src: string, callback: ResultCallback): void;

/**
 * Compiles markdown to HTML asynchronously with a callback.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options
 * @param callback Function called when the markdownString has been fully parsed when using async highlighting
 */
export function marked(
    src: string,
    options: MarkedOptions,
    callback: ResultCallback,
): void;
export function marked(src: string, opt?: MarkedOptions | ResultCallback, callback?: ResultCallback): string | Promise<string | undefined> | undefined {
  return markedInstance.parse(src, opt, callback);
}

/**
 * Sets the default options.
 *
 * @param options Hash of options
 */
marked.options =
marked.setOptions = function(options: MarkedOptions) {
  markedInstance.setOptions(options);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};

/**
 * Gets the original marked default options.
 */
marked.getDefaults = _getDefaults;

marked.defaults = _defaults;

/**
 * Use Extension
 */

marked.use = function(...args: MarkedExtension[]) {
  markedInstance.use(...args);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};

/**
 * Run callback for every token
 */

marked.walkTokens = function <T = void>(tokens: Token[] | TokensList, callback: (token: Token) => T | T[]) {
  return markedInstance.walkTokens(tokens, callback);
};

/**
 * Compiles markdown to HTML without enclosing `p` tag.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options
 * @return String of compiled HTML
 */
marked.parseInline = markedInstance.parseInline;

/**
 * Expose
 */
marked.Parser = _Parser;
marked.parser = _Parser.parse;
marked.Renderer = _Renderer;
marked.TextRenderer = _TextRenderer;
marked.Lexer = _Lexer;
marked.lexer = _Lexer.lex;
marked.Tokenizer = _Tokenizer;
marked.Slugger = _Slugger;
marked.Hooks = _Hooks;
marked.parse = marked;

export const options = marked.options;
export const setOptions = marked.setOptions;
export const use = marked.use;
export const walkTokens = marked.walkTokens;
export const parseInline = marked.parseInline;
export const parse = marked;
export const parser = _Parser.parse;
export const lexer = _Lexer.lex;
export { _defaults as defaults, _getDefaults as getDefaults } from './defaults.ts';
export { _Lexer as Lexer } from './Lexer.ts';
export { _Parser as Parser } from './Parser.ts';
export { _Tokenizer as Tokenizer } from './Tokenizer.ts';
export { _Renderer as Renderer } from './Renderer.ts';
export { _TextRenderer as TextRenderer } from './TextRenderer.ts';
export { _Slugger as Slugger } from './Slugger.ts';
export { _Hooks as Hooks } from './Hooks.ts';
export { Marked } from './Instance.ts';
export type * from './MarkedOptions.ts';
export type * from './rules.ts';
export type * from './Tokens.ts';
