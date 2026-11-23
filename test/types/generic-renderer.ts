/* eslint-disable */
import {
  Hooks,
  Lexer,
  Marked,
  Parser,
  Renderer,
  marked,
  parseInline,
  type HooksObject,
  type MarkedOptions,
  type RendererExtension,
  type RendererObject,
  type Token,
  type TokenizerAndRendererExtension,
  type TokenizerExtension,
  type Tokens,
  type TokensList,
} from 'marked';

interface AstNode {
  kind: string;
  text?: string;
  children?: AstNode[];
}

class AstRenderer extends Renderer<AstNode[], AstNode> {
  heading({ tokens, depth }: Tokens.Heading): AstNode {
    const children: AstNode[] = this.parser.parseInline(tokens);
    return { kind: `h${depth}`, children };
  }

  paragraph({ tokens }: Tokens.Paragraph): AstNode {
    const children: AstNode[] = this.parser.parseInline(tokens);
    return { kind: 'p', children };
  }

  tablerow({ text }: Tokens.TableRow<AstNode[]>): AstNode {
    return { kind: 'tr', children: text };
  }

  text(token: Tokens.Text | Tokens.Escape): AstNode {
    if ('tokens' in token && token.tokens) {
      return { kind: 'span', children: this.parser.parseInline(token.tokens) };
    }
    return { kind: 'text', text: token.text };
  }
}

class AstParser extends Parser<AstNode[], AstNode> {
  override parse(tokens: Token[]): AstNode[] {
    return tokens.map((token) => {
      if (token.type === 'heading') {
        return this.renderer.heading(token as Tokens.Heading);
      }
      if (token.type === 'paragraph') {
        return this.renderer.paragraph(token as Tokens.Paragraph);
      }
      return this.renderer.text(token as Tokens.Text);
    });
  }

  override parseInline(tokens: Token[]): AstNode[] {
    return tokens.map(token => this.renderer.text(token as Tokens.Text));
  }
}

class AstHooks extends Hooks<AstNode[], AstNode> {
  override provideLexer(block = this.block) {
    return (src: string, options?: MarkedOptions<AstNode[], AstNode>): Token[] | TokensList => {
      return block ? Lexer.lex(src, options) : Lexer.lexInline(src, options);
    };
  }

  override provideParser(block = this.block) {
    return (tokens: Token[], options?: MarkedOptions<AstNode[], AstNode>): AstNode[] => {
      const parser = new AstParser(options);
      return block ? parser.parse(tokens) : parser.parseInline(tokens);
    };
  }
}

// 1. Custom TokenizerExtension & TokenizerAndRendererExtension preserve ParserOutput / RendererOutput
const customTokenizerExt: TokenizerExtension<AstNode[], AstNode> = {
  name: 'badge',
  level: 'inline',
  start(src) {
    const renderer: Renderer<AstNode[], AstNode> | null | undefined = this.lexer.options.renderer;
    void renderer;
    return src.indexOf('[[');
  },
  tokenizer(src) {
    const node: AstNode = this.lexer.options.renderer!.text({
      type: 'text', raw: src, text: src,
    });
    // @ts-expect-error Custom renderer returns AstNode, not string.
    const html: string = this.lexer.options.renderer!.text({
      type: 'text', raw: src, text: src,
    });
    void [node, html];
    return undefined;
  },
};

const customCombinedExt: TokenizerAndRendererExtension<AstNode[], AstNode> = {
  name: 'callout',
  level: 'block',
  tokenizer(src) {
    const parsed: AstNode[] = this.lexer.options.hooks!.postprocess([]);
    void parsed;
    return undefined;
  },
  renderer(token) {
    const children: AstNode[] = this.parser.parseInline(token.tokens ?? []);
    return { kind: 'callout', children };
  },
};

const customRendererExt: RendererExtension<AstNode[], AstNode> = {
  name: 'custom-inline',
  renderer() {
    return { kind: 'custom-inline' };
  },
};

// 2. Explicit Marked<AstNode[], AstNode> with Hooks.provideLexer, extensions, and instance.Lexer
const astMarked = new Marked<AstNode[], AstNode>({
  extensions: [customTokenizerExt, customCombinedExt, customRendererExt],
  renderer: {
    heading({ tokens, depth }) {
      const children: AstNode[] = this.parser.parseInline(tokens);
      return { kind: `h${depth}`, children };
    },
    text(token) {
      return { kind: 'text', text: token.text };
    },
  },
  hooks: {
    provideLexer() {
      return (src: string, options?: MarkedOptions<AstNode[], AstNode>) => {
        const renderer: Renderer<AstNode[], AstNode> | null | undefined = options?.renderer;
        void renderer;
        return Lexer.lex(src, options);
      };
    },
    provideParser() {
      return (tokens, options) => {
        const parser = new AstParser(options);
        return this.block ? parser.parse(tokens) : parser.parseInline(tokens);
      };
    },
    postprocess(nodes) {
      return nodes;
    },
  },
});

const astLexer = new astMarked.Lexer(astMarked.defaults);
const astLexerNoArgs = new astMarked.Lexer();
const lexerRendererNode: AstNode = astLexer.options.renderer!.hr({ type: 'hr', raw: '---' });
const lexerNoArgsRendererNode: AstNode = astLexerNoArgs.options.renderer!.hr({ type: 'hr', raw: '---' });
// @ts-expect-error astMarked.Lexer preserves AstNode renderer output, not string.
const lexerRendererString: string = astLexerNoArgs.options.renderer!.hr({ type: 'hr', raw: '---' });
void [lexerRendererNode, lexerNoArgsRendererNode, lexerRendererString];

