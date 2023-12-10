/* eslint-disable */
import { marked } from 'marked';

// other exports

import { Lexer, Parser, Tokenizer, Renderer, TextRenderer } from 'marked';
import type { Tokens, MarkedExtension, TokenizerAndRendererExtension, Token ,TokenizerExtension, MarkedOptions, TokensList, RendererExtension } from 'marked';

const tokenizer = new marked.Tokenizer();

tokenizer.emStrong = function emStrong(src, _maskedSrc, _prevChar) {
  const token: Tokens.Strong = {
    type: 'strong',
    text: src,
    raw: src,
    tokens: []
  };

  this.lexer.inline(token.text, token.tokens);

  return token;
};

tokenizer.inlineText = function inlineText(...args: Parameters<Tokenizer['inlineText']>) {
  const p = this.inlineText(...args);

  if (p) p.raw = p.text;

  return p;
};

let options: MarkedOptions = {
  gfm: true,
  breaks: false,
  pedantic: false,
  silent: false,
  tokenizer,
  renderer: new marked.Renderer(),
  walkTokens: token => {
    if (token.type === 'heading') {
      token.depth += 1;
    }
  }
};

options = marked.getDefaults();
options = marked.defaults;

function callback(err: Error | null, markdown: string | undefined) {
  console.log('Callback called!');
  console.log(markdown);
}

let myOldMarked: typeof marked = marked.options(options);
myOldMarked = marked.setOptions(options);

console.log(marked('1) I am using __markdown__.'));
console.log(marked('2) I am using __markdown__.', options));

console.log(marked.parse('5) I am using __markdown__.'));
console.log(marked.parse('6) I am using __markdown__.', options));

console.log(marked.parseInline('9) I am using __markdown__.'));
console.log(marked.parseInline('10) I am using __markdown__.', options));

const text = 'Something';
const tokens: TokensList = marked.lexer(text, options);
console.log(marked.parser(tokens));

const lexer = new marked.Lexer(options);
const tokens2 = lexer.lex(text);
console.log(tokens2);
const tokens3 = lexer.inlineTokens(text, tokens);
console.log(tokens3);
// verifying that the second param to inlineTokens can be ignored
const tokens3a = lexer.inlineTokens(text);
console.log(tokens3a);
const re: Record<string, Record<string, Record<string, RegExp>>> = marked.Lexer.rules;
const lexerOptions: MarkedOptions = lexer.options;

const renderer = new marked.Renderer();
renderer.heading = (text, level, raw) => {
  return text + level.toString();
};
renderer.hr = () => {
  return `<hr>\n`;
};
renderer.checkbox = checked => {
  return checked ? 'CHECKED' : 'UNCHECKED';
};

class ExtendedRenderer extends marked.Renderer {
  code = (code: string, language: string | undefined, isEscaped: boolean): string => super.code(code, language, isEscaped);
  blockquote = (quote: string): string => super.blockquote(quote);
  html = (html: string): string => super.html(html);
  heading = (text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string): string => super.heading(text, level, raw);
  hr = (): string => super.hr();
  list = (body: string, ordered: boolean, start: number): string => super.list(body, ordered, start);
  listitem = (text: string, task: boolean, checked: boolean): string => super.listitem(text, task, checked);
  checkbox = (checked: boolean): string => super.checkbox(checked);
  paragraph = (text: string): string => super.paragraph(text);
  table = (header: string, body: string): string => super.table(header, body);
  tablerow = (content: string): string => super.tablerow(content);
  tablecell = (content: string, flags: { header: boolean; align: 'center' | 'left' | 'right' | null }): string => super.tablecell(content, flags);
  strong = (text: string): string => super.strong(text);
  em = (text: string): string => super.em(text);
  codespan = (code: string): string => super.codespan(code);
  br = (): string => super.br();
  del = (text: string): string => super.del(text);
  link = (href: string, title: string, text: string): string => super.link(href, title, text);
  image = (href: string, title: string, text: string): string => super.image(href, title, text);
}

const rendererOptions: MarkedOptions = renderer.options;

const textRenderer = new marked.TextRenderer();
console.log(textRenderer.strong(text));

const parseTestText = '- list1\n  - list1.1\n\n listend';
const parseTestTokens: TokensList = marked.lexer(parseTestText, options);

const inlineTestText = '- list1\n  - list1.1\n\n listend';
const inlineTestTokens: Token[] = marked.Lexer.lexInline(inlineTestText, options);

/* List type is `list`. */
const listToken = parseTestTokens[0] as Tokens.List;
console.log(listToken.type === 'list');

const parser = new marked.Parser();
console.log(parser.parse(parseTestTokens));
console.log(marked.Parser.parse(parseTestTokens));
const parserOptions: MarkedOptions = parser.options;

marked.use({ renderer }, { tokenizer });

