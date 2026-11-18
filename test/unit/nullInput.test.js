import { Marked, Lexer, Parser, Tokenizer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('literal null input characters', () => {
  it('normalizes both block and inline lexer entry points', () => {
    for (const options of [{ gfm: false }, { gfm: true }, { pedantic: true }]) {
      assert.equal(Parser.parse(Lexer.lex('a\0b', options), options), '<p>a\ufffdb</p>\n');
      assert.equal(Parser.parseInline(Lexer.lexInline('a\0b', options), options), 'a\ufffdb');
      assert.equal(Parser.parseInline(new Lexer(options).inlineTokens('a\0b'), options), 'a\ufffdb');
    }
  });

  it('normalizes preprocessed source before default lexing without changing hook input', () => {
    const marked = new Marked({
      hooks: {
        preprocess(src) {
          assert.equal(src, 'a\0b');
          return `${src}\0c`;
        },
      },
    });
    assert.equal(marked.parse('a\0b'), '<p>a\ufffdb\ufffdc</p>\n');
    assert.equal(marked.parseInline('a\0b'), 'a\ufffdb\ufffdc');
  });

  it('also normalizes an asynchronous preprocess result', async() => {
    const marked = new Marked({
      async: true,
      hooks: {
        async preprocess(src) {
          return `${src}\0c`;
        },
      },
    });
    assert.equal(await marked.parse('a\0b'), '<p>a\ufffdb\ufffdc</p>\n');
    assert.equal(await marked.parseInline('a\0b'), 'a\ufffdb\ufffdc');
  });

  it('keeps custom lexer ownership of its source', () => {
    const marked = new Marked({
      hooks: {
        provideLexer() {
          return src => {
            assert.equal(src, 'a\0b');
            return [{ type: 'text', raw: src, text: 'custom' }];
          };
        },
      },
    });
    assert.equal(marked.parseInline('a\0b'), 'custom');
  });
});

describe('null replacement preserves token source', () => {
  it('keeps literal nulls distinct from replacement characters in raw', () => {
    for (const options of [{ gfm: false }, { gfm: true }, { pedantic: true }]) {
      const src = 'a\0\ufffdb';
      const [block] = Lexer.lex(src, options);
      assert.equal(block.raw, src);
      assert.equal(block.text, 'a\ufffd\ufffdb');
      assert.equal(block.tokens[0].raw, src);
      assert.equal(block.tokens[0].text, 'a\ufffd\ufffdb');
      assert.equal(Lexer.lexInline(src, options)[0].raw, src);
    }
  });

  it('keeps nested container and inline raw source before normalizing text', () => {
    const src = '> - **a\0\ufffdb**\n';
    const [quote] = Lexer.lex(src);
    assert.equal(quote.raw, src);
    const list = quote.tokens[0];
    assert.equal(list.raw, '- **a\0\ufffdb**');
    assert.equal(list.items[0].raw, '- **a\0\ufffdb**');
    const text = list.items[0].tokens[0];
    assert.equal(text.raw, '**a\0\ufffdb**');
    assert.equal(text.tokens[0].raw, '**a\0\ufffdb**');
    assert.equal(text.tokens[0].tokens[0].raw, 'a\0\ufffdb');
    assert.equal(text.tokens[0].tokens[0].text, 'a\ufffd\ufffdb');
  });

  it('keeps code, HTML, and link raw while replacing semantic fields', () => {
    for (const src of ['`a\0b`', '    a\0b', '```a\0b\na\0b\n```', '<i title="\0">a</i>', '[a](/u\0 "t\0")']) {
      const [token] = Lexer.lex(src);
      assert.equal(token.raw, src);
      assert.ok(token.text === undefined || !token.text.includes('\0'));
    }
    const [link] = Lexer.lexInline('[a](/u\0 "t\0")');
    assert.equal(link.raw, '[a](/u\0 "t\0")');
    assert.equal(link.href, '/u\ufffd');
    assert.equal(link.title, 't\ufffd');
  });
});

describe('null replacement compatibility boundaries', () => {
  it('preserves normalization for arbitrary extension fields and declared child tokens', () => {
    const scalar = new Marked({
      extensions: [{
        name: 'custom',
        level: 'inline',
        tokenizer(src) {
          if (src[0] === '@') return { type: 'custom', raw: src, payload: src.slice(1) };
        },
        renderer(token) { return token.payload; },
      }],
    });
    const children = new Marked({
      extensions: [{
        name: 'custom',
        level: 'inline',
        tokenizer(src) {
          if (src[0] === '@') return { type: 'custom', raw: src, dt: this.lexer.inlineTokens(src.slice(1)) };
        },
        renderer(token) { return this.parser.parseInline(token.dt); },
        childTokens: ['dt'],
      }],
    });
    assert.equal(scalar.parseInline('@a\0'), 'a\ufffd');
    assert.equal(children.parseInline('@a\0'), 'a\ufffd');
  });

  it('does not rewrite caller-owned tokens when appending an inline run', () => {
    const existing = Object.freeze({ type: 'codespan', raw: '`prior\0`', text: 'prior\0' });
    const tokens = [existing];
    new Lexer().inlineTokens('new\0', tokens);
    assert.equal(tokens[0], existing);
    assert.equal(existing.text, 'prior\0');
    assert.equal(tokens[1].text, 'new\ufffd');
  });

  it('retains raw when one default options object is reused', () => {
    const options = { gfm: true };
    assert.equal(Lexer.lex('first\0', options)[0].raw, 'first\0');
    assert.equal(Lexer.lex('second\0', options)[0].raw, 'second\0');
  });

  it('preserves source normalization for a custom tokenizer override', () => {
    let observed;
    const marked = new Marked({
      tokenizer: {
        codespan(src) {
          observed = src;
          return false;
        },
      },
    });
    assert.equal(marked.parseInline('a\0'), 'a\ufffd');
    assert.equal(observed, 'a\ufffd');
  });
});

describe('custom tokenizer detection', () => {
  it('recognizes overrides added after default options reuse', () => {
    const options = {};
    Lexer.lex('first', options);
    let observed;
    options.tokenizer.codespan = function(src) {
      observed = src;
      return undefined;
    };
    Lexer.lexInline('second\0', options);
    assert.equal(observed, 'second\ufffd');
  });

  it('recognizes non-enumerable tokenizer overrides', () => {
    const tokenizer = new Tokenizer();
    let observed;
    Object.defineProperty(tokenizer, 'codespan', {
      value(src) {
        observed = src;
      },
    });
    Lexer.lexInline('a\0', { tokenizer });
    assert.equal(observed, 'a\ufffd');
  });

  it('recognizes subclass tokenizers', () => {
    let observed;
    class CustomTokenizer extends Tokenizer {
      codespan(src) {
        observed = src;
        return super.codespan(src);
      }
    }
    Lexer.lexInline('a\0', { tokenizer: new CustomTokenizer() });
    assert.equal(observed, 'a\ufffd');
  });
});

describe('reused block lexer ownership', () => {
  it('does not normalize frozen tokens returned by an earlier lex call', () => {
    const lexer = new Lexer();
    const first = lexer.lex('```\nprior\n```\n');
    const previous = first[0];
    Object.freeze(previous);
    lexer.lex('new\0');
    assert.equal(first[0], previous);
    assert.equal(previous.text, 'prior');
    assert.equal(first.at(-1).text, 'new\ufffd');
  });

  it('does not rewrite frozen prior definitions while normalizing new links', () => {
    const lexer = new Lexer();
    lexer.lex('[old]: /prior "old title"\n\n');
    const previous = lexer.tokens.links.old;
    Object.freeze(previous);
    lexer.lex('[new]: /new\0 "new\0"\n\n[new]');
    assert.equal(lexer.tokens.links.old, previous);
    assert.equal(previous.href, '/prior');
    assert.equal(lexer.tokens.links.new.href, '/new\ufffd');
    assert.equal(lexer.tokens.links.new.title, 'new\ufffd');
  });
});