// 3. RendererObject & HooksObject direct typing and constructor inference
const astRendererObj: RendererObject<AstNode[], AstNode> = {
  heading({ tokens, depth }) {
    return { kind: `h${depth}`, children: this.parser.parseInline(tokens) };
  },
  hr() {
    return false;
  },
};

const astHooksObj: HooksObject<AstNode[], AstNode> = {
  provideLexer() {
    return (src, options) => Lexer.lex(src, options);
  },
  provideParser() {
    return (tokens, options) => new AstParser(options).parse(tokens);
  },
};

const inferredFromClass = new Marked({
  renderer: new AstRenderer(),
});
const inferredClassRendererNode: AstNode = inferredFromClass.defaults.renderer!.hr({ type: 'hr', raw: '---' });
const inferredClassOutput: AstNode[] = inferredFromClass.parse('# hi', { async: false });
void [inferredClassRendererNode, inferredClassOutput];

const inferredFromRendererObj = new Marked({
  renderer: astRendererObj,
});
const inferredObjNode: AstNode = inferredFromRendererObj.defaults.renderer!.hr({ type: 'hr', raw: '---' });
const inferredObjOutput: AstNode[] = inferredFromRendererObj.parse('# hi', { async: false });
void [inferredObjNode, inferredObjOutput];

const inferredFromExtensions = new Marked({
  extensions: [customTokenizerExt, customCombinedExt],
});
const inferredExtOutput: AstNode[] = inferredFromExtensions.parse('# hi', { async: false });
void inferredExtOutput;

const inferredFromHooksObj = new Marked({
  hooks: astHooksObj,
});
const inferredHooksOutput: AstNode[] = inferredFromHooksObj.parse('# hi', { async: false });
void inferredHooksOutput;

const inferredNumeric = new Marked({
  renderer: {
    heading() {
      return 123;
    },
  },
});
const numericHeading: number = inferredNumeric.defaults.renderer!.heading({
  type: 'heading', raw: '# hi', depth: 1, text: 'hi', tokens: [],
});
// @ts-expect-error Inferred numeric renderer returns number, not string.
const wrongNumericHeading: string = numericHeading;
void wrongNumericHeading;

// Fallback-only renderer still defaults to string
const fallbackOnly = new Marked({
  renderer: {
    heading() {
      return false;
    },
  },
});
const fallbackHtml: string = fallbackOnly.parse('# hi', { async: false });
void fallbackHtml;

// 4. Top-level marked(), marked.parse(), marked.parseInline(), parseInline(), Parser.parse() with custom options
const astOptions: MarkedOptions<AstNode[], AstNode> = {
  renderer: new AstRenderer(),
  hooks: new AstHooks(),
};

const topSync: AstNode[] = marked('# hello', { ...astOptions, async: false });
const topAsync: Promise<AstNode[]> = marked('# hello', { ...astOptions, async: true });
const topParseSync: AstNode[] = marked.parse('# hello', { ...astOptions, async: false });
const topInlineSync: AstNode[] = marked.parseInline('hello', { ...astOptions, async: false });
const topInlineAsync: Promise<AstNode[]> = parseInline('hello', { ...astOptions, async: true });
const staticParserTokens = Lexer.lex('# hello', astOptions);
const staticParserOutput: AstNode[] = Parser.parse(staticParserTokens, astOptions);
const staticParserInlineOutput: AstNode[] = Parser.parseInline(staticParserTokens, astOptions);

// @ts-expect-error Custom options return AstNode[], not string.
const wrongTopSync: string = marked('# hello', { ...astOptions, async: false });
// @ts-expect-error Custom inline options return AstNode[], not string.
const wrongInlineSync: string = parseInline('hello', { ...astOptions, async: false });
// @ts-expect-error Default Parser.parse returns string, not AstNode[].
const wrongStaticParser: AstNode[] = Parser.parse(staticParserTokens);
// @ts-expect-error Default Parser.parseInline returns string, not AstNode[].
const wrongStaticParserInline: AstNode[] = Parser.parseInline(staticParserTokens);
void [
  topSync,
  topAsync,
  topParseSync,
  topInlineSync,
  topInlineAsync,
  staticParserOutput,
  staticParserInlineOutput,
  wrongTopSync,
  wrongInlineSync,
  wrongStaticParser,
  wrongStaticParserInline,
];

// 5. Default string behavior remains strictly enforced
const defaultMarked = new Marked();
defaultMarked.use({
  renderer: {
    // @ts-expect-error Default Marked renderer must return string or false.
    heading({ text }) {
      return { kind: 'h1', text };
    },
    // @ts-expect-error Default Marked renderer rejects async methods.
    async paragraph() {
      return '<p>async</p>';
    },
  },
});

const defaultSync: string = marked('# hello', { async: false });
const defaultInlineSync: string = parseInline('hello', { async: false });
// @ts-expect-error Default marked returns string, not AstNode[].
const wrongDefault: AstNode[] = marked('# hello', { async: false });
void [astRendererObj, astHooksObj, defaultSync, defaultInlineSync, wrongDefault];
