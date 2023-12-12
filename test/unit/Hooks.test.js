import { Marked } from '../../lib/marked.esm.js';
import { timeout } from './utils.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

function createHeadingToken(text) {
  return {
    type: 'heading',
    raw: `# ${text}`,
    depth: 1,
    text,
    tokens: [
      { type: 'text', raw: text, text }
    ]
  };
}

describe('Hooks', () => {
  let marked;
  beforeEach(() => {
    marked = new Marked();
  });

  it('should preprocess markdown', () => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          return `# preprocess\n\n${markdown}`;
        }
      }
    });
    const html = marked.parse('*text*');
    assert.strictEqual(html.trim(), '<h1>preprocess</h1>\n<p><em>text</em></p>');
  });

  it('should preprocess async', async() => {
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          return `# preprocess async\n\n${markdown}`;
        }
      }
    });
    const promise = marked.parse('*text*');
    assert.ok(promise instanceof Promise);
    const html = await promise;
    assert.strictEqual(html.trim(), '<h1>preprocess async</h1>\n<p><em>text</em></p>');
  });

  it('should preprocess options', () => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          this.options.breaks = true;
          return markdown;
        }
      }
    });
    const html = marked.parse('line1\nline2');
    assert.strictEqual(html.trim(), '<p>line1<br>line2</p>');
  });

  it('should preprocess options async', async() => {
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          this.options.breaks = true;
          return markdown;
        }
      }
    });
    const html = await marked.parse('line1\nline2');
    assert.strictEqual(html.trim(), '<p>line1<br>line2</p>');
  });

  it('should postprocess html', () => {
    marked.use({
      hooks: {
        postprocess(html) {
          return html + '<h1>postprocess</h1>';
        }
      }
    });
    const html = marked.parse('*text*');
    assert.strictEqual(html.trim(), '<p><em>text</em></p>\n<h1>postprocess</h1>');
  });

  it('should postprocess async', async() => {
    marked.use({
      async: true,
      hooks: {
        async postprocess(html) {
          await timeout();
          return html + '<h1>postprocess async</h1>\n';
        }
      }
    });
    const promise = marked.parse('*text*');
    assert.ok(promise instanceof Promise);
    const html = await promise;
    assert.strictEqual(html.trim(), '<p><em>text</em></p>\n<h1>postprocess async</h1>');
  });

  it('should process tokens before walkTokens', () => {
    marked.use({
      hooks: {
        processAllTokens(tokens) {
          tokens.push(createHeadingToken('processAllTokens'));
          return tokens;
        }
      },
      walkTokens(token) {
        if (token.type === 'heading') {
          token.tokens[0].text += ' walked';
        }
        return token;
      }
    });
    const html = marked.parse('*text*');
    assert.strictEqual(html.trim(), '<p><em>text</em></p>\n<h1>processAllTokens walked</h1>');
  });

  it('should process tokens async before walkTokens', async() => {
    marked.use({
      async: true,
      hooks: {
        async processAllTokens(tokens) {
          await timeout();
          tokens.push(createHeadingToken('processAllTokens async'));
          return tokens;
        }
      },
      walkTokens(token) {
        if (token.type === 'heading') {
          token.tokens[0].text += ' walked';
        }
        return token;
      }
    });
    const promise = marked.parse('*text*');
    assert.ok(promise instanceof Promise);
    const html = await promise;
    assert.strictEqual(html.trim(), '<p><em>text</em></p>\n<h1>processAllTokens async walked</h1>');
  });

  it('should process all hooks in reverse', async() => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          return `# preprocess1\n\n${markdown}`;
        },
        postprocess(html) {
          return html + '<h1>postprocess1</h1>\n';
        },
        processAllTokens(tokens) {
          tokens.push(createHeadingToken('processAllTokens1'));
          return tokens;
        }
      }
    });
    marked.use({
      async: true,
      hooks: {
        preprocess(markdown) {
          return `# preprocess2\n\n${markdown}`;
        },
        async postprocess(html) {
          await timeout();
          return html + '<h1>postprocess2 async</h1>\n';
        },
        processAllTokens(tokens) {
          tokens.push(createHeadingToken('processAllTokens2'));
          return tokens;
        }
      }
    });
    const promise = marked.parse('*text*');
    assert.ok(promise instanceof Promise);
    const html = await promise;
    assert.strictEqual(html.trim(), `\
<h1>preprocess1</h1>
<h1>preprocess2</h1>
<p><em>text</em></p>
<h1>processAllTokens2</h1>
<h1>processAllTokens1</h1>
<h1>postprocess2 async</h1>
<h1>postprocess1</h1>`);
  });
});