marked.use({
  renderer: {
    heading(text, level) {
      if (level > 3) {
        return `<p>${text}</p>`;
      }

      return false;
    },
    listitem(text, task, checked) {
      if (task) return `<li class="task-list-item ${checked ? 'checked' : ''}">${text}</li>\n`;
      else return `<li>${text}</li>\n`;
    }
  },
  tokenizer: {
    codespan(src) {
      const match = src.match(/\$+([^\$\n]+?)\$+/);
      if (match) {
        return {
          type: 'codespan',
          raw: match[0],
          text: match[1].trim()
        };
      }

      // return false to use original codespan tokenizer
      return false;
    }
  }
});

interface NameToken extends Tokens.Generic {
    type: 'name';
    raw: string;
    text: string;
    tokens: Token[];
    items: Token[];
}

const tokenizerExtension: TokenizerExtension = {
  name: 'name',
  level: 'block',
  start: (src: string) => src.match(/name/)?.index,
  tokenizer(src: string): NameToken | undefined {
    if (src === 'name') {
      const token: NameToken = {
        type: 'name',
        raw: src,
        text: src,
        tokens: this.lexer.inline(src),
        items: []
      };
      this.lexer.inline(token.text, token.items);
      return token;
    }
  },
  childTokens: ['items']
};

const rendererExtension: RendererExtension = {
  name: 'name',
  renderer(t) {
    const token = t as NameToken;
    if (token.text === 'name') {
      // verifying that the second param to parseInline can be ignored
      console.log(this.parser.parseInline(token.items));
      return this.parser.parse(token.items);
    }
    return false;
  }
};

const tokenizerAndRendererExtension: TokenizerAndRendererExtension = {
  name: 'name',
  level: 'block',
  tokenizer(src: string) {
    if (src === 'name') {
      const token = {
        type: 'name',
        raw: src
      };
      return token;
    }
  },
  renderer(token: Tokens.Generic) {
    if (token.raw === 'name') {
      return 'name';
    }

    return false;
  }
};

marked.use({
  extensions: [tokenizerExtension, rendererExtension, tokenizerAndRendererExtension]
});

const asyncExtension: MarkedExtension = {
  async: true,
  async walkTokens(token) {
    if (token.type === 'code') {
      await Promise.resolve(3);
      token.text += 'foobar';
    }
  }
};

marked.use(asyncExtension);

(async() => {
const md = '# foobar';
const asyncMarked: string = await marked(md, { async: true });
const promiseMarked: Promise<string> = marked(md, { async: true });
// @ts-expect-error marked can still be async if an extension sets `async: true`
const notAsyncMarked: string = marked(md, { async: false });
// @ts-expect-error marked can still be async if an extension sets `async: true`
const defaultMarked: string = marked(md);
// as string can be used if no extensions set `async: true`
const stringMarked: string = marked(md) as string;

const asyncMarkedParse: string = await marked.parse(md, { async: true });
const promiseMarkedParse: Promise<string> = marked.parse(md, { async: true });
// @ts-expect-error marked can still be async if an extension sets `async: true`
const notAsyncMarkedParse: string = marked.parse(md, { async: false });
// @ts-expect-error marked can still be async if an extension sets `async: true`
const defaultMarkedParse: string = marked.parse(md);
// as string can be used if no extensions set `async: true`
const stringMarkedParse: string = marked.parse(md) as string;
})();

// Tests for List and ListItem
// Dumped from markdown list parsed data

const listAndListItemText: Tokens.List = {
  type: 'list',
  raw: '1. Text ...',
  ordered: true,
  start: 1,
  loose: false,
  items: [
    {
      type: 'list_item',
      raw: '1. Text ...',
      task: false,
      loose: false,
      text: 'Text',
      tokens: [
        {
          type: 'text',
          raw: 'Point one',
          text: 'Point one',
          tokens: [
            {
              type: 'text',
              raw: 'Point one',
              text: 'Point one'
            }
          ]
        },
        {
          type: 'list',
          raw: '',
          ordered: false,
          start: '',
          loose: false,
          items: []
        }
      ]
    }
  ]
};

const lexer2 = new Lexer();
const tokens4 = lexer2.lex('# test');
const parser2 = new Parser();
console.log(parser2.parse(tokens4));

marked.use({ renderer: new Renderer() });
marked.use({ renderer: new TextRenderer() });
marked.use({ tokenizer: new Tokenizer() });
marked.use({
  hooks: {
    preprocess(markdown) {
      return markdown;
    },
    postprocess(html) {
      return html;
    }
  }
});
marked.use({
  hooks: {
    processAllTokens(tokens) {
      return tokens;
    }
  }
});
marked.use({
  async: true,
  hooks: {
    async preprocess(markdown) {
      return markdown;
    },
    async postprocess(html) {
      return html;
    },
    async processAllTokens(tokens) {
      return tokens;
    }
  }
});
