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
      { type: 'text', raw: text, text },
    ],
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
        },
      },
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
        },
      },
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
        },
      },
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
        },
      },
    });
    const html = await marked.parse('line1\nline2');
    assert.strictEqual(html.trim(), '<p>line1<br>line2</p>');
  });

  it('should postprocess html', () => {
    marked.use({
      hooks: {
        postprocess(html) {
          return html + '<h1>postprocess</h1>';
        },
      },
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
        },
      },
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
        },
      },
      walkTokens(token) {
        if (token.type === 'heading') {
          token.tokens[0].text += ' walked';
        }
        return token;
      },
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
        },
      },
      walkTokens(token) {
        if (token.type === 'heading') {
          token.tokens[0].text += ' walked';
        }
        return token;
      },
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
        },
      },
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
        },
      },
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

  it('should provide lexer', () => {
    marked.use({
      hooks: {
        provideLexer() {
          return (src) => [createHeadingToken(src)];
        },
      },
    });
    const html = marked.parse('text');
    assert.strictEqual(html.trim(), '<h1>text</h1>');
  });

  it('should provide lexer async', async() => {
    marked.use({
      async: true,
      hooks: {
        provideLexer() {
          return async(src) => {
            await timeout();
            return [createHeadingToken(src)];
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), '<h1>text</h1>');
  });

  it('should provide lexer async hook', async() => {
    marked.use({
      async: true,
      hooks: {
        async provideLexer() {
          await timeout();
          return (src) => {
            return [createHeadingToken(src)];
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), '<h1>text</h1>');
  });

  it('should provide async lexer from async hook', async() => {
    marked.use({
      async: true,
      hooks: {
        async provideLexer() {
          await timeout();
          return async(src) => {
            await timeout();
            return [createHeadingToken(src)];
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), '<h1>text</h1>');
  });

  it('should provide parser return object', () => {
    marked.use({
      hooks: {
        provideParser() {
          return (tokens) => ({ text: 'test parser' });
        },
      },
    });
    const html = marked.parse('text');
    assert.strictEqual(html.text, 'test parser');
  });

  it('should provide parser', () => {
    marked.use({
      hooks: {
        provideParser() {
          return (tokens) => 'test parser';
        },
      },
    });
    const html = marked.parse('text');
    assert.strictEqual(html.trim(), 'test parser');
  });

  it('should provide parser async', async() => {
    marked.use({
      async: true,
      hooks: {
        provideParser() {
          return async(tokens) => {
            await timeout();
            return 'test parser';
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), 'test parser');
  });

  it('should provide parser async hook', async() => {
    marked.use({
      async: true,
      hooks: {
        async provideParser() {
          await timeout();
          return (tokens) => {
            return 'test parser';
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), 'test parser');
  });

  it('should provide async parser from async hook', async() => {
    marked.use({
      async: true,
      hooks: {
        async provideParser() {
          await timeout();
          return async(tokens) => {
            await timeout();
            return 'test parser';
          };
        },
      },
    });
    const html = await marked.parse('text');
    assert.strictEqual(html.trim(), 'test parser');
  });

  it('should not have race condition when parse and parseInline are called concurrently with async hooks', async() => {
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          return markdown;
        },
      },
    });
    const [blockHtml, inlineHtml] = await Promise.all([
      marked.parse('**text**'),
      marked.parseInline('**text**'),
    ]);
    assert.strictEqual(blockHtml.trim(), '<p><strong>text</strong></p>');
    assert.strictEqual(inlineHtml.trim(), '<strong>text</strong>');
  });

  it('should not have race condition with multiple concurrent parse calls', async() => {
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          return markdown;
        },
      },
    });
    const [html1, html2, html3] = await Promise.all([
      marked.parse('**bold**'),
      marked.parseInline('**bold**'),
      marked.parse('*italic*'),
    ]);
    assert.strictEqual(html1.trim(), '<p><strong>bold</strong></p>');
    assert.strictEqual(html2.trim(), '<strong>bold</strong>');
    assert.strictEqual(html3.trim(), '<p><em>italic</em></p>');
  });

  it('should pass block=true to provideLexer when called from parse', () => {
    let receivedBlock;
    marked.use({
      hooks: {
        provideLexer(block) {
          receivedBlock = block;
          return () => [];
        },
      },
    });
    marked.parse('text');
    assert.strictEqual(receivedBlock, true);
  });

  it('should pass block=false to provideLexer when called from parseInline', () => {
    let receivedBlock;
    marked.use({
      hooks: {
        provideLexer(block) {
          receivedBlock = block;
          return () => [];
        },
      },
    });
    marked.parseInline('text');
    assert.strictEqual(receivedBlock, false);
  });

  it('should pass correct block to provideLexer for concurrent async parse and parseInline', async() => {
    const receivedBlocks = [];
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          return markdown;
        },
        provideLexer(block) {
          receivedBlocks.push(block);
          return () => [];
        },
      },
    });
    await Promise.all([
      marked.parse('text'),
      marked.parseInline('text'),
    ]);
    assert.deepStrictEqual(receivedBlocks.slice().sort(), [false, true]);
  });

  it('should pass block=true to provideParser when called from parse', () => {
    let receivedBlock;
    marked.use({
      hooks: {
        provideParser(block) {
          receivedBlock = block;
          return () => '';
        },
      },
    });
    marked.parse('text');
    assert.strictEqual(receivedBlock, true);
  });

  it('should pass block=false to provideParser when called from parseInline', () => {
    let receivedBlock;
    marked.use({
      hooks: {
        provideParser(block) {
          receivedBlock = block;
          return () => '';
        },
      },
    });
    marked.parseInline('text');
    assert.strictEqual(receivedBlock, false);
  });

  it('should pass correct block to provideParser for concurrent async parse and parseInline', async() => {
    const receivedBlocks = [];
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          return markdown;
        },
        provideParser(block) {
          receivedBlocks.push(block);
          return () => '';
        },
      },
    });
    await Promise.all([
      marked.parse('text'),
      marked.parseInline('text'),
    ]);
    assert.deepStrictEqual(receivedBlocks.slice().sort(), [false, true]);
  });

  it('should maintain this.block backwards compatibility in provideLexer for parse', () => {
    let blockFromThis;
    marked.use({
      hooks: {
        provideLexer() {
          blockFromThis = this.block;
          return () => [];
        },
      },
    });
    marked.parse('text');
    assert.strictEqual(blockFromThis, true);
  });

  it('should maintain this.block backwards compatibility in provideLexer for parseInline', () => {
    let blockFromThis;
    marked.use({
      hooks: {
        provideLexer() {
          blockFromThis = this.block;
          return () => [];
        },
      },
    });
    marked.parseInline('text');
    assert.strictEqual(blockFromThis, false);
  });

  it('should maintain this.block backwards compatibility in provideParser for parse', () => {
    let blockFromThis;
    marked.use({
      hooks: {
        provideParser() {
          blockFromThis = this.block;
          return () => '';
        },
      },
    });
    marked.parse('text');
    assert.strictEqual(blockFromThis, true);
  });

  it('should maintain this.block backwards compatibility in provideParser for parseInline', () => {
    let blockFromThis;
    marked.use({
      hooks: {
        provideParser() {
          blockFromThis = this.block;
          return () => '';
        },
      },
    });
    marked.parseInline('text');
    assert.strictEqual(blockFromThis, false);
  });
});
