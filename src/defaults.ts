import type { MarkedOptions } from './MarkedOptions.ts';

/**
 * Gets the original marked default options.
 */
export function _getDefaults<P = string, R = string>(): MarkedOptions<P, R> {
  return {
    async: false,
    breaks: false,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    renderer: null,
    silent: false,
    tokenizer: null,
    walkTokens: null,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let _defaults: MarkedOptions<any, any> = _getDefaults();

export function changeDefaults<P = string, R = string>(newDefaults: MarkedOptions<P, R>) {
  _defaults = newDefaults;
}
