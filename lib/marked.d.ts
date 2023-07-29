type Token = (Tokens.Space | Tokens.Code | Tokens.Heading | Tokens.Table | Tokens.Hr | Tokens.Blockquote | Tokens.List | Tokens.ListItem | Tokens.Paragraph | Tokens.HTML | Tokens.Text | Tokens.Def | Tokens.Escape | Tokens.Tag | Tokens.Image | Tokens.Link | Tokens.Strong | Tokens.Em | Tokens.Codespan | Tokens.Br | Tokens.Del) & {
    loose?: boolean;
    tokens?: Token[];
};
declare namespace Tokens {
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
        raw?: string;
        align: Array<'center' | 'left' | 'right' | null>;
        header: TableCell[];
        rows: TableCell[][];
    }
    interface TableCell {
        text: string;
        tokens?: Token[];
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
        tokens?: Token[];
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
type Links = Record<string, Pick<Tokens.Link | Tokens.Image, 'href' | 'title'>>;
type TokensList = Token[] & {
    links: Links;
};

/**
 * Renderer
 */
declare class _Renderer {
    options: MarkedOptions;
    constructor(options?: MarkedOptions);
    code(code: string, infostring: string | undefined, escaped: boolean): string;
    blockquote(quote: string): string;
    html(html: string, block?: boolean): string;
    heading(text: string, level: number, raw: string, slugger: _Slugger): string;
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

/**
 * TextRenderer
 * returns only the textual part of the token
 */
declare class _TextRenderer {
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

/**
 * Slugger generates header id
 */
declare class _Slugger {
    seen: {
        [slugValue: string]: number;
    };
    constructor();
    serialize(value: string): string;
    /**
     * Finds the next safe (unique) slug to use
     */
    getNextSafeSlug(originalSlug: string, isDryRun: boolean | undefined): string;
    /**
     * Convert string to unique id
     */
    slug(value: string, options?: SluggerOptions): string;
}

/**
 * Parsing & Compiling
 */
declare class _Parser {
    options: MarkedOptions;
    renderer: _Renderer;
    textRenderer: _TextRenderer;
    slugger: _Slugger;
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

/**
 * Tokenizer
 */
declare class _Tokenizer {
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
    html(src: string): Tokens.HTML | Tokens.Paragraph | undefined;
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
    autolink(src: string, mangle: (cap: string) => string): Tokens.Link | undefined;
    url(src: string, mangle: (cap: string) => string): Tokens.Link | undefined;
    inlineText(src: string, smartypants: (cap: string) => string): Tokens.Text | undefined;
}

interface SluggerOptions {
    /** Generates the next unique slug without updating the internal accumulator. */
    dryrun?: boolean;
}
interface TokenizerThis {
    lexer: _Lexer;
}
interface TokenizerExtension {
    name: string;
    level: 'block' | 'inline';
    start?: ((this: TokenizerThis, src: string) => number | void) | undefined;
    tokenizer: (this: TokenizerThis, src: string, tokens: Token[] | TokensList) => Tokens.Generic | void;
    childTokens?: string[] | undefined;
}
interface RendererThis {
    parser: _Parser;
}
interface RendererExtension {
    name: string;
    renderer: (this: RendererThis, token: Tokens.Generic) => string | false | undefined;
}
type TokenizerAndRendererExtension = TokenizerExtension | RendererExtension | (TokenizerExtension & RendererExtension);
type RendererApi = Omit<_Renderer, 'constructor' | 'options'>;
type RendererObject = {
    [K in keyof RendererApi]?: (...args: Parameters<RendererApi[K]>) => ReturnType<RendererApi[K]> | false;
};
type TokenizerApi = Omit<_Tokenizer, 'constructor' | 'options' | 'rules' | 'lexer'>;
type TokenizerObject = {
    [K in keyof TokenizerApi]?: (...args: Parameters<TokenizerApi[K]>) => ReturnType<TokenizerApi[K]> | false;
};
interface MarkedExtension {
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
    extensions?: TokenizerAndRendererExtension[] | undefined | null;
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
        preprocess: (markdown: string) => string;
        postprocess: (html: string | undefined) => string | undefined;
        options?: MarkedOptions;
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
interface MarkedOptions extends Omit<MarkedExtension, 'extensions' | 'renderer' | 'tokenizer' | 'walkTokens'> {
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
    extensions?: (TokenizerAndRendererExtension[] & {
        renderers: Record<string, (this: RendererThis, token: Tokens.Generic) => string | false | undefined>;
        childTokens: Record<string, string[]>;
        block: any[];
        inline: any[];
        startBlock: Array<(this: TokenizerThis, src: string) => number | void>;
        startInline: Array<(this: TokenizerThis, src: string) => number | void>;
    }) | undefined | null;
}

type Rule = RegExp | string;
interface Rules {
    [ruleName: string]: Pick<RegExp, 'exec'> | Rule | Rules;
}
type BlockRuleNames = 'newline' | 'code' | 'fences' | 'hr' | 'heading' | 'blockquote' | 'list' | 'html' | 'def' | 'lheading' | '_paragraph' | 'text' | '_label' | '_title' | 'bullet' | 'listItemStart' | '_tag' | '_comment' | 'paragraph' | 'uote';
type BlockSubRuleNames = 'normal' | 'gfm' | 'pedantic';
type InlineRuleNames = 'escape' | 'autolink' | 'tag' | 'link' | 'reflink' | 'nolink' | 'reflinkSearch' | 'code' | 'br' | 'text' | '_punctuation' | 'punctuation' | 'blockSkip' | 'escapedEmSt' | '_comment' | '_escapes' | '_scheme' | '_email' | '_attribute' | '_label' | '_href' | '_title' | 'strong' | '_extended_email' | '_backpedal';
type InlineSubRuleNames = 'gfm' | 'emStrong' | 'normal' | 'pedantic' | 'breaks';
/**
 * Block-Level Grammar
 */
declare const block: Record<BlockRuleNames, Rule> & Record<BlockSubRuleNames, Rules> & Rules;
/**
 * Inline-Level Grammar
 */
declare const inline: Record<InlineRuleNames, Rule> & Record<InlineSubRuleNames, Rules> & Rules;

/**
 * Block Lexer
 */
declare class _Lexer {
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

declare class _Hooks {
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
    postprocess(html: string | undefined): string | undefined;
}

type ResultCallback$1 = (error: Error | null, parseResult?: string) => undefined | void;
declare class Marked {
    #private;
    defaults: MarkedOptions;
    options: (opt: any) => this;
    parse: (src: string, optOrCallback?: MarkedOptions | ResultCallback$1 | undefined | null, callback?: ResultCallback$1 | undefined) => string | Promise<string | undefined> | undefined;
    parseInline: (src: string, optOrCallback?: MarkedOptions | ResultCallback$1 | undefined | null, callback?: ResultCallback$1 | undefined) => string | Promise<string | undefined> | undefined;
    Parser: typeof _Parser;
    parser: typeof _Parser.parse;
    Renderer: typeof _Renderer;
    TextRenderer: typeof _TextRenderer;
    Lexer: typeof _Lexer;
    lexer: typeof _Lexer.lex;
    Tokenizer: typeof _Tokenizer;
    Slugger: typeof _Slugger;
    Hooks: typeof _Hooks;
    constructor(...args: MarkedExtension[]);
    /**
     * Run callback for every token
     */
    walkTokens<T = void>(tokens: Token[] | TokensList, callback: (token: Token) => T | T[]): T[];
    use(...args: MarkedExtension[]): this;
    setOptions(opt: any): this;
}

/**
 * Gets the original marked default options.
 */
declare function _getDefaults(): MarkedOptions;
declare let _defaults: MarkedOptions;

type ResultCallback = (error: Error | null, parseResult?: string) => undefined | void;
/**
 * Compiles markdown to HTML asynchronously.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options, having async: true
 * @return Promise of string of compiled HTML
 */
declare function marked(src: string, options: MarkedOptions & {
    async: true;
}): Promise<string>;
/**
 * Compiles markdown to HTML synchronously.
 *
 * @param src String of markdown source to be compiled
 * @param options Optional hash of options
 * @return String of compiled HTML
 */
declare function marked(src: string, options?: MarkedOptions): string;
/**
 * Compiles markdown to HTML asynchronously with a callback.
 *
 * @param src String of markdown source to be compiled
 * @param callback Function called when the markdownString has been fully parsed when using async highlighting
 */
declare function marked(src: string, callback: ResultCallback): void;
/**
 * Compiles markdown to HTML asynchronously with a callback.
 *
 * @param src String of markdown source to be compiled
 * @param options Hash of options
 * @param callback Function called when the markdownString has been fully parsed when using async highlighting
 */
declare function marked(src: string, options: MarkedOptions, callback: ResultCallback): void;
declare namespace marked {
    var options: (options: MarkedOptions) => typeof marked;
    var setOptions: (options: MarkedOptions) => typeof marked;
    var getDefaults: typeof _getDefaults;
    var defaults: MarkedOptions;
    var use: (...args: MarkedExtension[]) => typeof marked;
    var walkTokens: <T = void>(tokens: TokensList | Token[], callback: (token: Token) => T | T[]) => T[];
    var parseInline: (src: string, optOrCallback?: MarkedOptions | ResultCallback$1 | null | undefined, callback?: ResultCallback$1 | undefined) => string | Promise<string | undefined> | undefined;
    var Parser: typeof _Parser;
    var parser: typeof _Parser.parse;
    var Renderer: typeof _Renderer;
    var TextRenderer: typeof _TextRenderer;
    var Lexer: typeof _Lexer;
    var lexer: typeof _Lexer.lex;
    var Tokenizer: typeof _Tokenizer;
    var Slugger: typeof _Slugger;
    var Hooks: typeof _Hooks;
    var parse: typeof marked;
}
declare const options: (options: MarkedOptions) => typeof marked;
declare const setOptions: (options: MarkedOptions) => typeof marked;
declare const use: (...args: MarkedExtension[]) => typeof marked;
declare const walkTokens: <T = void>(tokens: Token[] | TokensList, callback: (token: Token) => T | T[]) => T[];
declare const parseInline: (src: string, optOrCallback?: MarkedOptions | ResultCallback$1 | null | undefined, callback?: ResultCallback$1 | undefined) => string | Promise<string | undefined> | undefined;
declare const parse: typeof marked;
declare const parser: typeof _Parser.parse;
declare const lexer: typeof _Lexer.lex;

export { _Hooks as Hooks, _Lexer as Lexer, Links, Marked, MarkedExtension, MarkedOptions, _Parser as Parser, _Renderer as Renderer, RendererExtension, RendererThis, ResultCallback, Rule, Rules, _Slugger as Slugger, SluggerOptions, _TextRenderer as TextRenderer, Token, _Tokenizer as Tokenizer, TokenizerAndRendererExtension, TokenizerExtension, TokenizerThis, Tokens, TokensList, block, _defaults as defaults, _getDefaults as getDefaults, inline, lexer, marked, options, parse, parseInline, parser, setOptions, use, walkTokens };
