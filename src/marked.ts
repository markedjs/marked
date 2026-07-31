import { _Lexer } from './Lexer.ts';
import { _Parser } from './Parser.ts';
import { _Tokenizer } from './Tokenizer.ts';
import { _Renderer } from './Renderer.ts';
import { _TextRenderer } from './TextRenderer.ts';
import { _Hooks } from './Hooks.ts';
import { Marked } from './Instance.ts';
import {
  _getDefaults,
  changeDefaults,
  _defaults,
} from './defaults.ts';
import type { MarkedExtension, MarkedOptions } from './MarkedOptions.ts';
import type { Token, TokensList } from './Tokens.ts';
import type { MaybePromise } from './Instance.ts';

const markedInstance = new Marked();

/**
 * Compiles markdown to HTML asynchronously.
 *
 * To configure hooks, a renderer, or a tokenizer, create a `Marked` instance
 * and use `Marked#use` instead of passing them as options on each call.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options, having async: true
 * @return Promise of string of compiled HTML
 */
export function marked(src: string, options: MarkedOptions & { async: true }): Promise<string>;

/**
 * Compiles markdown to HTML.
 *
 * To configure hooks, a renderer, or a tokenizer, create a `Marked` instance
 * and use `Marked#use` instead of passing them as options on each call.
 *
 * @param src String of markdown source to be compiled
 * @param options Optional hash of options
 * @return String of compiled HTML. Will be a Promise of string if async is set to true by any extensions.
 */
export function marked(src: string, options: MarkedOptions & { async: false }): string;
export function marked(src: string, options: MarkedOptions & { async: true }): Promise<string>;
export function marked(src: string, options?: MarkedOptions | null): string | Promise<string>;
export function marked(src: string, opt?: MarkedOptions | null): string | Promise<string> {
  return markedInstance.parse(src, opt);
}

export declare namespace marked {
  /**
   * Compiles inline markdown to HTML.
   *
   * To configure hooks, a renderer, or a tokenizer, create a `Marked` instance
   * and use `Marked#use` instead of passing them as options on each call.
   */
  let parseInline: typeof markedInstance.parseInline;

  /**
   * Registers extensions with the default Marked instance.
   *
   * The `renderer`, `tokenizer`, and `hooks` objects may each contain only the
   * methods that should be overridden. Their methods are merged with built-in
   * behavior and extensions registered by earlier calls.
   *
   * Use this function when supplying only some hook methods.
   */
  let use: (...args: MarkedExtension[]) => typeof marked;
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
 * Registers extensions with the default Marked instance.
 *
 * The `renderer`, `tokenizer`, and `hooks` objects may each contain only the
 * methods that should be overridden. Their methods are merged with built-in
 * behavior and extensions registered by earlier calls.
 *
 * Use this function when supplying only some hook methods.
 *
 * @param args Extensions to register
 * @return The `marked` function
 */
function useExtension(...args: MarkedExtension[]) {
  markedInstance.use(...args);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
}

marked.use = useExtension;

/**
 * Run callback for every token
 */

marked.walkTokens = function(tokens: Token[] | TokensList, callback: (token: Token) => MaybePromise | MaybePromise[]) {
  return markedInstance.walkTokens(tokens, callback);
};

/**
 * Compiles markdown to HTML without enclosing `p` tag.
 *
 * To configure hooks, a renderer, or a tokenizer, create a `Marked` instance
 * and use `Marked#use` instead of passing them as options on each call.
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
marked.Hooks = _Hooks;
marked.parse = marked;

export const options = marked.options;
export const setOptions = marked.setOptions;
export const walkTokens = marked.walkTokens;
/**
 * Compiles inline markdown to HTML.
 *
 * To configure hooks, a renderer, or a tokenizer, create a `Marked` instance
 * and use `Marked#use` instead of passing them as options on each call.
 */
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
export { _Hooks as Hooks } from './Hooks.ts';
export { Marked } from './Instance.ts';
export { useExtension as use };
export type * from './MarkedOptions.ts';
export type * from './Tokens.ts';
