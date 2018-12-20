var marked = require('../../lib/marked.js');

describe('Test heading ID functionality', function() {
  it('should add id attribute by default', function() {
    var html = marked('# test');
    expect(html).toBe('<h1 id="test">test</h1>\n');
  });

  it('should add unique id for repeating heading 1280', function() {
    var html = marked('# test\n# test\n# test');
    expect(html).toBe('<h1 id="test">test</h1>\n<h1 id="test-1">test</h1>\n<h1 id="test-2">test</h1>\n');
  });

  it('should add id with non-latin chars', function() {
    var html = marked('# привет');
    expect(html).toBe('<h1 id="привет">привет</h1>\n');
  });

  it('should add id without ampersands 857', function() {
    var html = marked('# This & That Section');
    expect(html).toBe('<h1 id="this--that-section">This &amp; That Section</h1>\n');
  });

  it('should NOT add id attribute when options set false', function() {
    var options = { headerIds: false };
    var html = marked('# test', options);
    expect(html).toBe('<h1>test</h1>\n');
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
