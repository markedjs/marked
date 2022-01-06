import { marked, Renderer, Slugger, lexer, parseInline, use, getDefaults, walkTokens as _walkTokens } from '../../src/marked.js';

describe('Test heading ID functionality', () => {
  it('should add id attribute by default', () => {
    const renderer = new Renderer();
    const slugger = new Slugger();
    const header = renderer.heading('test', 1, 'test', slugger);
    expect(header).toBe('<h1 id="test">test</h1>\n');
  });

  it('should NOT add id attribute when options set false', () => {
    const renderer = new Renderer({ headerIds: false });
    const header = renderer.heading('test', 1, 'test');
    expect(header).toBe('<h1>test</h1>\n');
  });
});

describe('Test slugger functionality', () => {
  it('should use lowercase slug', () => {
    const slugger = new Slugger();
    expect(slugger.slug('Test')).toBe('test');
  });

  it('should be unique to avoid collisions 1280', () => {
    const slugger = new Slugger();
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with number', () => {
    const slugger = new Slugger();
    expect(slugger.slug('test 1')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with hyphen number', () => {
    const slugger = new Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo 1')).toBe('foo-1-1');
    expect(slugger.slug('foo-1')).toBe('foo-1-2');
    expect(slugger.slug('foo')).toBe('foo-2');
  });

  it('should allow non-latin chars', () => {
    const slugger = new Slugger();
    expect(slugger.slug('привет')).toBe('привет');
  });

  it('should remove ampersands 857', () => {
    const slugger = new Slugger();
    expect(slugger.slug('This & That Section')).toBe('this--that-section');
  });

  it('should remove periods', () => {
    const slugger = new Slugger();
    expect(slugger.slug('file.txt')).toBe('filetxt');
  });

  it('should remove html tags', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<em>html</em>')).toBe('html');
  });

  it('should not increment seen when using dryrun option', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
  });

  it('should still return the next unique id when using dryrun', () => {
    const slugger = new Slugger();
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section-1');
  });

  it('should be repeatable in a sequence', () => {
    const slugger = new Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo')).toBe('foo-2');
    expect(slugger.slug('foo', { dryrun: true })).toBe('foo-3');
    expect(slugger.slug('foo', { dryrun: true })).toBe('foo-3');
    expect(slugger.slug('foo')).toBe('foo-3');
    expect(slugger.slug('foo')).toBe('foo-4');
  });
});

describe('Test paragraph token type', () => {
  it('should use the "paragraph" type on top level', () => {
    const md = 'A Paragraph.\n\n> A blockquote\n\n- list item\n';

    const tokens = lexer(md);

    expect(tokens[0].type).toBe('paragraph');
    expect(tokens[2].tokens[0].type).toBe('paragraph');
    expect(tokens[3].items[0].tokens[0].type).toBe('text');
  });
});

describe('changeDefaults', () => {
  it('should change global defaults', async() => {
    const { defaults, changeDefaults } = await import('../../src/defaults.js');
    expect(defaults.test).toBeUndefined();
    changeDefaults({ test: true });
    expect((await import('../../src/defaults.js')).defaults.test).toBe(true);
  });
});

describe('inlineLexer', () => {
  it('should send html to renderer.html', () => {
    const renderer = new Renderer();
    spyOn(renderer, 'html').and.callThrough();
    const md = 'HTML Image: <img alt="MY IMAGE" src="example.png" />';
    marked(md, { renderer });

    expect(renderer.html).toHaveBeenCalledWith('<img alt="MY IMAGE" src="example.png" />');
  });
});

describe('parseInline', () => {
  it('should parse inline tokens', () => {
    const md = '**strong** _em_';
    const html = parseInline(md);

    expect(html).toBe('<strong>strong</strong> <em>em</em>');
  });

  it('should not parse block tokens', () => {
    const md = '# header\n\n_em_';
    const html = parseInline(md);

    expect(html).toBe('# header\n\n<em>em</em>');
  });
});

