import { _getDefaults } from './defaults.ts';
import { _Lexer } from './Lexer.ts';
import { _Parser } from './Parser.ts';
import { _Hooks } from './Hooks.ts';
import { _Renderer } from './Renderer.ts';
import { _Tokenizer } from './Tokenizer.ts';
import { _TextRenderer } from './TextRenderer.ts';
import {
  escape
} from './helpers.ts';
import type { MarkedExtension, MarkedOptions } from './MarkedOptions.ts';
import type { Token, Tokens, TokensList } from './Tokens.ts';

export type MaybePromise = void | Promise<void>;

type UnknownFunction = (...args: unknown[]) => unknown;
type GenericRendererFunction = (...args: unknown[]) => string | false;

export class Marked {
  defaults = _getDefaults();
  options = this.setOptions;

  parse = this.#parseMarkdown(_Lexer.lex, _Parser.parse);
  parseInline = this.#parseMarkdown(_Lexer.lexInline, _Parser.parseInline);

  Parser = _Parser;
  Renderer = _Renderer;
  TextRenderer = _TextRenderer;
  Lexer = _Lexer;
  Tokenizer = _Tokenizer;
  Hooks = _Hooks;

  constructor(...args: MarkedExtension[]) {
    this.use(...args);
  }

  /**
   * Run callback for every token
   */
  walkTokens(tokens: Token[] | TokensList, callback: (token: Token) => MaybePromise | MaybePromise[]) {
    let values: MaybePromise[] = [];
    for (const token of tokens) {
      values = values.concat(callback.call(this, token));
      switch (token.type) {
        case 'table': {
          const tableToken = token as Tokens.Table;
          for (const cell of tableToken.header) {
            values = values.concat(this.walkTokens(cell.tokens, callback));
          }
          for (const row of tableToken.rows) {
            for (const cell of row) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
          }
          break;
        }
        case 'list': {
          const listToken = token as Tokens.List;
          values = values.concat(this.walkTokens(listToken.items, callback));
          break;
        }
        default: {
          const genericToken = token as Tokens.Generic;
          if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
            this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
              values = values.concat(this.walkTokens(genericToken[childTokens], callback));
            });
          } else if (genericToken.tokens) {
            values = values.concat(this.walkTokens(genericToken.tokens, callback));
          }
        }
      }
    }
    return values;
  }

  use(...args: MarkedExtension[]) {
    const extensions: MarkedOptions['extensions'] = this.defaults.extensions || { renderers: {}, childTokens: {} };

    args.forEach((pack) => {
      // copy options to new object
      const opts = { ...pack } as MarkedOptions;

      // set async to true if it was set to true before
      opts.async = this.defaults.async || opts.async || false;

      // ==-- Parse "addon" extensions --== //
      if (pack.extensions) {
        pack.extensions.forEach((ext) => {
          if (!ext.name) {
            throw new Error('extension name required');
          }
          if ('renderer' in ext) { // Renderer extensions
            const prevRenderer = extensions.renderers[ext.name];
            if (prevRenderer) {
              // Replace extension with func to run new extension but fall back if false
              extensions.renderers[ext.name] = function(...args) {
                let ret = ext.renderer.apply(this, args);
                if (ret === false) {
                  ret = prevRenderer.apply(this, args);
                }
                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }
          if ('tokenizer' in ext) { // Tokenizer Extensions
            if (!ext.level || (ext.level !== 'block' && ext.level !== 'inline')) {
              throw new Error("extension level must be 'block' or 'inline'");
            }
            const extLevel = extensions[ext.level];
            if (extLevel) {
              extLevel.unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }
            if (ext.start) { // Function to check for start of token
              if (ext.level === 'block') {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === 'inline') {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }
          if ('childTokens' in ext && ext.childTokens) { // Child tokens to be visited by walkTokens
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
        opts.extensions = extensions;
      }

      // ==-- Parse "overwrite" extensions --== //
      if (pack.renderer) {
        const renderer = this.defaults.renderer || new _Renderer(this.defaults);
        for (const prop in pack.renderer) {
          if (!(prop in renderer)) {
            throw new Error(`renderer '${prop}' does not exist`);
          }
          if (prop === 'options') {
            // ignore options property
            continue;
          }
          const rendererProp = prop as Exclude<keyof _Renderer, 'options'>;
          const rendererFunc = pack.renderer[rendererProp] as GenericRendererFunction;
          const prevRenderer = renderer[rendererProp] as GenericRendererFunction;
          // Replace renderer with func to run extension, but fall back if false
          renderer[rendererProp] = (...args: unknown[]) => {
            let ret = rendererFunc.apply(renderer, args);
            if (ret === false) {
              ret = prevRenderer.apply(renderer, args);
            }
            return ret || '';
          };
        }
        opts.renderer = renderer;
      }
      if (pack.tokenizer) {
        const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
        for (const prop in pack.tokenizer) {
          if (!(prop in tokenizer)) {
            throw new Error(`tokenizer '${prop}' does not exist`);
          }
          if (['options', 'rules', 'lexer'].includes(prop)) {
            // ignore options, rules, and lexer properties
            continue;
          }
          const tokenizerProp = prop as Exclude<keyof _Tokenizer, 'options' | 'rules' | 'lexer'>;
          const tokenizerFunc = pack.tokenizer[tokenizerProp] as UnknownFunction;
          const prevTokenizer = tokenizer[tokenizerProp] as UnknownFunction;
          // Replace tokenizer with func to run extension, but fall back if false
          // @ts-expect-error cannot type tokenizer function dynamically
          tokenizer[tokenizerProp] = (...args: unknown[]) => {
            let ret = tokenizerFunc.apply(tokenizer, args);
            if (ret === false) {
              ret = prevTokenizer.apply(tokenizer, args);
            }
            return ret;
          };
        }
        opts.tokenizer = tokenizer;
      }

      // ==-- Parse Hooks extensions --== //
      if (pack.hooks) {
        const hooks = this.defaults.hooks || new _Hooks();
        for (const prop in pack.hooks) {
          if (!(prop in hooks)) {
            throw new Error(`hook '${prop}' does not exist`);
          }
          if (prop === 'options') {
            // ignore options property
            continue;
          }
          const hooksProp = prop as Exclude<keyof _Hooks, 'options'>;
          const hooksFunc = pack.hooks[hooksProp] as UnknownFunction;
          const prevHook = hooks[hooksProp] as UnknownFunction;
          if (_Hooks.passThroughHooks.has(prop)) {
            // @ts-expect-error cannot type hook function dynamically
            hooks[hooksProp] = (arg: unknown) => {
              if (this.defaults.async) {
                return Promise.resolve(hooksFunc.call(hooks, arg)).then(ret => {
                  return prevHook.call(hooks, ret);
                });
              }

              const ret = hooksFunc.call(hooks, arg);
              return prevHook.call(hooks, ret);
            };
          } else {
            // @ts-expect-error cannot type hook function dynamically
            hooks[hooksProp] = (...args: unknown[]) => {
              let ret = hooksFunc.apply(hooks, args);
              if (ret === false) {
                ret = prevHook.apply(hooks, args);
              }
              return ret;
            };
          }
        }
        opts.hooks = hooks;
      }

      // ==-- Parse WalkTokens extensions --== //
      if (pack.walkTokens) {
        const walkTokens = this.defaults.walkTokens;
        const packWalktokens = pack.walkTokens;
        opts.walkTokens = function(token) {
          let values: MaybePromise[] = [];
          values.push(packWalktokens.call(this, token));
          if (walkTokens) {
            values = values.concat(walkTokens.call(this, token));
          }
          return values;
        };
      }

      this.defaults = { ...this.defaults, ...opts };
    });

    return this;
  }

  setOptions(opt: MarkedOptions) {
    this.defaults = { ...this.defaults, ...opt };
    return this;
  }

  lexer(src: string, options?: MarkedOptions) {
    return _Lexer.lex(src, options ?? this.defaults);
  }

  parser(tokens: Token[], options?: MarkedOptions) {
    return _Parser.parse(tokens, options ?? this.defaults);
  }

  #parseMarkdown(lexer: (src: string, options?: MarkedOptions) => TokensList | Token[], parser: (tokens: Token[], options?: MarkedOptions) => string) {
    return (src: string, options?: MarkedOptions | undefined | null): string | Promise<string> => {
      const origOpt = { ...options };
      const opt = { ...this.defaults, ...origOpt };

      // Show warning if an extension set async to true but the parse was called with async: false
      if (this.defaults.async === true && origOpt.async === false) {
        if (!opt.silent) {
          console.warn('marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored.');
        }

        opt.async = true;
      }

      const throwError = this.#onError(!!opt.silent, !!opt.async);

      // throw error in case of non string input
      if (typeof src === 'undefined' || src === null) {
        return throwError(new Error('marked(): input parameter is undefined or null'));
      }
      if (typeof src !== 'string') {
        return throwError(new Error('marked(): input parameter is of type '
          + Object.prototype.toString.call(src) + ', string expected'));
      }

      if (opt.hooks) {
        opt.hooks.options = opt;
      }

      if (opt.async) {
        return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src)
          .then(src => lexer(src, opt))
          .then(tokens => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens)
          .then(tokens => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens)
          .then(tokens => parser(tokens, opt))
          .then(html => opt.hooks ? opt.hooks.postprocess(html) : html)
          .catch(throwError);
      }

      try {
        if (opt.hooks) {
          src = opt.hooks.preprocess(src) as string;
        }
        let tokens = lexer(src, opt);
        if (opt.hooks) {
          tokens = opt.hooks.processAllTokens(tokens) as Token[] | TokensList;
        }
        if (opt.walkTokens) {
          this.walkTokens(tokens, opt.walkTokens);
        }
        let html = parser(tokens, opt);
        if (opt.hooks) {
          html = opt.hooks.postprocess(html) as string;
        }
        return html;
      } catch (e) {
        return throwError(e as Error);
      }
    };
  }

  #onError(silent: boolean, async: boolean) {
    return (e: Error): string | Promise<string> => {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';

      if (silent) {
        const msg = '<p>An error occurred:</p><pre>'
          + escape(e.message + '', true)
          + '</pre>';
        if (async) {
          return Promise.resolve(msg);
        }
        return msg;
      }

      if (async) {
        return Promise.reject(e);
      }
      throw e;
    };
  }
}
