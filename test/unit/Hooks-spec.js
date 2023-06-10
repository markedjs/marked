import { marked } from '../../src/marked.js';
import { timeout } from './utils.js';

describe('Hooks', () => {
  it('should preprocess markdown', () => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          return `# preprocess\n\n${markdown}`;
        }
      }
    });
    const html = marked('*text*');
    expect(html.trim()).toBe('<h1 id="preprocess">preprocess</h1>\n<p><em>text</em></p>');
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
    const promise = marked('*text*');
    expect(promise).toBeInstanceOf(Promise);
    const html = await promise;
    expect(html.trim()).toBe('<h1 id="preprocess-async">preprocess async</h1>\n<p><em>text</em></p>');
  });

  it('should preprocess options', () => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          this.options.headerIds = false;
          return markdown;
        }
      }
    });
    const html = marked('# test');
    expect(html.trim()).toBe('<h1>test</h1>');
  });

  it('should preprocess options async', async() => {
    marked.use({
      async: true,
      hooks: {
        async preprocess(markdown) {
          await timeout();
          this.options.headerIds = false;
          return markdown;
        }
      }
    });
    const html = await marked('# test');
    expect(html.trim()).toBe('<h1>test</h1>');
  });

  it('should postprocess html', () => {
    marked.use({
      hooks: {
        postprocess(html) {
          return html + '<h1>postprocess</h1>';
        }
      }
    });
    const html = marked('*text*');
    expect(html.trim()).toBe('<p><em>text</em></p>\n<h1>postprocess</h1>');
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
    const promise = marked('*text*');
    expect(promise).toBeInstanceOf(Promise);
    const html = await promise;
    expect(html.trim()).toBe('<p><em>text</em></p>\n<h1>postprocess async</h1>');
  });

  it('should process all hooks in reverse', async() => {
    marked.use({
      hooks: {
        preprocess(markdown) {
          return `# preprocess1\n\n${markdown}`;
        },
        postprocess(html) {
          return html + '<h1>postprocess1</h1>\n';
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
        }
      }
    });
    const promise = marked('*text*');
    expect(promise).toBeInstanceOf(Promise);
    const html = await promise;
    expect(html.trim()).toBe('<h1 id="preprocess1">preprocess1</h1>\n<h1 id="preprocess2">preprocess2</h1>\n<p><em>text</em></p>\n<h1>postprocess2 async</h1>\n<h1>postprocess1</h1>');
  });
});
