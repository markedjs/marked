declare module "Tokens" {
    export type Token = (Tokens.Space | Tokens.Code | Tokens.Heading | Tokens.Table | Tokens.Hr | Tokens.Blockquote | Tokens.List | Tokens.ListItem | Tokens.Paragraph | Tokens.HTML | Tokens.Text | Tokens.Def | Tokens.Escape | Tokens.Tag | Tokens.Image | Tokens.Link | Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Br | Tokens.Del | Tokens.Generic);
    export namespace Tokens {
        interface Space {
            type: 'space';
            raw: string;
        }
        interface Code {
            type: 'code';
            raw: string;
            codeBlockStyle?: 'indented' | undefined;
            lang?: string | undefined;
            text: string;
            escaped?: boolean;
        }
        interface Heading {
            type: 'heading';
            raw: string;
            depth: number;
            text: string;
            tokens: Token[];
        }
        interface Table {
            type: 'table';
            raw: string;
            align: Array<'center' | 'left' | 'right' | null>;
            header: TableCell[];
            rows: TableCell[][];
        }
        interface TableCell {
            text: string;
            tokens: Token[];
        }
        interface Hr {
            type: 'hr';
            raw: string;
        }
        interface Blockquote {
            type: 'blockquote';
            raw: string;
            text: string;
            tokens: Token[];
        }
        interface List {
            type: 'list';
            raw: string;
            ordered: boolean;
            start: number | '';
            loose: boolean;
            items: ListItem[];
        }
        interface ListItem {
            type: 'list_item';
            raw: string;
            task: boolean;
            checked?: boolean | undefined;
            loose: boolean;
            text: string;
            tokens: Token[];
        }
        interface Paragraph {
            type: 'paragraph';
            raw: string;
            pre?: boolean | undefined;
            text: string;
            tokens: Token[];
        }
        interface HTML {
            type: 'html';
            raw: string;
            pre: boolean;
            text: string;
            block: boolean;
        }
        interface Text {
            type: 'text';
            raw: string;
            text: string;
            tokens?: Token[];
        }
        interface Def {
            type: 'def';
            raw: string;
            tag: string;
            href: string;
            title: string;
        }
        interface Escape {
            type: 'escape';
            raw: string;
            text: string;
        }
        interface Tag {
            type: 'text' | 'html';
            raw: string;
            inLink: boolean;
            inRawBlock: boolean;
            text: string;
            block: boolean;
        }
        interface Link {
            type: 'link';
            raw: string;
            href: string;
            title?: string | null;
            text: string;
            tokens: Token[];
        }
        interface Image {
            type: 'image';
            raw: string;
            href: string;
            title: string | null;
            text: string;
        }
        interface Strong {
            type: 'strong';
            raw: string;
            text: string;
            tokens: Token[];
        }
        interface Em {
            type: 'em';
            raw: string;
            text: string;
            tokens: Token[];
        }
        interface Codespan {
            type: 'codespan';
            raw: string;
            text: string;
        }
        interface Br {
            type: 'br';
            raw: string;
        }
        interface Del {
            type: 'del';
            raw: string;
            text: string;
            tokens: Token[];
        }
        interface Generic {
            [index: string]: any;
            type: string;
            raw: string;
            tokens?: Token[] | undefined;
        }
    }
    export type Links = Record<string, Pick<Tokens.Link | Tokens.Image, 'href' | 'title'>>;
    export type TokensList = Token[] & {
        links: Links;
    };
}
declare module "rules" {
    export type Rule = RegExp | string;
    export interface Rules {
        [ruleName: string]: Pick<RegExp, 'exec'> | Rule | Rules;
    }
    type BlockRuleNames = 'newline' | 'code' | 'fences' | 'hr' | 'heading' | 'blockquote' | 'list' | 'html' | 'def' | 'lheading' | '_paragraph' | 'text' | '_label' | '_title' | 'bullet' | 'listItemStart' | '_tag' | '_comment' | 'paragraph' | 'uote';
    type BlockSubRuleNames = 'normal' | 'gfm' | 'pedantic';
    type InlineRuleNames = 'escape' | 'autolink' | 'tag' | 'link' | 'reflink' | 'nolink' | 'reflinkSearch' | 'code' | 'br' | 'text' | '_punctuation' | 'punctuation' | 'blockSkip' | 'escapedEmSt' | '_comment' | '_escapes' | '_scheme' | '_email' | '_attribute' | '_label' | '_href' | '_title' | 'strong' | '_extended_email' | '_backpedal';
    type InlineSubRuleNames = 'gfm' | 'emStrong' | 'normal' | 'pedantic' | 'breaks';
    /**
     * Block-Level Grammar
     */
    export const block: Record<BlockRuleNames, Rule> & Record<BlockSubRuleNames, Rules> & Rules;
    /**
     * Inline-Level Grammar
     */
    export const inline: Record<InlineRuleNames, Rule> & Record<InlineSubRuleNames, Rules> & Rules;
}
declare module "helpers" {
    import type { Rule } from "rules";
    export function escape(html: string, encode?: boolean): string;
    export function unescape(html: string): string;
    export function edit(regex: Rule, opt?: string): {
        replace: (name: string | RegExp, val: string | RegExp) => any;
        getRegex: () => RegExp;
    };
    export function cleanUrl(href: string): string | null;
    export const noopTest: {
        exec: () => null;
    };
    export function splitCells(tableRow: string, count?: number): string[];
    /**
     * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
     * /c*$/ is vulnerable to REDOS.
     *
     * @param str
     * @param c
     * @param invert Remove suffix of non-c chars instead. Default falsey.
     */
    export function rtrim(str: string, c: string, invert?: boolean): string;
    export function findClosingBracket(str: string, b: string): number;
}
declare module "Renderer" {
    import type { MarkedOptions } from "MarkedOptions";
    /**
     * Renderer
     */
    export class _Renderer {
        options: MarkedOptions;
        constructor(options?: MarkedOptions);
        code(code: string, infostring: string | undefined, escaped: boolean): string;
        blockquote(quote: string): string;
        html(html: string, block?: boolean): string;
        heading(text: string, level: number, raw: string): string;
        hr(): string;
        list(body: string, ordered: boolean, start: number | ''): string;
        listitem(text: string, task: boolean, checked: boolean): string;
        checkbox(checked: boolean): string;
        paragraph(text: string): string;
        table(header: string, body: string): string;
        tablerow(content: string): string;
        tablecell(content: string, flags: {
            header: boolean;
            align: 'center' | 'left' | 'right' | null;
        }): string;
        /**
         * span level renderer
         */
        strong(text: string): string;
        em(text: string): string;
        codespan(text: string): string;
        br(): string;
        del(text: string): string;
        link(href: string, title: string | null | undefined, text: string): string;
        image(href: string, title: string | null, text: string): string;
        text(text: string): string;
    }
}
declare module "TextRenderer" {
    /**
     * TextRenderer
     * returns only the textual part of the token
     */
    export class _TextRenderer {
        strong(text: string): string;
        em(text: string): string;
        codespan(text: string): string;
        del(text: string): string;
        html(text: string): string;
        text(text: string): string;
        link(href: string, title: string | null | undefined, text: string): string;
        image(href: string, title: string | null, text: string): string;
        br(): string;
    }
}
declare module "Parser" {
    import { _Renderer } from "Renderer";
    import { _TextRenderer } from "TextRenderer";
    import type { Token } from "Tokens";
    import type { MarkedOptions } from "MarkedOptions";
    /**
     * Parsing & Compiling
     */
    export class _Parser {
        options: MarkedOptions;
        renderer: _Renderer;
        textRenderer: _TextRenderer;
        constructor(options?: MarkedOptions);
        /**
         * Static Parse Method
         */
        static parse(tokens: Token[], options?: MarkedOptions): string;
        /**
         * Static Parse Inline Method
         */
        static parseInline(tokens: Token[], options?: MarkedOptions): string;
        /**
         * Parse Loop
         */
        parse(tokens: Token[], top?: boolean): string;
        /**
         * Parse Inline Tokens
         */
        parseInline(tokens: Token[], renderer?: _Renderer | _TextRenderer): string;
    }
}
declare module "Tokenizer" {
    import type { _Lexer } from "Lexer";
    import type { Links, Tokens } from "Tokens";
    import type { MarkedOptions } from "MarkedOptions";
    /**
     * Tokenizer
     */
    export class _Tokenizer {
        options: MarkedOptions;
        rules: any;
        lexer: _Lexer;
        constructor(options?: MarkedOptions);
        space(src: string): Tokens.Space | undefined;
        code(src: string): Tokens.Code | undefined;
        fences(src: string): Tokens.Code | undefined;
        heading(src: string): Tokens.Heading | undefined;
        hr(src: string): Tokens.Hr | undefined;
        blockquote(src: string): Tokens.Blockquote | undefined;
        list(src: string): Tokens.List | undefined;
        html(src: string): Tokens.HTML | undefined;
        def(src: string): Tokens.Def | undefined;
        table(src: string): Tokens.Table | undefined;
        lheading(src: string): Tokens.Heading | undefined;
        paragraph(src: string): Tokens.Paragraph | undefined;
        text(src: string): Tokens.Text | undefined;
        escape(src: string): Tokens.Escape | undefined;
        tag(src: string): Tokens.Tag | undefined;
        link(src: string): Tokens.Link | Tokens.Image | undefined;
        reflink(src: string, links: Links): Tokens.Link | Tokens.Image | Tokens.Text | undefined;
        emStrong(src: string, maskedSrc: string, prevChar?: string): Tokens.Em | Tokens.Strong | undefined;
        codespan(src: string): Tokens.Codespan | undefined;
        br(src: string): Tokens.Br | undefined;
        del(src: string): Tokens.Del | undefined;
        autolink(src: string): Tokens.Link | undefined;
        url(src: string): Tokens.Link | undefined;
        inlineText(src: string): Tokens.Text | undefined;
    }
}
declare module "Lexer" {
    import type { Token, TokensList } from "Tokens";
    import type { MarkedOptions } from "MarkedOptions";
    import type { Rules } from "rules";
    /**
     * Block Lexer
     */
    export class _Lexer {
        tokens: TokensList;
        options: MarkedOptions;
        state: {
            inLink: boolean;
            inRawBlock: boolean;
            top: boolean;
        };
        private tokenizer;
        private inlineQueue;
        constructor(options?: MarkedOptions);
        /**
         * Expose Rules
         */
        static get rules(): Rules;
        /**
         * Static Lex Method
         */
        static lex(src: string, options?: MarkedOptions): TokensList;
        /**
         * Static Lex Inline Method
         */
        static lexInline(src: string, options?: MarkedOptions): Token[];
        /**
         * Preprocessing
         */
        lex(src: string): TokensList;
        /**
         * Lexing
         */
        blockTokens(src: string, tokens?: Token[]): Token[];
        blockTokens(src: string, tokens?: TokensList): TokensList;
        inline(src: string, tokens?: Token[]): Token[];
        /**
         * Lexing/Compiling
         */
        inlineTokens(src: string, tokens?: Token[]): Token[];
    }
}
declare module "MarkedOptions" {
    import type { Token, Tokens, TokensList } from "Tokens";
    import type { _Parser } from "Parser";
    import type { _Lexer } from "Lexer";
    import type { _Renderer } from "Renderer";
    import type { _Tokenizer } from "Tokenizer";
    export interface TokenizerThis {
        lexer: _Lexer;
    }
    export type TokenizerExtensionFunction = (this: TokenizerThis, src: string, tokens: Token[] | TokensList) => Tokens.Generic | undefined;
    export type TokenizerStartFunction = (this: TokenizerThis, src: string) => number | void;
    export interface TokenizerExtension {
        name: string;
        level: 'block' | 'inline';
        start?: TokenizerStartFunction | undefined;
        tokenizer: TokenizerExtensionFunction;
        childTokens?: string[] | undefined;
    }
    export interface RendererThis {
        parser: _Parser;
    }
    export type RendererExtensionFunction = (this: RendererThis, token: Tokens.Generic) => string | false | undefined;
    export interface RendererExtension {
        name: string;
        renderer: RendererExtensionFunction;
    }
    export type TokenizerAndRendererExtension = TokenizerExtension | RendererExtension | (TokenizerExtension & RendererExtension);
    type RendererApi = Omit<_Renderer, 'constructor' | 'options'>;
    type RendererObject = {
        [K in keyof RendererApi]?: (...args: Parameters<RendererApi[K]>) => ReturnType<RendererApi[K]> | false;
    };
    type TokenizerApi = Omit<_Tokenizer, 'constructor' | 'options' | 'rules' | 'lexer'>;
    type TokenizerObject = {
        [K in keyof TokenizerApi]?: (...args: Parameters<TokenizerApi[K]>) => ReturnType<TokenizerApi[K]> | false;
    };
    export interface MarkedExtension {
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
        extensions?: TokenizerAndRendererExtension[] | undefined | null;
        /**
         * Enable GitHub flavored markdown.
         */
        gfm?: boolean | undefined;
        /**
         * Hooks are methods that hook into some part of marked.
         * preprocess is called to process markdown before sending it to marked.
         * postprocess is called to process html after marked has finished parsing.
         */
        hooks?: {
            preprocess: (markdown: string) => string | Promise<string>;
            postprocess: (html: string) => string | Promise<string>;
            options?: MarkedOptions;
        } | null;
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
    export interface MarkedOptions extends Omit<MarkedExtension, 'renderer' | 'tokenizer' | 'extensions' | 'walkTokens'> {
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
}
declare module "defaults" {
    import type { MarkedOptions } from "MarkedOptions";
    /**
     * Gets the original marked default options.
     */
    export function _getDefaults(): MarkedOptions;
    export let _defaults: MarkedOptions;
    export function changeDefaults(newDefaults: MarkedOptions): void;
}
declare module "Hooks" {
    import type { MarkedOptions } from "MarkedOptions";
    export class _Hooks {
        options: MarkedOptions;
        constructor(options?: MarkedOptions);
        static passThroughHooks: Set<string>;
        /**
         * Process markdown before marked
         */
        preprocess(markdown: string): string;
        /**
         * Process HTML after marked is finished
         */
        postprocess(html: string): string;
    }
}
declare module "Instance" {
    import { _Lexer } from "Lexer";
    import { _Parser } from "Parser";
    import { _Hooks } from "Hooks";
    import { _Renderer } from "Renderer";
    import { _Tokenizer } from "Tokenizer";
    import { _TextRenderer } from "TextRenderer";
    import type { MarkedExtension, MarkedOptions } from "MarkedOptions";
    import type { Token, TokensList } from "Tokens";
    export type MaybePromise = void | Promise<void>;
    export class Marked {
        #private;
        defaults: MarkedOptions;
        options: (opt: MarkedOptions) => this;
        parse: (src: string, options?: MarkedOptions | undefined | null) => string | Promise<string>;
        parseInline: (src: string, options?: MarkedOptions | undefined | null) => string | Promise<string>;
        Parser: typeof _Parser;
        parser: typeof _Parser.parse;
        Renderer: typeof _Renderer;
        TextRenderer: typeof _TextRenderer;
        Lexer: typeof _Lexer;
        lexer: typeof _Lexer.lex;
        Tokenizer: typeof _Tokenizer;
        Hooks: typeof _Hooks;
        constructor(...args: MarkedExtension[]);
        /**
         * Run callback for every token
         */
        walkTokens(tokens: Token[] | TokensList, callback: (token: Token) => MaybePromise | MaybePromise[]): MaybePromise[];
        use(...args: MarkedExtension[]): this;
        setOptions(opt: MarkedOptions): this;
    }
}
declare module "marked" {
    import { _Lexer } from "Lexer";
    import { _Parser } from "Parser";
    import { _Tokenizer } from "Tokenizer";
    import { _Renderer } from "Renderer";
    import { _TextRenderer } from "TextRenderer";
    import { _Hooks } from "Hooks";
    import { _getDefaults } from "defaults";
    import type { MarkedExtension, MarkedOptions } from "MarkedOptions";
    import type { Token, TokensList } from "Tokens";
    import type { MaybePromise } from "Instance";
    /**
     * Compiles markdown to HTML asynchronously.
     *
     * @param src String of markdown source to be compiled
     * @param options Hash of options, having async: true
     * @return Promise of string of compiled HTML
     */
    export function marked(src: string, options: MarkedOptions & {
        async: true;
    }): Promise<string>;
    /**
     * Compiles markdown to HTML synchronously.
     *
     * @param src String of markdown source to be compiled
     * @param options Optional hash of options
     * @return String of compiled HTML
     */
    export function marked(src: string, options?: MarkedOptions): string;
    /**
     * Compiles markdown to HTML synchronously.
     *
     * @param src String of markdown source to be compiled
     * @param options Optional hash of options
     * @return String of compiled HTML
     */
    export namespace marked {
        var options: (options: MarkedOptions) => typeof marked;
        var setOptions: (options: MarkedOptions) => typeof marked;
        var getDefaults: typeof _getDefaults;
        var defaults: MarkedOptions;
        var use: (...args: MarkedExtension[]) => typeof marked;
        var walkTokens: (tokens: Token[] | TokensList, callback: (token: Token) => MaybePromise | MaybePromise[]) => MaybePromise[];
        var parseInline: (src: string, options?: MarkedOptions | null | undefined) => string | Promise<string>;
        var Parser: typeof _Parser;
        var parser: typeof _Parser.parse;
        var Renderer: typeof _Renderer;
        var TextRenderer: typeof _TextRenderer;
        var Lexer: typeof _Lexer;
        var lexer: typeof _Lexer.lex;
        var Tokenizer: typeof _Tokenizer;
        var Hooks: typeof _Hooks;
        var parse: typeof marked;
    }
    export const options: (options: MarkedOptions) => typeof marked;
    export const setOptions: (options: MarkedOptions) => typeof marked;
    export const use: (...args: MarkedExtension[]) => typeof marked;
    export const walkTokens: (tokens: Token[] | TokensList, callback: (token: Token) => MaybePromise | MaybePromise[]) => MaybePromise[];
    export const parseInline: (src: string, options?: MarkedOptions | null | undefined) => string | Promise<string>;
    export const parse: typeof marked;
    export const parser: typeof _Parser.parse;
    export const lexer: typeof _Lexer.lex;
    export { _defaults as defaults, _getDefaults as getDefaults } from "defaults";
    export { _Lexer as Lexer } from "Lexer";
    export { _Parser as Parser } from "Parser";
    export { _Tokenizer as Tokenizer } from "Tokenizer";
    export { _Renderer as Renderer } from "Renderer";
    export { _TextRenderer as TextRenderer } from "TextRenderer";
    export { _Hooks as Hooks } from "Hooks";
    export { Marked } from "Instance";
    export type * from "MarkedOptions";
    export type * from "rules";
    export type * from "Tokens";
}
