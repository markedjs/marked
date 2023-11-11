import { marked, Marked, Renderer } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Marked', () => {
  it('should allow multiple instances', () => {
    const marked1 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked1';
        }
      }
    });

    const marked2 = new Marked({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        }
      }
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
        }
      }
    });

    const marked2 = new Marked();
    marked2.use({
      silent: true,
      renderer: {
        heading() {
          return 'im marked2';
        }
      }
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
      renderer: marked1Renderer
    });

    const marked2 = new Marked();
    const marked2Renderer = new Renderer();
    marked2Renderer.heading = () => 'im marked2';
    marked2.setOptions({
      silent: true,
      renderer: marked2Renderer
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
        }
      }
    });
    const tokens = marked1.lexer('# hi');
    const html = marked1.parser(tokens);

    assert.strictEqual(html, 'test');
  });
});