describe('use extension', () => {
  it('should use custom block tokenizer + renderer extensions', () => {
    const underline = {
      name: 'underline',
      level: 'block',
      tokenizer(src) {
        const rule = /^:([^\n]*)(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'underline',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
          };
        }
      },
      renderer(token) {
        return `<u>${token.text}</u>\n`;
      }
    };
    use({ extensions: [underline] });
    let html = marked('Not Underlined\n:Underlined\nNot Underlined');
    expect(html).toBe('<p>Not Underlined\n:Underlined\nNot Underlined</p>\n');

    html = marked('Not Underlined\n\n:Underlined\n\nNot Underlined');
    expect(html).toBe('<p>Not Underlined</p>\n<u>Underlined</u>\n<p>Not Underlined</p>\n');
  });

  it('should interrupt paragraphs if using "start" property', () => {
    const underline = {
      extensions: [{
        name: 'underline',
        level: 'block',
        start(src) { return src.indexOf(':'); },
        tokenizer(src) {
          const rule = /^:([^\n]*):(?:\n|$)/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'underline',
              raw: match[0], // This is the text that you want your token to consume from the source
              text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
            };
          }
        },
        renderer(token) {
          return `<u>${token.text}</u>\n`;
        }
      }]
    };
    use(underline);
    const html = marked('Not Underlined A\n:Underlined B:\nNot Underlined C\n:Not Underlined D');
    expect(html).toBe('<p>Not Underlined A</p>\n<u>Underlined B</u>\n<p>Not Underlined C\n:Not Underlined D</p>\n');
  });

  it('should use custom inline tokenizer + renderer extensions', () => {
    const underline = {
      name: 'underline',
      level: 'inline',
      start(src) { return src.indexOf('='); },
      tokenizer(src) {
        const rule = /^=([^=]+)=/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'underline',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
          };
        }
      },
      renderer(token) {
        return `<u>${token.text}</u>`;
      }
    };
    use({ extensions: [underline] });
    const html = marked('Not Underlined =Underlined= Not Underlined');
    expect(html).toBe('<p>Not Underlined <u>Underlined</u> Not Underlined</p>\n');
  });

  it('should handle interacting block and inline extensions', () => {
    const descriptionlist = {
      name: 'descriptionList',
      level: 'block',
      start(src) {
        const match = src.match(/:[^:\n]/);
        if (match) {
          return match.index;
        }
      },
      tokenizer(src, tokens) {
        const rule = /^(?::[^:\n]+:[^:\n]*(?:\n|$))+/;
        const match = rule.exec(src);
        if (match) {
          const token = {
            type: 'descriptionList',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[0].trim(), // You can add additional properties to your tokens to pass along to the renderer
            tokens: []
          };
          this.lexer.inlineTokens(token.text, token.tokens);
          return token;
        }
      },
      renderer(token) {
        return `<dl>${this.parser.parseInline(token.tokens)}\n</dl>`;
      }
    };

    const description = {
      name: 'description',
      level: 'inline',
      start(src) { return src.indexOf(':'); },
      tokenizer(src, tokens) {
        const rule = /^:([^:\n]+):([^:\n]*)(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          const token = {
            type: 'description',
            raw: match[0],
            dt: [],
            dd: []
          };
          this.lexer.inline(match[1].trim(), token.dt);
          this.lexer.inline(match[2].trim(), token.dd);
          return token;
        }
      },
      renderer(token) {
        return `\n<dt>${this.parser.parseInline(token.dt)}</dt><dd>${this.parser.parseInline(token.dd)}</dd>`;
      }
    };
    use({ extensions: [descriptionlist, description] });
    const html = marked('A Description List with One Description:\n'
                        + ':   Topic 1   :  Description 1\n'
                        + ': **Topic 2** : *Description 2*');
    expect(html).toBe('<p>A Description List with One Description:</p>\n'
                      + '<dl>'
                      + '\n<dt>Topic 1</dt><dd>Description 1</dd>'
                      + '\n<dt><strong>Topic 2</strong></dt><dd><em>Description 2</em></dd>'
                      + '\n</dl>');
  });

  it('should allow other options mixed into the extension', () => {
    const extension = {
      name: 'underline',
      level: 'block',
      start(src) { return src.indexOf(':'); },
      tokenizer(src) {
        const rule = /^:([^\n]*):(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'underline',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
          };
        }
      },
      renderer(token) {
        return `<u>${token.text}</u>\n`;
      }
    };
    use({ sanitize: true, silent: true, extensions: [extension] });
    const html = marked(':test:\ntest\n<div></div>');
    expect(html).toBe('<u>test</u>\n<p>test</p>\n<p>&lt;div&gt;&lt;/div&gt;</p>\n');
  });

  it('should handle renderers that return false', () => {
    const extension = {
      name: 'test',
      level: 'block',
      tokenizer(src) {
        const rule = /^:([^\n]*):(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'test',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
          };
        }
      },
      renderer(token) {
        if (token.text === 'test') {
          return 'test';
        }
        return false;
      }
    };
    const fallbackRenderer = {
      name: 'test',
      level: 'block',
      renderer(token) {
        if (token.text === 'Test') {
          return 'fallback';
        }
        return false;
      }
    };
    use({ extensions: [fallbackRenderer, extension] });
    const html = marked(':Test:\n\n:test:\n\n:none:');
    expect(html).toBe('fallbacktest');
  });

  it('should fall back when tokenizers return false', () => {
    const extension = {
      name: 'test',
      level: 'block',
      tokenizer(src) {
        const rule = /^:([^\n]*):(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'test',
            raw: match[0], // This is the text that you want your token to consume from the source
            text: match[1].trim() // You can add additional properties to your tokens to pass along to the renderer
          };
        }
        return false;
      },
      renderer(token) {
        return token.text;
      }
    };
    const extension2 = {
      name: 'test',
      level: 'block',
      tokenizer(src) {
        const rule = /^:([^\n]*):(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          if (match[1].match(/^[A-Z]/)) {
            return {
              type: 'test',
              raw: match[0],
              text: match[1].trim().toUpperCase()
            };
          }
        }
        return false;
      }
    };
    use({ extensions: [extension, extension2] });
    const html = marked(':Test:\n\n:test:');
    expect(html).toBe('TESTtest');
  });

  it('should override original tokenizer/renderer with same name, but fall back if returns false', () => {
    const extension = {
      extensions: [{
        name: 'heading',
        level: 'block',
        tokenizer(src) {
          return false; // fall back to default `heading` tokenizer
        },
        renderer(token) {
          return '<h' + token.depth + '>' + token.text + ' RENDERER EXTENSION</h' + token.depth + '>\n';
        }
      },
      {
        name: 'code',
        level: 'block',
        tokenizer(src) {
          const rule = /^:([^\n]*):(?:\n|$)/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'code',
              raw: match[0],
              text: match[1].trim() + ' TOKENIZER EXTENSION'
            };
          }
        },
        renderer(token) {
          return false; // fall back to default `code` renderer
        }
      }]
    };
    use(extension);
    const html = marked('# extension1\n:extension2:');
    expect(html).toBe('<h1>extension1 RENDERER EXTENSION</h1>\n<pre><code>extension2 TOKENIZER EXTENSION\n</code></pre>\n');
  });

  it('should walk only specified child tokens', () => {
    const walkableDescription = {
      extensions: [{
        name: 'walkableDescription',
        level: 'inline',
        start(src) { return src.indexOf(':'); },
        tokenizer(src, tokens) {
          const rule = /^:([^:\n]+):([^:\n]*)(?:\n|$)/;
          const match = rule.exec(src);
          if (match) {
            const token = {
              type: 'walkableDescription',
              raw: match[0],
              dt: [],
              dd: [],
              tokens: []
            };
            this.lexer.inline(match[1].trim(), token.dt);
            this.lexer.inline(match[2].trim(), token.dd);
            this.lexer.inline('unwalked', token.tokens);
            return token;
          }
        },
        renderer(token) {
          return `\n<dt>${this.parser.parseInline(token.dt)} - ${this.parser.parseInline(token.tokens)}</dt><dd>${this.parser.parseInline(token.dd)}</dd>`;
        },
        childTokens: ['dd', 'dt']
      }],
      walkTokens(token) {
        if (token.type === 'text') {
          token.text += ' walked';
        }
      }
    };
    use(walkableDescription);
    const html = marked(':   Topic 1   :  Description 1\n'
                      + ': **Topic 2** : *Description 2*');
    expect(html).toBe('<p>\n<dt>Topic 1 walked - unwalked</dt><dd>Description 1 walked</dd>'
                    + '\n<dt><strong>Topic 2 walked</strong> - unwalked</dt><dd><em>Description 2 walked</em></dd></p>\n');
  });

  describe('multiple extensions', () => {
    function createExtension(name) {
      return {
        extensions: [{
          name: `block-${name}`,
          level: 'block',
          start(src) { return src.indexOf('::'); },
          tokenizer(src, tokens) {
            if (src.startsWith(`::${name}\n`)) {
              const text = `:${name}`;
              const token = {
                type: `block-${name}`,
                raw: `::${name}\n`,
                text,
                tokens: []
              };
              this.lexer.inline(token.text, token.tokens);
              return token;
            }
          },
          renderer(token) {
            return `<${token.type}>${this.parser.parseInline(token.tokens)}</${token.type}>\n`;
          }
        }, {
          name: `inline-${name}`,
          level: 'inline',
          start(src) { return src.indexOf(':'); },
          tokenizer(src, tokens) {
            if (src.startsWith(`:${name}`)) {
              return {
                type: `inline-${name}`,
                raw: `:${name}`,
                text: `used ${name}`
              };
            }
          },
          renderer(token) {
            return token.text;
          }
        }],
        tokenizer: {
          heading(src) {
            if (src.startsWith(`# ${name}`)) {
              const token = {
                type: 'heading',
                raw: `# ${name}`,
                text: `used ${name}`,
                depth: 1,
                tokens: []
              };
              this.lexer.inline(token.text, token.tokens);
              return token;
            }
            return false;
          }
        },
        renderer: {
          heading(text, depth, raw, slugger) {
            if (text === name) {
              return `<h${depth}>${text}</h${depth}>\n`;
            }
            return false;
          }
        },
        walkTokens(token) {
          if (token.text === `used ${name}`) {
            token.text += ' walked';
          }
        },
        headerIds: false
      };
    }

    function createFalseExtension(name) {
      return {
        extensions: [{
          name: `block-${name}`,
          level: 'block',
          start(src) { return src.indexOf('::'); },
          tokenizer(src, tokens) {
            return false;
          },
          renderer(token) {
            return false;
          }
        }, {
          name: `inline-${name}`,
          level: 'inline',
          start(src) { return src.indexOf(':'); },
          tokenizer(src, tokens) {
            return false;
          },
          renderer(token) {
            return false;
          }
        }],
        headerIds: false
      };
    }

    function runTest() {
      const html = marked(`
::extension1
::extension2

:extension1
:extension2

# extension1

# extension2

# no extension
`);

      expect(`\n${html}\n`.replace(/\n+/g, '\n')).toBe(`
<block-extension1>used extension1 walked</block-extension1>
<block-extension2>used extension2 walked</block-extension2>
<p>used extension1 walked
used extension2 walked</p>
<h1>used extension1 walked</h1>
<h1>used extension2 walked</h1>
<h1>no extension</h1>
`);
    }

    it('should merge extensions when calling marked.use multiple times', () => {
      use(createExtension('extension1'));
      use(createExtension('extension2'));

      runTest();
    });

    it('should merge extensions when calling marked.use with multiple extensions', () => {
      use(
        createExtension('extension1'),
        createExtension('extension2')
      );

      runTest();
    });

    it('should fall back to any extensions with the same name if the first returns false', () => {
      use(
        createExtension('extension1'),
        createExtension('extension2'),
        createFalseExtension('extension1'),
        createFalseExtension('extension2')
      );

      runTest();
    });
  });

  it('should allow deleting/editing tokens', () => {
    const styleTags = {
      extensions: [{
        name: 'inlineStyleTag',
        level: 'inline',
        start(src) {
          const match = src.match(/ *{[^\{]/);
          if (match) {
            return match.index;
          }
        },
        tokenizer(src, tokens) {
          const rule = /^ *{([^\{\}\n]+)}$/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'inlineStyleTag',
              raw: match[0], // This is the text that you want your token to consume from the source
              text: match[1]
            };
          }
        }
      },
      {
        name: 'styled',
        renderer(token) {
          token.type = token.originalType;
          const text = this.parser.parse([token]);
          const openingTag = /(<[^\s<>]+)([^\n<>]*>.*)/s.exec(text);
          if (openingTag) {
            return `${openingTag[1]} ${token.style}${openingTag[2]}`;
          }
          return text;
        }
      }],
      walkTokens(token) {
        if (token.tokens) {
          const finalChildToken = token.tokens[token.tokens.length - 1];
          if (finalChildToken && finalChildToken.type === 'inlineStyleTag') {
            token.originalType = token.type;
            token.type = 'styled';
            token.style = `style="color:${finalChildToken.text};"`;
            token.tokens.pop();
          }
        }
      },
      headerIds: false
    };
    use(styleTags);
    const html = marked('This is a *paragraph* with blue text. {blue}\n'
                      + '# This is a *header* with red text {red}');
    expect(html).toBe('<p style="color:blue;">This is a <em>paragraph</em> with blue text.</p>\n'
                     + '<h1 style="color:red;">This is a <em>header</em> with red text</h1>\n');
  });

  it('should use renderer', () => {
    const extension = {
      renderer: {
        paragraph(text) {
          return 'extension';
        }
      }
    };
    spyOn(extension.renderer, 'paragraph').and.callThrough();
    use(extension);
    const html = marked('text');
    expect(extension.renderer.paragraph).toHaveBeenCalledWith('text');
    expect(html).toBe('extension');
  });

  it('should use tokenizer', () => {
    const extension = {
      tokenizer: {
        paragraph(text) {
          const token = {
            type: 'paragraph',
            raw: text,
            text: 'extension',
            tokens: []
          };
          this.lexer.inline(token.text, token.tokens);
          return token;
        }
      }
    };
    spyOn(extension.tokenizer, 'paragraph').and.callThrough();
    use(extension);
    const html = marked('text');
    expect(extension.tokenizer.paragraph).toHaveBeenCalledWith('text');
    expect(html).toBe('<p>extension</p>\n');
  });

  it('should use walkTokens', () => {
    let walked = 0;
    const extension = {
      walkTokens(token) {
        walked++;
      }
    };
    use(extension);
    marked('text');
    expect(walked).toBe(2);
  });

  it('should use walkTokens in async', (done) => {
    let walked = 0;
    const extension = {
      walkTokens(token) {
        walked++;
      }
    };
    use(extension);
    marked('text', () => {
      expect(walked).toBe(2);
      done();
    });
  });

  it('should use options from extension', () => {
    const extension = {
      headerIds: false
    };
    use(extension);
    const html = marked('# heading');
    expect(html).toBe('<h1>heading</h1>\n');
  });

  it('should call all walkTokens in reverse order', () => {
    let walkedOnce = 0;
    let walkedTwice = 0;
    const extension1 = {
      walkTokens(token) {
        if (token.walkedOnce) {
          walkedTwice++;
        }
      }
    };
    const extension2 = {
      walkTokens(token) {
        walkedOnce++;
        token.walkedOnce = true;
      }
    };
    use(extension1);
    use(extension2);
    marked('text');
    expect(walkedOnce).toBe(2);
    expect(walkedTwice).toBe(2);
  });

  it('should use last extension function and not override others', () => {
    const extension1 = {
      renderer: {
        paragraph(text) {
          return 'extension1 paragraph\n';
        },
        html(html) {
          return 'extension1 html\n';
        }
      }
    };
    const extension2 = {
      renderer: {
        paragraph(text) {
          return 'extension2 paragraph\n';
        }
      }
    };
    use(extension1);
    use(extension2);
    const html = marked(`
paragraph

<html />

# heading
`);
    expect(html).toBe('extension2 paragraph\nextension1 html\n<h1 id="heading">heading</h1>\n');
  });

  it('should use previous extension when returning false', () => {
    const extension1 = {
      renderer: {
        paragraph(text) {
          if (text !== 'original') {
            return 'extension1 paragraph\n';
          }
          return false;
        }
      }
    };
    const extension2 = {
      renderer: {
        paragraph(text) {
          if (text !== 'extension1' && text !== 'original') {
            return 'extension2 paragraph\n';
          }
          return false;
        }
      }
    };
    use(extension1);
    use(extension2);
    const html = marked(`
paragraph

extension1

original
`);
    expect(html).toBe('extension2 paragraph\nextension1 paragraph\n<p>original</p>\n');
  });

  it('should get options with this.options', () => {
    const extension = {
      renderer: {
        heading: () => {
          return this && this.options ? 'arrow options\n' : 'arrow no options\n';
        },
        html: function() {
          return this.options ? 'function options\n' : 'function no options\n';
        },
        paragraph() {
          return this.options ? 'shorthand options\n' : 'shorthand no options\n';
        }
      }
    };
    use(extension);
    const html = marked(`
# heading

<html />

paragraph
`);
    expect(html).toBe('arrow no options\nfunction options\nshorthand options\n');
  });
});

