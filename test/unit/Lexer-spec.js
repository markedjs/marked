import { Lexer } from '../../src/Lexer.js';

function expectTokens({ md, options, tokens = [], links = {} }) {
  const lexer = new Lexer(options);
  const actual = lexer.lex(md);
  const expected = tokens;
  expected.links = links;
  // console.log(JSON.stringify(actual, null, 2));
  expect(actual).toEqual(expected);
}

function expectInlineTokens({ md, options, tokens = jasmine.any(Array), links = {} }) {
  const lexer = new Lexer(options);
  lexer.tokens.links = links;
  const outTokens = [];
  lexer.inlineTokens(md, outTokens);
  expect(outTokens).toEqual(tokens);
}

describe('Lexer', () => {
  describe('paragraph', () => {
    it('space between paragraphs', () => {
      expectTokens({
        md: 'paragraph 1\n\nparagraph 2',
        tokens: [
          {
            type: 'paragraph',
            raw: 'paragraph 1',
            text: 'paragraph 1',
            tokens: [{ type: 'text', raw: 'paragraph 1', text: 'paragraph 1' }]
          },
          { type: 'space', raw: '\n\n' },
          {
            type: 'paragraph',
            raw: 'paragraph 2',
            text: 'paragraph 2',
            tokens: [{ type: 'text', raw: 'paragraph 2', text: 'paragraph 2' }]
          }
        ]
      });
    });
  });

  describe('code', () => {
    it('indented code', () => {
      expectTokens({
        md: '    code',
        tokens: [
          { type: 'code', raw: '    code', text: 'code', codeBlockStyle: 'indented' }
        ]
      });
    });

    it('fenced code', () => {
      expectTokens({
        md: '```\ncode\n```',
        tokens: [
          { type: 'code', raw: '```\ncode\n```', text: 'code', lang: '' }
        ]
      });
    });

    it('fenced code lang', () => {
      expectTokens({
        md: '```text\ncode\n```',
        tokens: [
          { type: 'code', raw: '```text\ncode\n```', text: 'code', lang: 'text' }
        ]
      });
    });
  });

  describe('headings', () => {
    it('depth', () => {
      expectTokens({
        md: `
# heading 1

## heading 2

### heading 3

#### heading 4

##### heading 5

###### heading 6

lheading 1
==========

lheading 2
----------
`,
        tokens: [
          {
            type: 'space',
            raw: '\n'
          },
          {
            type: 'heading',
            raw: '# heading 1\n\n',
            depth: 1,
            text: 'heading 1',
            tokens: [{ type: 'text', raw: 'heading 1', text: 'heading 1' }]
          },
          {
            type: 'heading',
            raw: '## heading 2\n\n',
            depth: 2,
            text: 'heading 2',
            tokens: [{ type: 'text', raw: 'heading 2', text: 'heading 2' }]
          },
          {
            type: 'heading',
            raw: '### heading 3\n\n',
            depth: 3,
            text: 'heading 3',
            tokens: [{ type: 'text', raw: 'heading 3', text: 'heading 3' }]
          },
          {
            type: 'heading',
            raw: '#### heading 4\n\n',
            depth: 4,
            text: 'heading 4',
            tokens: [{ type: 'text', raw: 'heading 4', text: 'heading 4' }]
          },
          {
            type: 'heading',
            raw: '##### heading 5\n\n',
            depth: 5,
            text: 'heading 5',
            tokens: [{ type: 'text', raw: 'heading 5', text: 'heading 5' }]
          },
          {
            type: 'heading',
            raw: '###### heading 6\n\n',
            depth: 6,
            text: 'heading 6',
            tokens: [{ type: 'text', raw: 'heading 6', text: 'heading 6' }]
          },
          {
            type: 'heading',
            raw: 'lheading 1\n==========\n\n',
            depth: 1,
            text: 'lheading 1',
            tokens: [{ type: 'text', raw: 'lheading 1', text: 'lheading 1' }]
          },
          {
            type: 'heading',
            raw: 'lheading 2\n----------\n',
            depth: 2,
            text: 'lheading 2',
            tokens: [{ type: 'text', raw: 'lheading 2', text: 'lheading 2' }]
          }
        ]
      });
    });

    it('should not be heading if depth > 6', () => {
      expectTokens({
        md: '####### heading 7',
        tokens: [{
          type: 'paragraph',
          raw: '####### heading 7',
          text: '####### heading 7',
          tokens: [{ type: 'text', raw: '####### heading 7', text: '####### heading 7' }]
        }]
      });
    });
  });

  describe('table', () => {
    it('pipe table', () => {
      expectTokens({
        md: `
| a | b |
|---|---|
| 1 | 2 |
`,
        tokens: [{
          type: 'space',
          raw: '\n'
        }, {
          type: 'table',
          align: [null, null],
          raw: '| a | b |\n|---|---|\n| 1 | 2 |\n',
          header: [
            {
              text: 'a',
              tokens: [{ type: 'text', raw: 'a', text: 'a' }]
            },
            {
              text: 'b',
              tokens: [{ type: 'text', raw: 'b', text: 'b' }]
            }
          ],
          rows: [
            [
              {
                text: '1',
                tokens: [{ type: 'text', raw: '1', text: '1' }]
              },
              {
                text: '2',
                tokens: [{ type: 'text', raw: '2', text: '2' }]
              }
            ]
          ]
        }]
      });
    });

    it('table after para', () => {
      expectTokens({
        md: `
paragraph 1
| a | b |
|---|---|
| 1 | 2 |
`,
        tokens: [{
          type: 'space',
          raw: '\n'
        }, {
          type: 'paragraph',
          raw: 'paragraph 1\n',
          text: 'paragraph 1',
          tokens: [{ type: 'text', raw: 'paragraph 1', text: 'paragraph 1' }]
        },
        {
          type: 'table',
          align: [null, null],
          raw: '| a | b |\n|---|---|\n| 1 | 2 |\n',
          header: [
            {
              text: 'a',
              tokens: [{ type: 'text', raw: 'a', text: 'a' }]
            },
            {
              text: 'b',
              tokens: [{ type: 'text', raw: 'b', text: 'b' }]
            }
          ],
          rows: [
            [
              {
                text: '1',
                tokens: [{ type: 'text', raw: '1', text: '1' }]
              },
              {
                text: '2',
                tokens: [{ type: 'text', raw: '2', text: '2' }]
              }
            ]
          ]
        }
        ]
      });
    });

    it('align table', () => {
      expectTokens({
        md: `
| a | b | c |
|:--|:-:|--:|
| 1 | 2 | 3 |
`,
        tokens: [{
          type: 'space',
          raw: '\n'
        }, {
          type: 'table',
          align: ['left', 'center', 'right'],
          raw: '| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 | 3 |\n',
          header: [
            {
              text: 'a',
              tokens: [{ type: 'text', raw: 'a', text: 'a' }]
            },
            {
              text: 'b',
              tokens: [{ type: 'text', raw: 'b', text: 'b' }]
            },
            {
              text: 'c',
              tokens: [{ type: 'text', raw: 'c', text: 'c' }]
            }
          ],
          rows: [
            [
              {
                text: '1',
                tokens: [{ type: 'text', raw: '1', text: '1' }]
              },
              {
                text: '2',
                tokens: [{ type: 'text', raw: '2', text: '2' }]
              },
              {
                text: '3',
                tokens: [{ type: 'text', raw: '3', text: '3' }]
              }
            ]
          ]
        }]
      });
    });

    it('no pipe table', () => {
      expectTokens({
        md: `
a | b
--|--
1 | 2
`,
        tokens: [
          {
            type: 'space',
            raw: '\n'
          }, {
            type: 'table',
            align: [null, null],
            raw: 'a | b\n--|--\n1 | 2\n',
            header: [
              {
                text: 'a',
                tokens: [{ type: 'text', raw: 'a', text: 'a' }]
              },
              {
                text: 'b',
                tokens: [{ type: 'text', raw: 'b', text: 'b' }]
              }
            ],
            rows: [
              [
                {
                  text: '1',
                  tokens: [{ type: 'text', raw: '1', text: '1' }]
                },
                {
                  text: '2',
                  tokens: [{ type: 'text', raw: '2', text: '2' }]
                }
              ]
            ]
          }]
      });
    });
  });

  describe('hr', () => {
    it('hr', () => {
      expectTokens({
        md: '---',
        tokens: [
          { type: 'hr', raw: '---' }
        ]
      });
    });

    it('after line break does not consume raw \n', () => {
      expectTokens({
        md: 'T\nh\n---',
        tokens:
          jasmine.arrayContaining([
            jasmine.objectContaining({
              raw: 'T\nh\n'
            }),
            { type: 'hr', raw: '---' }
          ])
      });
    });
  });

  describe('blockquote', () => {
    it('start, inner-tokens, end', () => {
      expectTokens({
        md: '> blockquote',
        tokens: [
          {
            type: 'blockquote',
            raw: '> blockquote',
            text: 'blockquote',
            tokens: [{
              type: 'paragraph',
              raw: 'blockquote',
              text: 'blockquote',
              tokens: [
                { type: 'text', raw: 'blockquote', text: 'blockquote' }
              ]
            }]
          }
        ]
      });
    });
  });

  describe('list', () => {
    it('unordered', () => {
      expectTokens({
        md: `
- item 1
- item 2
`,
        tokens: [
          {
            type: 'space',
            raw: '\n'
          }, {
            type: 'list',
            raw: '- item 1\n- item 2\n',
            ordered: false,
            start: '',
            loose: false,
            items: [
              {
                type: 'list_item',
                raw: '- item 1\n',
                task: false,
                checked: undefined,
                loose: false,
                text: 'item 1',
                tokens: [{
                  type: 'text',
                  raw: 'item 1',
                  text: 'item 1',
                  tokens: [{ type: 'text', raw: 'item 1', text: 'item 1' }]
                }]
              },
              {
                type: 'list_item',
                raw: '- item 2',
                task: false,
                checked: undefined,
                loose: false,
                text: 'item 2',
                tokens: [{
                  type: 'text',
                  raw: 'item 2',
                  text: 'item 2',
                  tokens: [{ type: 'text', raw: 'item 2', text: 'item 2' }]
                }]
              }
            ]
          }
        ]
      });
    });

    it('ordered', () => {
      expectTokens({
        md: `
1. item 1
2. item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '1. item 1\n2. item 2\n',
            ordered: true,
            start: 1,
            items: [
              jasmine.objectContaining({
                raw: '1. item 1\n'
              }),
              jasmine.objectContaining({
                raw: '2. item 2'
              })
            ]
          })
        ])
      });
    });

    it('ordered with parenthesis', () => {
      expectTokens({
        md: `
1) item 1
2) item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '1) item 1\n2) item 2\n',
            ordered: true,
            start: 1,
            items: [
              jasmine.objectContaining({
                raw: '1) item 1\n'
              }),
              jasmine.objectContaining({
                raw: '2) item 2'
              })
            ]
          })
        ])
      });
    });

    it('space after list', () => {
      expectTokens({
        md: `
- item 1
- item 2

paragraph
`,
        tokens: [
          {
            type: 'space',
            raw: '\n'
          },
          {
            type: 'list',
            raw: '- item 1\n- item 2',
            ordered: false,
            start: '',
            loose: false,
            items: [
              {
                type: 'list_item',
                raw: '- item 1\n',
                task: false,
                checked: undefined,
                loose: false,
                text: 'item 1',
                tokens: [{
                  type: 'text',
                  raw: 'item 1',
                  text: 'item 1',
                  tokens: [{ type: 'text', raw: 'item 1', text: 'item 1' }]
                }]
              },
              {
                type: 'list_item',
                raw: '- item 2',
                task: false,
                checked: undefined,
                loose: false,
                text: 'item 2',
                tokens: [{
                  type: 'text',
                  raw: 'item 2',
                  text: 'item 2',
                  tokens: [{ type: 'text', raw: 'item 2', text: 'item 2' }]
                }]
              }
            ]
          },
          { type: 'space', raw: '\n\n' },
          {
            type: 'paragraph',
            raw: 'paragraph\n',
            text: 'paragraph',
            tokens: [{
              type: 'text',
              raw: 'paragraph',
              text: 'paragraph'
            }]
          }
        ]
      });
    });

    it('start', () => {
      expectTokens({
        md: `
2. item 1
3. item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '2. item 1\n3. item 2\n',
            ordered: true,
            start: 2,
            items: [
              jasmine.objectContaining({
                raw: '2. item 1\n'
              }),
              jasmine.objectContaining({
                raw: '3. item 2'
              })
            ]
          })
        ])
      });
    });

    it('loose', () => {
      expectTokens({
        md: `
- item 1

- item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '- item 1\n\n- item 2\n',
            loose: true,
            items: [
              jasmine.objectContaining({
                raw: '- item 1\n\n'
              }),
              jasmine.objectContaining({
                raw: '- item 2'
              })
            ]
          })
        ])
      });
    });

    it('not loose with spaces', () => {
      expectTokens({
        md: `
- item 1
  - item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '- item 1\n  - item 2\n',
            loose: false,
            items: [
              jasmine.objectContaining({
                raw: '- item 1\n  - item 2',
                tokens: jasmine.arrayContaining([
                  jasmine.objectContaining({
                    raw: 'item 1\n'
                  }),
                  jasmine.objectContaining({
                    type: 'list',
                    raw: '- item 2'
                  })
                ])
              })
            ]
          })
        ])
      });
    });

    it('task', () => {
      expectTokens({
        md: `
- [ ] item 1
- [x] item 2
`,
        tokens: jasmine.arrayContaining([
          jasmine.objectContaining({
            type: 'space',
            raw: '\n'
          }),
          jasmine.objectContaining({
            type: 'list',
            raw: '- [ ] item 1\n- [x] item 2\n',
            items: [
              jasmine.objectContaining({
                raw: '- [ ] item 1\n',
                task: true,
                checked: false
              }),
              jasmine.objectContaining({
                raw: '- [x] item 2',
                task: true,
                checked: true
              })
            ]
          })
        ])
      });
    });
  });

  describe('html', () => {
    it('div', () => {
      expectTokens({
        md: '<div>html</div>',
        tokens: [
          {
            type: 'html',
            raw: '<div>html</div>',
            pre: false,
            text: '<div>html</div>'
          }
        ]
      });
    });

    it('pre', () => {
      expectTokens({
        md: '<pre>html</pre>',
        tokens: [
          {
            type: 'html',
            raw: '<pre>html</pre>',
            pre: true,
            text: '<pre>html</pre>'
          }
        ]
      });
    });

    it('sanitize', () => {
      expectTokens({
        md: '<div>html</div>',
        options: { sanitize: true },
        tokens: [
          {
            type: 'paragraph',
            raw: '<div>html</div>',
            pre: false,
            text: '&lt;div&gt;html&lt;/div&gt;',
            tokens: [{
              type: 'text',
              raw: '&lt;div&gt;html&lt;/div&gt;',
              text: '&lt;div&gt;html&lt;/div&gt;'
            }]
          }
        ]
      });
    });
  });

  describe('def', () => {
    it('link', () => {
      expectTokens({
        md: '[link]: https://example.com',
        links: {
          link: { href: 'https://example.com', title: undefined }
        }
      });
    });

    it('title', () => {
      expectTokens({
        md: '[link]: https://example.com "title"',
        links: {
          link: { href: 'https://example.com', title: 'title' }
        }
      });
    });
  });

  describe('inline', () => {
    describe('inlineTokens', () => {
      it('escape', () => {
        expectInlineTokens({
          md: '\\>',
          tokens: [
            { type: 'escape', raw: '\\>', text: '&gt;' }
          ]
        });
      });

      it('html', () => {
        expectInlineTokens({
          md: '<div>html</div>',
          tokens: [
            { type: 'html', raw: '<div>', inLink: false, inRawBlock: false, text: '<div>' },
            { type: 'text', raw: 'html', text: 'html' },
            { type: 'html', raw: '</div>', inLink: false, inRawBlock: false, text: '</div>' }
          ]
        });
      });

      it('html sanitize', () => {
        expectInlineTokens({
          md: '<div>html</div>',
          options: { sanitize: true },
          tokens: [
            { type: 'text', raw: '<div>html</div>', inLink: false, inRawBlock: false, text: '&lt;div&gt;html&lt;/div&gt;' }
          ]
        });
      });

      it('link', () => {
        expectInlineTokens({
          md: '[link](https://example.com)',
          tokens: [
            {
              type: 'link',
              raw: '[link](https://example.com)',
              href: 'https://example.com',
              title: null,
              text: 'link',
              tokens: [
                { type: 'text', raw: 'link', text: 'link' }
              ]
            }
          ]
        });
      });

      it('link title', () => {
        expectInlineTokens({
          md: '[link](https://example.com "title")',
          tokens: [
            {
              type: 'link',
              raw: '[link](https://example.com "title")',
              href: 'https://example.com',
              title: 'title',
              text: 'link',
              tokens: [
                { type: 'text', raw: 'link', text: 'link' }
              ]
            }
          ]
        });
      });

      it('image', () => {
        expectInlineTokens({
          md: '![image](https://example.com/image.png)',
          tokens: [
            {
              type: 'image',
              raw: '![image](https://example.com/image.png)',
              text: 'image',
              href: 'https://example.com/image.png',
              title: null
            }
          ]
        });
      });

      it('image title', () => {
        expectInlineTokens({
          md: '![image](https://example.com/image.png "title")',
          tokens: [
            {
              type: 'image',
              raw: '![image](https://example.com/image.png "title")',
              text: 'image',
              href: 'https://example.com/image.png',
              title: 'title'
            }
          ]
        });
      });

      describe('reflink', () => {
        it('reflink', () => {
          expectInlineTokens({
            md: '[link][]',
            links: {
              link: { href: 'https://example.com', title: 'title' }
            },
            tokens: [
              {
                type: 'link',
                raw: '[link][]',
                href: 'https://example.com',
                title: 'title',
                text: 'link',
                tokens: [{
                  type: 'text',
                  raw: 'link',
                  text: 'link'
                }]
              }
            ]
          });
        });

        it('nolink', () => {
          expectInlineTokens({
            md: '[link]',
            links: {
              link: { href: 'https://example.com', title: 'title' }
            },
            tokens: [
              {
                type: 'link',
                raw: '[link]',
                href: 'https://example.com',
                title: 'title',
                text: 'link',
                tokens: [{
                  type: 'text',
                  raw: 'link',
                  text: 'link'
                }]
              }
            ]
          });
        });

        it('no def', () => {
          expectInlineTokens({
            md: '[link]',
            tokens: [
              { type: 'text', raw: '[link]', text: '[link]' }
            ]
          });
        });
      });

      it('strong', () => {
        expectInlineTokens({
          md: '**strong**',
          tokens: [
            {
              type: 'strong',
              raw: '**strong**',
              text: 'strong',
              tokens: [
                { type: 'text', raw: 'strong', text: 'strong' }
              ]
            }
          ]
        });
      });

      it('em', () => {
        expectInlineTokens({
          md: '*em*',
          tokens: [
            {
              type: 'em',
              raw: '*em*',
              text: 'em',
              tokens: [
                { type: 'text', raw: 'em', text: 'em' }
              ]
            }
          ]
        });
      });

      describe('codespan', () => {
        it('code', () => {
          expectInlineTokens({
            md: '`code`',
            tokens: [
              { type: 'codespan', raw: '`code`', text: 'code' }
            ]
          });
        });

        it('only spaces not stripped', () => {
          expectInlineTokens({
            md: '`   `',
            tokens: [
              { type: 'codespan', raw: '`   `', text: '   ' }
            ]
          });
        });

        it('beginning space only not stripped', () => {
          expectInlineTokens({
            md: '` a`',
            tokens: [
              { type: 'codespan', raw: '` a`', text: ' a' }
            ]
          });
        });

        it('end space only not stripped', () => {
          expectInlineTokens({
            md: '`a `',
            tokens: [
              { type: 'codespan', raw: '`a `', text: 'a ' }
            ]
          });
        });

        it('begin and end spaces are stripped', () => {
          expectInlineTokens({
            md: '` a `',
            tokens: [
              { type: 'codespan', raw: '` a `', text: 'a' }
            ]
          });
        });

        it('begin and end newlines are stripped', () => {
          expectInlineTokens({
            md: '`\na\n`',
            tokens: [
              { type: 'codespan', raw: '`\na\n`', text: 'a' }
            ]
          });
        });

        it('begin and end tabs are not stripped', () => {
          expectInlineTokens({
            md: '`\ta\t`',
            tokens: [
              { type: 'codespan', raw: '`\ta\t`', text: '\ta\t' }
            ]
          });
        });

        it('begin and end newlines', () => {
          expectInlineTokens({
            md: '`\na\n`',
            tokens: [
              { type: 'codespan', raw: '`\na\n`', text: 'a' }
            ]
          });
        });

        it('begin and end multiple spaces only one stripped', () => {
          expectInlineTokens({
            md: '`  a  `',
            tokens: [
              { type: 'codespan', raw: '`  a  `', text: ' a ' }
            ]
          });
        });

        it('newline to space', () => {
          expectInlineTokens({
            md: '`a\nb`',
            tokens: [
              { type: 'codespan', raw: '`a\nb`', text: 'a b' }
            ]
          });
        });
      });

      it('br', () => {
        expectInlineTokens({
          md: 'a\nb',
          options: { gfm: true, breaks: true },
          tokens: jasmine.arrayContaining([
            { type: 'br', raw: '\n' }
          ])
        });
      });

      it('del', () => {
        expectInlineTokens({
          md: '~~del~~',
          tokens: [
            {
              type: 'del',
              raw: '~~del~~',
              text: 'del',
              tokens: [
                { type: 'text', raw: 'del', text: 'del' }
              ]
            }
          ]
        });
      });

      describe('url', () => {
        it('autolink', () => {
          expectInlineTokens({
            md: '<https://example.com>',
            tokens: [
              {
                type: 'link',
                raw: '<https://example.com>',
                text: 'https://example.com',
                href: 'https://example.com',
                tokens: [
                  { type: 'text', raw: 'https://example.com', text: 'https://example.com' }
                ]
              }
            ]
          });
        });

        it('autolink email', () => {
          expectInlineTokens({
            md: '<test@example.com>',
            options: { mangle: false },
            tokens: [
              {
                type: 'link',
                raw: '<test@example.com>',
                text: 'test@example.com',
                href: 'mailto:test@example.com',
                tokens: [
                  { type: 'text', raw: 'test@example.com', text: 'test@example.com' }
                ]
              }
            ]
          });
        });

        it('autolink mangle email', () => {
          expectInlineTokens({
            md: '<test@example.com>',
            options: { mangle: true },
            tokens: [
              {
                type: 'link',
                raw: '<test@example.com>',
                text: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/),
                href: jasmine.stringMatching(/^mailto:(&#x?[0-9a-f]+;)+$/),
                tokens: [
                  {
                    type: 'text',
                    raw: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/),
                    text: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/)
                  }
                ]
              }
            ]
          });
        });

        it('url', () => {
          expectInlineTokens({
            md: 'https://example.com',
            tokens: [
              {
                type: 'link',
                raw: 'https://example.com',
                text: 'https://example.com',
                href: 'https://example.com',
                tokens: [
                  { type: 'text', raw: 'https://example.com', text: 'https://example.com' }
                ]
              }
            ]
          });
        });

        it('url email', () => {
          expectInlineTokens({
            md: 'test@example.com',
            options: { gfm: true, mangle: false },
            tokens: [
              {
                type: 'link',
                raw: 'test@example.com',
                text: 'test@example.com',
                href: 'mailto:test@example.com',
                tokens: [
                  { type: 'text', raw: 'test@example.com', text: 'test@example.com' }
                ]
              }
            ]
          });
        });

        it('url mangle email', () => {
          expectInlineTokens({
            md: 'test@example.com',
            options: { gfm: true, mangle: true },
            tokens: [
              {
                type: 'link',
                raw: 'test@example.com',
                text: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/),
                href: jasmine.stringMatching(/^mailto:(&#x?[0-9a-f]+;)+$/),
                tokens: [
                  {
                    type: 'text',
                    raw: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/),
                    text: jasmine.stringMatching(/^(&#x?[0-9a-f]+;)+$/)
                  }
                ]
              }
            ]
          });
        });
      });

      it('text', () => {
        expectInlineTokens({
          md: 'text',
          tokens: [
            {
              type: 'text',
              raw: 'text',
              text: 'text'
            }
          ]
        });
      });

      describe('smartypants', () => {
        it('single quotes', () => {
          expectInlineTokens({
            md: "'single quotes'",
            options: { smartypants: true },
            tokens: [
              {
                type: 'text',
                raw: "'single quotes'",
                text: '‘single quotes’'
              }
            ]
          });
        });

        it('double quotes', () => {
          expectInlineTokens({
            md: '"double quotes"',
            options: { smartypants: true },
            tokens: [
              {
                type: 'text',
                raw: '"double quotes"',
                text: '“double quotes”'
              }
            ]
          });
        });

        it('ellipses', () => {
          expectInlineTokens({
            md: 'ellipses...',
            options: { smartypants: true },
            tokens: [
              {
                type: 'text',
                raw: 'ellipses...',
                text: 'ellipses…'
              }
            ]
          });
        });

        it('en-dash', () => {
          expectInlineTokens({
            md: 'en--dash',
            options: { smartypants: true },
            tokens: [
              {
                type: 'text',
                raw: 'en--dash',
                text: 'en–dash'
              }
            ]
          });
        });

        it('em-dash', () => {
          expectInlineTokens({
            md: 'em---dash',
            options: { smartypants: true },
            tokens: [
              {
                type: 'text',
                raw: 'em---dash',
                text: 'em—dash'
              }
            ]
          });
        });
      });
    });
  });
});
