import { marked, Marked, Renderer } from '../../src/marked.js';

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

    expect(marked1.parse('# header')).toBe('im marked1');
    expect(marked2.parse('# header')).toBe('im marked2');
    expect(marked.parse('# header')).toBe('<h1 id="header">header</h1>\n');
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

    expect(marked1.parse('# header')).toBe('im marked1');
    expect(marked2.parse('# header')).toBe('im marked2');
    expect(marked.parse('# header')).toBe('<h1 id="header">header</h1>\n');
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

    expect(marked1.parse('# header')).toBe('im marked1');
    expect(marked2.parse('# header')).toBe('im marked2');
    expect(marked.parse('# header')).toBe('<h1 id="header">header</h1>\n');
  });
});
