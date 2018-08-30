var marked = require('../../lib/marked.js');

describe('Test heading ID functionality', function() {
  it('should add id attribute by default', function() {
    var renderer = new marked.Renderer(marked.defaults);
    var header = renderer.heading('test', 1, 'test');
    expect(header).toBe('<h1 id="test">test</h1>\n');
  });

  it('should NOT add id attribute when options set false', function() {
    var renderer = new marked.Renderer({ headerIds: false });
    var header = renderer.heading('test', 1, 'test');
    expect(header).toBe('<h1>test</h1>\n');
  });
});

describe('Test paragraph token type', function () {
  it('should use the "paragraph" type on top level', function () {
    const md = 'A Paragraph.\n\n> A blockquote\n\n- list item\n';

    const tokens = marked.lexer(md);

    expect(tokens[0].type).toBe('paragraph');
    expect(tokens[3].type).toBe('paragraph');
    expect(tokens[7].type).toBe('text');
  });
});
