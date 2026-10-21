import { marked, Marked, Renderer, Tokenizer, Hooks } from '../../lib/marked.esm.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Marked', () => {
  describe('extension errors', () => {
    const cases = [
      { name: 'a string', value: '<hook failed>', message: '<hook failed>', escapedMessage: '&lt;hook failed&gt;' },
      { name: 'a number', value: 42, message: '42' },
      { name: 'null', value: null, message: 'null' },
      { name: 'undefined', value: undefined, message: 'undefined' },
      { name: 'an object', value: {}, message: '[object Object]' },
      { name: 'an Error', value: new TypeError('hook failed'), message: 'hook failed' },
    ];
    const reportMessage = '\nPlease report this to https://github.com/markedjs/marked.';

    for (const async of [false, true]) {
      for (const method of ['parse', 'parseInline']) {
        for (const { name, value, message, escapedMessage = message } of cases) {
          for (const silent of [false, true]) {
            it(`should handle ${name} from ${async ? 'async' : 'sync'} ${method} with silent: ${silent}`, async() => {
              // Use fresh objects because Marked appends a report message to errors.
              const thrown = value instanceof Error
                ? new TypeError(message)
                : (value && typeof value === 'object' ? { ...value } : value);
              const parser = new Marked({
                async,
                hooks: {
                  preprocess() {
                    if (async) {
                      return Promise.reject(thrown);
                    }
                    throw thrown;
                  },
                },
              });

              if (silent) {
                const result = await parser[method]('hello', { silent });
                assert.strictEqual(result, `<p>An error occurred:</p><pre>${escapedMessage}${reportMessage}</pre>`);
              } else {
                const checkError = (error) => {
                  assert.ok(error instanceof Error);
                  assert.strictEqual(error.message, message + reportMessage);
                  if (thrown instanceof Error) {
                    assert.strictEqual(error, thrown);
                  }
                  return true;
                };
                if (async) {
                  await assert.rejects(parser[method]('hello'), checkError);
                } else {
                  assert.throws(() => parser[method]('hello'), checkError);
                }
              }
            });
          }
        }
      }
    }
  });

  it('should allow multiple instances', () => {
    const marked1 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked1';
        },
      },
    });

    const marked2 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        },
      },
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  it('should work with use', () => {
    const marked1 = new Marked();
    marked1.use({
      silent: true,
      renderer: {
        heading() {
          return 'im marked1';
        },
      },
    });

    const marked2 = new Marked();
    marked2.use({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        },
      },
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  it('should work with setOptions', () => {
    const marked1 = new Marked();
    const marked1Renderer = new Renderer();
    marked1Renderer.heading = () => 'im marked1';
    marked1.setOptions({
      silent: true,
      renderer: marked1Renderer,
    });

    const marked2 = new Marked();
    const marked2Renderer = new Renderer();
    marked2Renderer.heading = () => 'im marked2';
    marked2.setOptions({
      silent: true,
      renderer: marked2Renderer,
    });

    assert.strictEqual(marked1.parse('# header'), 'im marked1');
    assert.strictEqual(marked2.parse('# header'), 'im marked2');
    assert.strictEqual(marked.parse('# header'), '<h1>header</h1>\n');
  });

  it('should pass defaults to lexer and parser', () => {
    const marked1 = new Marked();
    marked1.use({
      renderer: {
        heading() {
          return 'test';
        },
      },
    });
    const tokens = marked1.lexer('# hi');
    const html = marked1.parser(tokens);

    assert.strictEqual(html, 'test');
  });

  describe('use class objects', () => {
    beforeEach(() => {
      marked.setOptions(marked.getDefaults());
    });

    it('allow new Renderer()', () => {
      const marked1 = new Marked();
      const newRenderer = new Renderer();
      newRenderer.heading = () => 'im marked renderer';

      marked1.use({ renderer: newRenderer });
      marked.use({ renderer: newRenderer });

      assert.strictEqual(marked1.parse('# header'), 'im marked renderer');
      assert.strictEqual(marked.parse('# header'), 'im marked renderer');
    });

    it('allow new Tokenizer()', () => {
      const marked1 = new Marked();
      const newTokenizer = new Tokenizer();
      newTokenizer.heading = function(src) {
        return {
          type: 'heading',
          raw: src,
          depth: 1,
          text: 'im marked tokenizer',
          tokens: this.lexer.inlineTokens('im marked tokenizer'),
        };
      };

      marked1.use({ tokenizer: newTokenizer });
      marked.use({ tokenizer: newTokenizer });

      assert.strictEqual(marked1.parse('# header'), '<h1>im marked tokenizer</h1>\n');
      assert.strictEqual(marked.parse('# header'), '<h1>im marked tokenizer</h1>\n');
    });

    it('allow new Hooks()', () => {
      const marked1 = new Marked();
      const newHooks = new Hooks();
      newHooks.preprocess = () => 'im marked hooks';

      marked1.use({ hooks: newHooks });
      marked.use({ hooks: newHooks });

      assert.strictEqual(marked1.parse('# header'), '<p>im marked hooks</p>\n');
      assert.strictEqual(marked.parse('# header'), '<p>im marked hooks</p>\n');
    });
  });
});
