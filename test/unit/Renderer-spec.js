const Renderer = require('../../src/Renderer.js');

describe('Renderer', () => {
  describe('code', () => {
    it('should not escape highlighted code', () => {
      const renderer = new Renderer({
        highlight: (code) => `<span class="hljs-token">${code}</span>`
      });

      const actual = renderer.code('"value"');
      expect(actual).toEqual('<pre><code><span class="hljs-token">"value"</span></code></pre>\n');
    });

    it('should not escape highlighted code even if unchanged', () => {
      const renderer = new Renderer({
        highlight: (code) => code
      });

      const actual = renderer.code('"value"');
      expect(actual).toEqual('<pre><code>"value"</code></pre>\n');
    });

    it('should escape code if highlight function is not provided', () => {
      const renderer = new Renderer();

      const actual = renderer.code('"value"');
      expect(actual).toEqual('<pre><code>&quot;value&quot;</code></pre>\n');
    });

    it('should escape code if highlight function has returned null (highlight opt-out)', () => {
      const renderer = new Renderer({
        highlight: () => null
      });

      const actual = renderer.code('"value"');
      expect(actual).toEqual('<pre><code>&quot;value&quot;</code></pre>\n');
    });
  });
});