describe('async highlight', () => {
  let highlight, markdown;
  beforeEach(() => {
    highlight = jasmine.createSpy('highlight', (text, lang, callback) => {
      setImmediate(() => {
        callback(null, `async ${text || ''}`);
      });
    });
    markdown = `
\`\`\`lang1
text 1
\`\`\`

> \`\`\`lang2
> text 2
> \`\`\`

- \`\`\`lang3
  text 3
  \`\`\`
`;
  });

  it('should highlight codeblocks async', (done) => {
    highlight.and.callThrough();

    marked(markdown, { highlight }, (err, html) => {
      if (err) {
        fail(err);
      }

      expect(html).toBe(`<pre><code class="language-lang1">async text 1
</code></pre>
<blockquote>
<pre><code class="language-lang2">async text 2
</code></pre>
</blockquote>
<ul>
<li><pre><code class="language-lang3">async text 3
</code></pre>
</li>
</ul>
`);
      done();
    });
  });

  it('should call callback for each error in highlight', (done) => {
    highlight.and.callFake((text, lang, callback) => {
      callback(new Error('highlight error'));
    });

    let numErrors = 0;
    marked(markdown, { highlight }, (err, html) => {
      expect(err).toBeTruthy();
      expect(html).toBeUndefined();

      if (err) {
        numErrors++;
      }

      if (numErrors === 3) {
        done();
      }
    });
  });

  it('should highlight codeblocks when not async', (done) => {
    highlight.and.callFake((text, lang, callback) => {
      callback(null, `async ${text || ''}`);
    });

    marked(markdown, { highlight }, (err, html) => {
      if (err) {
        fail(err);
      }

      expect(html).toBe(`<pre><code class="language-lang1">async text 1
</code></pre>
<blockquote>
<pre><code class="language-lang2">async text 2
</code></pre>
</blockquote>
<ul>
<li><pre><code class="language-lang3">async text 3
</code></pre>
</li>
</ul>
`);
      done();
    });
  });
});

