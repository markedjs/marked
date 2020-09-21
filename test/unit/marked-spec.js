const marked = require('../../src/marked.js');

describe('Test heading ID functionality', () => {
  it('should add id attribute by default', () => {
    const renderer = new marked.Renderer();
    const slugger = new marked.Slugger();
    const header = renderer.heading('test', 1, 'test', slugger);
    expect(header).toBe('<h1 id="test">test</h1>\n');
  });

  it('should NOT add id attribute when options set false', () => {
    const renderer = new marked.Renderer({ headerIds: false });
    const header = renderer.heading('test', 1, 'test');
    expect(header).toBe('<h1>test</h1>\n');
  });
});

describe('Test slugger functionality', () => {
  it('should use lowercase slug', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('Test')).toBe('test');
  });

  it('should be unique to avoid collisions 1280', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with number', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('test 1')).toBe('test-1');
    expect(slugger.slug('test')).toBe('test');
    expect(slugger.slug('test')).toBe('test-2');
  });

  it('should be unique when slug ends with hyphen number', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('foo')).toBe('foo');
    expect(slugger.slug('foo')).toBe('foo-1');
    expect(slugger.slug('foo 1')).toBe('foo-1-1');
    expect(slugger.slug('foo-1')).toBe('foo-1-2');
    expect(slugger.slug('foo')).toBe('foo-2');
  });

  it('should allow non-latin chars', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('привет')).toBe('привет');
  });

  it('should remove ampersands 857', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('This & That Section')).toBe('this--that-section');
  });

  it('should remove periods', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('file.txt')).toBe('filetxt');
  });

  it('should remove html tags', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('<em>html</em>')).toBe('html');
  });

  it('should not increment seen when using dryrun option', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
  });

  it('should still return the next unique id when using dryrun', () => {
    const slugger = new marked.Slugger();
    expect(slugger.slug('<h1>This Section</h1>')).toBe('this-section');
    expect(slugger.slug('<h1>This Section</h1>', { dryrun: true })).toBe('this-section-1');
  });

  it('should be repeatable in a sequence', () => {
    const slugger = new marked.Slugger();
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

    const tokens = marked.lexer(md);

    expect(tokens[0].type).toBe('paragraph');
    expect(tokens[2].tokens[0].type).toBe('paragraph');
    expect(tokens[3].items[0].tokens[0].type).toBe('text');
  });
});

describe('changeDefaults', () => {
  it('should change global defaults', () => {
    const { defaults, changeDefaults } = require('../../src/defaults');
    expect(defaults.test).toBeUndefined();
    changeDefaults({ test: true });
    expect(require('../../src/defaults').defaults.test).toBe(true);
  });
});

describe('inlineLexer', () => {
  it('should send html to renderer.html', () => {
    const renderer = new marked.Renderer();
    spyOn(renderer, 'html').and.callThrough();
    const md = 'HTML Image: <img alt="MY IMAGE" src="example.png" />';
    marked(md, { renderer });

    expect(renderer.html).toHaveBeenCalledWith('<img alt="MY IMAGE" src="example.png" />');
  });
});

describe('parseInline', () => {
  it('should parse inline tokens', () => {
    const md = '**strong** _em_';
    const html = marked.parseInline(md);

    expect(html).toBe('<strong>strong</strong> <em>em</em>');
  });

  it('should not parse block tokens', () => {
    const md = '# header\n\n_em_';
    const html = marked.parseInline(md);

    expect(html).toBe('# header\n\n<em>em</em>');
  });
});

describe('use extension', () => {
  it('should use renderer', () => {
    const extension = {
      renderer: {
        paragraph(text) {
          return 'extension';
        }
      }
    };
    spyOn(extension.renderer, 'paragraph').and.callThrough();
    marked.use(extension);
    const html = marked('text');
    expect(extension.renderer.paragraph).toHaveBeenCalledWith('text');
    expect(html).toBe('extension');
  });

  it('should use tokenizer', () => {
    const extension = {
      tokenizer: {
        paragraph(text) {
          return {
            type: 'paragraph',
            raw: text,
            text: 'extension'
          };
        }
      }
    };
    spyOn(extension.tokenizer, 'paragraph').and.callThrough();
    marked.use(extension);
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
    marked.use(extension);
    marked('text');
    expect(walked).toBe(2);
  });

  it('should use options from extension', () => {
    const extension = {
      headerIds: false
    };
    marked.use(extension);
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
    marked.use(extension1);
    marked.use(extension2);
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
    marked.use(extension1);
    marked.use(extension2);
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
    marked.use(extension1);
    marked.use(extension2);
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
          return this.options ? 'arrow options\n' : 'arrow no options\n';
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

      expect(html).toBe(`<pre><code class="language-lang1">async text 1</code></pre>
<blockquote>
<pre><code class="language-lang2">async text 2</code></pre>
</blockquote>
<ul>
<li><pre><code class="language-lang3">async text 3</code></pre>
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

      expect(html).toBe(`<pre><code class="language-lang1">async text 1</code></pre>
<blockquote>
<pre><code class="language-lang2">async text 2</code></pre>
</blockquote>
<ul>
<li><pre><code class="language-lang3">async text 3</code></pre>
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
    const tokens = marked.lexer(markdown, { ...marked.getDefaults(), breaks: true });
    const tokensSeen = [];
    marked.walkTokens(tokens, (token) => {
      tokensSeen.push([token.type, (token.raw || '').replace(/\n/g, '')]);
    });

    expect(tokensSeen).toEqual([
      ['paragraph', 'paragraph'],
      ['text', 'paragraph'],
      ['space', ''],
      ['hr', '---'],
      ['heading', '# heading'],
      ['text', 'heading'],
      ['code', '```code```'],
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
});
