import { Marked, Renderer, lexer, parseInline, getDefaults, walkTokens, defaults, setOptions } from '../../lib/marked.esm.js';
import { timeout } from './utils.js';
import assert from 'node:assert';
import { describe, it, beforeEach, mock } from 'node:test';

describe('marked unit', () => {
  let marked;
  beforeEach(() => {
    marked = new Marked();
  });

  describe('Test paragraph token type', () => {
    it('should use the "paragraph" type on top level', () => {
      const md = 'A Paragraph.\n\n> A blockquote\n\n- list item\n';

      const tokens = lexer(md);

      assert.strictEqual(tokens[0].type, 'paragraph');
      assert.strictEqual(tokens[2].tokens[0].type, 'paragraph');
      assert.strictEqual(tokens[3].items[0].tokens[0].type, 'text');
    });
  });

  describe('changeDefaults', () => {
    it('should change global defaults', async() => {
      const { defaults, setOptions } = await import('../../lib/marked.esm.js');
      assert.ok(!defaults.test);
      setOptions({ test: true });
      assert.ok((await import('../../lib/marked.esm.js')).defaults.test);
    });
  });

  describe('inlineLexer', () => {
    it('should send html to renderer.html', () => {
      const renderer = new Renderer();
      mock.method(renderer, 'html');
      const md = 'HTML Image: <img alt="MY IMAGE" src="example.png" />';
      marked.parse(md, { renderer });

      assert.strictEqual(renderer.html.mock.calls[0].arguments[0], '<img alt="MY IMAGE" src="example.png" />');
    });
  });

  describe('task', () => {
    it('space after checkbox', () => {
      const html = marked.parse('- [ ] item');

      assert.strictEqual(html, '<ul>\n<li><input disabled="" type="checkbox"> item</li>\n</ul>\n');
    });

    it('space after loose checkbox', () => {
      const html = marked.parse('- [ ] item 1\n\n- [ ] item 2');

      assert.strictEqual(html, '<ul>\n<li><p><input disabled="" type="checkbox"> \nitem 1</p>\n</li>\n<li><p><input disabled="" type="checkbox"> \nitem 2</p>\n</li>\n</ul>\n');
    });
  });

  describe('parseInline', () => {
    it('should parse inline tokens', () => {
      const md = '**strong** _em_';
      const html = parseInline(md);

      assert.strictEqual(html, '<strong>strong</strong> <em>em</em>');
    });

    it('should not parse block tokens', () => {
      const md = '# header\n\n_em_';
      const html = parseInline(md);

      assert.strictEqual(html, '# header\n\n<em>em</em>');
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
      marked.use({ extensions: [underline] });
      let html = marked.parse('Not Underlined\n:Underlined\nNot Underlined');
      assert.strictEqual(html, '<p>Not Underlined\n:Underlined\nNot Underlined</p>\n');

      html = marked.parse('Not Underlined\n\n:Underlined\n\nNot Underlined');
      assert.strictEqual(html, '<p>Not Underlined</p>\n<u>Underlined</u>\n<p>Not Underlined</p>\n');
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
      marked.use(underline);
      const html = marked.parse('Not Underlined A\n:Underlined B:\nNot Underlined C\n:Not Underlined D');
      assert.strictEqual(html, '<p>Not Underlined A</p>\n<u>Underlined B</u>\n<p>Not Underlined C\n:Not Underlined D</p>\n');
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
      marked.use({ extensions: [underline] });
      const html = marked.parse('Not Underlined =Underlined= Not Underlined');
      assert.strictEqual(html, '<p>Not Underlined <u>Underlined</u> Not Underlined</p>\n');
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
      marked.use({ extensions: [descriptionlist, description] });
      const html = marked.parse('A Description List with One Description:\n'
                      + ':   Topic 1   :  Description 1\n'
                      + ': **Topic 2** : *Description 2*');
      assert.strictEqual(html, '<p>A Description List with One Description:</p>\n'
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
      marked.use({ silent: true, extensions: [extension] });
      const html = marked.parse(':test:\ntest\n<div></div>');
      assert.strictEqual(html, '<u>test</u>\n<p>test</p>\n<div></div>');
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
      marked.use({ extensions: [fallbackRenderer, extension] });
      const html = marked.parse(':Test:\n\n:test:\n\n:none:');
      assert.strictEqual(html, 'fallbacktest');
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
      marked.use({ extensions: [extension, extension2] });
      const html = marked.parse(':Test:\n\n:test:');
      assert.strictEqual(html, 'TESTtest');
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
      marked.use(extension);
      const html = marked.parse('# extension1\n:extension2:');
      assert.strictEqual(html, '<h1>extension1 RENDERER EXTENSION</h1>\n<pre><code>extension2 TOKENIZER EXTENSION\n</code></pre>\n');
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
                dt: this.lexer.inline(match[1].trim()),
                dd: [],
                tokens: []
              };
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
      marked.use(walkableDescription);
      const html = marked.parse(':   Topic 1   :  Description 1\n'
                      + ': **Topic 2** : *Description 2*');
      assert.strictEqual(html, '<p>\n<dt>Topic 1 walked - unwalked</dt><dd>Description 1 walked</dd>'
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
            heading(text, depth, raw) {
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
          }
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
          }]
        };
      }

      function runTest() {
        const html = marked.parse(`
::extension1
::extension2

:extension1
:extension2

# extension1

# extension2

# no extension
`);

        assert.strictEqual(`\n${html}\n`.replace(/\n+/g, '\n'), `
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
        marked.use(createExtension('extension1'));
        marked.use(createExtension('extension2'));

        runTest();
      });

      it('should merge extensions when calling marked.use with multiple extensions', () => {
        marked.use(
          createExtension('extension1'),
          createExtension('extension2')
        );

        runTest();
      });

      it('should fall back to any extensions with the same name if the first returns false', () => {
        marked.use(
          createExtension('extension1'),
          createExtension('extension2'),
          createFalseExtension('extension1'),
          createFalseExtension('extension2')
        );

        runTest();
      });

      it('should merge extensions correctly', () => {
        marked.use(
          {},
          { tokenizer: {} },
          { renderer: {} },
          { walkTokens: () => {} },
          { extensions: [] }
        );

        // should not throw
        marked.parse('# test');
      });
    });

    it('should be async if any extension in use args is async', () => {
      marked.use(
        { async: true },
        { async: false }
      );

      assert.ok(marked.defaults.async);
    });

    it('should be async if any extension in use is async', () => {
      marked.use({ async: true });
      marked.use({ async: false });

      assert.ok(marked.defaults.async);
    });

    it('should reset async with setOptions', () => {
      marked.use({ async: true });
      setOptions({ async: false });

      assert.ok(!defaults.async);
    });

    it('should return Promise if async', () => {
      assert.ok(marked.parse('test', { async: true }) instanceof Promise);
    });

    it('should return string if not async', () => {
      assert.strictEqual(typeof marked.parse('test', { async: false }), 'string');
    });

    it('should return Promise if async is set by extension', () => {
      marked.use({ async: true });

      assert.ok(marked.parse('test', { async: false }) instanceof Promise);
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
        }
      };
      marked.use(styleTags);
      const html = marked.parse('This is a *paragraph* with blue text. {blue}\n'
                      + '# This is a *header* with red text {red}');
      assert.strictEqual(html, '<p style="color:blue;">This is a <em>paragraph</em> with blue text.</p>\n'
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
      mock.method(extension.renderer, 'paragraph');
      marked.use(extension);
      const html = marked.parse('text');
      assert.strictEqual(extension.renderer.paragraph.mock.calls[0].arguments[0], 'text');
      assert.strictEqual(html, 'extension');
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
      mock.method(extension.tokenizer, 'paragraph');
      marked.use(extension);
      const html = marked.parse('text');
      assert.strictEqual(extension.tokenizer.paragraph.mock.calls[0].arguments[0], 'text');
      assert.strictEqual(html, '<p>extension</p>\n');
    });

    it('should use walkTokens', () => {
      let walked = 0;
      const extension = {
        walkTokens(token) {
          walked++;
        }
      };
      marked.use(extension);
      marked.parse('text');
      assert.strictEqual(walked, 2);
    });

    it('should use options from extension', () => {
      const extension = {
        breaks: true
      };
      marked.use(extension);
      const html = marked.parse('line1\nline2');
      assert.strictEqual(html, '<p>line1<br>line2</p>\n');
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
      marked.use(extension1);
      marked.use(extension2);
      marked.parse('text');
      assert.strictEqual(walkedOnce, 2);
      assert.strictEqual(walkedTwice, 2);
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
      marked.use(extension1);
      marked.use(extension2);
      const html = marked.parse(`
paragraph

<html />

# heading
`);
      assert.strictEqual(html, 'extension2 paragraph\nextension1 html\n<h1>heading</h1>\n');
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
      marked.use(extension1);
      marked.use(extension2);
      const html = marked.parse(`
paragraph

extension1

original
`);
      assert.strictEqual(html, 'extension2 paragraph\nextension1 paragraph\n<p>original</p>\n');
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
      marked.use(extension);
      const html = marked.parse(`
# heading

<html />

paragraph
`);
      assert.strictEqual(html, 'arrow no options\nfunction options\nshorthand options\n');
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
      walkTokens(tokens, (token) => {
        tokensSeen.push([token.type, (token.raw || '').replace(/\n/g, '')]);
      });

      assert.deepEqual(tokensSeen, [
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

    it('should assign marked to `this`', () => {
      marked.use({
        walkTokens(token) {
          if (token.type === 'em') {
            token.text += ' walked';
            token.tokens = this.Lexer.lexInline(token.text);
          }
        }
      });
      assert.strictEqual(marked.parse('*text*').trim(), '<p><em>text walked</em></p>');
    });

    it('should wait for async `walkTokens` function', async() => {
      marked.use({
        async: true,
        async walkTokens(token) {
          if (token.type === 'em') {
            await timeout();
            token.text += ' walked';
            token.tokens = this.Lexer.lexInline(token.text);
          }
        }
      });
      const promise = marked.parse('*text*');
      assert.ok(promise instanceof Promise);
      const html = await promise;
      assert.strictEqual(html.trim(), '<p><em>text walked</em></p>');
    });

    it('should return promise if async and no walkTokens function', async() => {
      marked.use({
        async: true
      });
      const promise = marked.parse('*text*');
      assert.ok(promise instanceof Promise);
      const html = await promise;
      assert.strictEqual(html.trim(), '<p><em>text</em></p>');
    });
  });
});