describe('walkTokens', () => {
  it('should walk over every token', () => {
    const markdown = `
paragraph

---

# heading

\`\`\`
code
\`\`\`

| a | b |
|---|---|
| 1 | 2 |
| 3 | 4 |

> blockquote

- list

<div>html</div>

[link](https://example.com)

![image](https://example.com/image.jpg)

**strong**

*em*

\`codespan\`

~~del~~

br
br
`;
    const tokens = lexer(markdown, { ...getDefaults(), breaks: true });
    const tokensSeen = [];
    _walkTokens(tokens, (token) => {
      tokensSeen.push([token.type, (token.raw || '').replace(/\n/g, '')]);
    });

    expect(tokensSeen).toEqual([
      ['space', ''],
      ['paragraph', 'paragraph'],
      ['text', 'paragraph'],
      ['space', ''],
      ['hr', '---'],
      ['heading', '# heading'],
      ['text', 'heading'],
      ['code', '```code```'],
      ['space', ''],
      ['table', '| a | b ||---|---|| 1 | 2 || 3 | 4 |'],
      ['text', 'a'],
      ['text', 'b'],
      ['text', '1'],
      ['text', '2'],
      ['text', '3'],
      ['text', '4'],
      ['blockquote', '> blockquote'],
      ['paragraph', 'blockquote'],
      ['text', 'blockquote'],
      ['list', '- list'],
      ['list_item', '- list'],
      ['text', 'list'],
      ['text', 'list'],
      ['space', ''],
      ['html', '<div>html</div>'],
      ['paragraph', '[link](https://example.com)'],
      ['link', '[link](https://example.com)'],
      ['text', 'link'],
      ['space', ''],
      ['paragraph', '![image](https://example.com/image.jpg)'],
      ['image', '![image](https://example.com/image.jpg)'],
      ['space', ''],
      ['paragraph', '**strong**'],
      ['strong', '**strong**'],
      ['text', 'strong'],
      ['space', ''],
      ['paragraph', '*em*'],
      ['em', '*em*'],
      ['text', 'em'],
      ['space', ''],
      ['paragraph', '`codespan`'],
      ['codespan', '`codespan`'],
      ['space', ''],
      ['paragraph', '~~del~~'],
      ['del', '~~del~~'],
      ['text', 'del'],
      ['space', ''],
      ['paragraph', 'brbr'],
      ['text', 'br'],
      ['br', ''],
      ['text', 'br']
    ]);
  });

  it('should asign marked to `this`', () => {
    marked.use({
      walkTokens(token) {
        if (token.type === 'em') {
          token.text += ' walked';
          token.tokens = this.Lexer.lexInline(token.text);
        }
      }
    });
    expect(marked('*text*').trim()).toBe('<p><em>text walked</em></p>');
  });
});
