import { Parser } from '../../lib/marked.esm.js';
import { htmlIsEqual, firstDiff } from '@markedjs/testutils';
import assert from 'node:assert';
import { describe, it } from 'node:test';

async function expectHtml({ tokens, options, html, inline }) {
  const parser = new Parser(options);
  const actual = parser[inline ? 'parseInline' : 'parse'](tokens);
  const testDiff = await firstDiff(actual, html);
  assert.ok(await htmlIsEqual(html, actual), `Expected: ${testDiff.expected}\n  Actual: ${testDiff.actual}`);
}

describe('Parser', () => {
  describe('block', () => {
    it('space between paragraphs', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'paragraph',
            text: 'paragraph 1',
            tokens: [{ type: 'text', text: 'paragraph 1' }]
          },
          { type: 'space' },
          {
            type: 'paragraph',
            text: 'paragraph 2',
            tokens: [{ type: 'text', text: 'paragraph 2' }]
          }
        ],
        html: '<p>paragraph 1</p><p>paragraph 2</p>'
      });
    });

    it('hr', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'hr'
          }
        ],
        html: '<hr />'
      });
    });

    it('heading', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'heading',
            depth: 1,
            text: 'heading',
            tokens: [{ type: 'text', text: 'heading' }]
          }
        ],
        html: '<h1>heading</h1>'
      });
    });

    it('code', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'code',
            text: 'code'
          }
        ],
        html: '<pre><code>code</code></pre>'
      });
    });

    it('table', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'table',
            align: ['left', 'right'],
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
        ],
        html: `
<table>
  <thead>
    <tr>
      <th align="left">a</th>
      <th align="right">b</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="left">1</td>
      <td align="right">2</td>
    </tr>
  </tbody>
</table>`
      });
    });

    it('blockquote', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'blockquote',
            tokens: [
              {
                type: 'paragraph',
                text: 'blockquote',
                tokens: [{ type: 'text', text: 'blockquote' }]
              }
            ]
          }
        ],
        html: '<blockquote><p>blockquote</p></blockquote>'
      });
    });

    describe('list', () => {
      it('unordered', async() => {
        await expectHtml({
          tokens: [
            {
              type: 'list',
              ordered: false,
              start: '',
              loose: false,
              items: [
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 1',
                      tokens: [{ type: 'text', text: 'item 1' }]
                    }
                  ]
                },
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 2',
                      tokens: [{ type: 'text', text: 'item 2' }]
                    }
                  ]
                }
              ]
            }
          ],
          html: `
<ul>
  <li>item 1</li>
  <li>item 2</li>
</ul>`
        });
      });

      it('ordered', async() => {
        await expectHtml({
          tokens: [
            {
              type: 'list',
              ordered: true,
              start: 2,
              loose: false,
              items: [
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 1',
                      tokens: [{ type: 'text', text: 'item 1' }]
                    }
                  ]
                },
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 2',
                      tokens: [{ type: 'text', text: 'item 2' }]
                    }
                  ]
                }
              ]
            }
          ],
          html: `
<ol start='2'>
  <li>item 1</li>
  <li>item 2</li>
</ol>`
        });
      });

      it('tasks', async() => {
        await expectHtml({
          tokens: [
            {
              type: 'list',
              ordered: false,
              start: '',
              loose: false,
              items: [
                {
                  task: true,
                  checked: false,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 1',
                      tokens: [{ type: 'text', text: 'item 1' }]
                    }
                  ]
                },
                {
                  task: true,
                  checked: true,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 2',
                      tokens: [{ type: 'text', text: 'item 2' }]
                    }
                  ]
                }
              ]
            }
          ],
          html: `
<ul>
  <li><input disabled type="checkbox"> item 1</li>
  <li><input checked disabled type="checkbox"> item 2</li>
</ul>`
        });
      });

      it('loose', async() => {
        await expectHtml({
          tokens: [
            {
              type: 'list',
              ordered: false,
              start: '',
              loose: true,
              items: [
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 1',
                      tokens: [{ type: 'text', text: 'item 1' }]
                    }
                  ]
                },
                {
                  task: false,
                  checked: undefined,
                  tokens: [
                    {
                      type: 'text',
                      text: 'item 2',
                      tokens: [{ type: 'text', text: 'item 2' }]
                    }
                  ]
                }
              ]
            }
          ],
          html: `
  <ul>
    <li><p>item 1</p></li>
    <li><p>item 2</p></li>
  </ul>`
        });
      });
    });

    it('html', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'html',
            text: '<div>html</div>'
          }
        ],
        html: '<div>html</div>'
      });
    });

    it('paragraph', async() => {
      await expectHtml({
        tokens: [
          {
            type: 'paragraph',
            text: 'paragraph 1',
            tokens: [{ type: 'text', text: 'paragraph 1' }]
          }
        ],
        html: '<p>paragraph 1</p>'
      });
    });

    it('text', async() => {
      await expectHtml({
        tokens: [
          { type: 'text', text: 'text 1' },
          { type: 'text', text: 'text 2' }
        ],
        html: '<p>text 1\ntext 2</p>'
      });
    });
  });

  describe('inline', () => {
    it('escape', async() => {
      await expectHtml({
        inline: true,
        tokens: [{ type: 'escape', text: '&gt;' }],
        html: '&gt;'
      });
    });

    it('html', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          { type: 'html', text: '<div>' },
          { type: 'text', text: 'html' },
          { type: 'html', text: '</div>' }
        ],
        html: '<div>html</div>'
      });
    });

    it('link', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'link',
            text: 'link',
            href: 'https://example.com',
            title: 'title',
            tokens: [{ type: 'text', text: 'link' }]
          }
        ],
        html: '<a href="https://example.com" title="title">link</a>'
      });
    });

    it('image', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'image',
            text: 'image',
            href: 'image.png',
            title: 'title'
          }
        ],
        html: '<img src="image.png" alt="image" title="title">'
      });
    });

    it('strong', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'strong',
            text: 'strong',
            tokens: [{ type: 'text', text: 'strong' }]
          }
        ],
        html: '<strong>strong</strong>'
      });
    });

    it('em', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'em',
            text: 'em',
            tokens: [{ type: 'text', text: 'em' }]
          }
        ],
        html: '<em>em</em>'
      });
    });

    it('codespan', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'codespan',
            text: 'code'
          }
        ],
        html: '<code>code</code>'
      });
    });

    it('br', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'br'
          }
        ],
        html: '<br />'
      });
    });

    it('del', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          {
            type: 'del',
            text: 'del',
            tokens: [{ type: 'text', text: 'del' }]
          }
        ],
        html: '<del>del</del>'
      });
    });

    it('text', async() => {
      await expectHtml({
        inline: true,
        tokens: [
          { type: 'text', text: 'text 1' },
          { type: 'text', text: 'text 2' }
        ],
        html: 'text 1text 2'
      });
    });
  });
});
