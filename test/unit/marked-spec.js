var marked = require('../../lib/marked.js');
var Slugger = require('../../test/slugger.js');

describe('Test slugger ID functionality', function() {
  it('should add id attribute when slugger option defined', function() {
    var slugger = new Slugger();
    var html = marked('# One\n\n# Two', { slugger: slugger });
    expect(html).toBe('<h1 id="one">One</h1>\n<h1 id="two">Two</h1>\n');
  });

  it('should add id attribute w/count when slugger option defined', function() {
    var slugger = new Slugger();
    var html = marked('# head\n\n# head\n\n# head', { slugger: slugger });
    expect(html).toBe('<h1 id="head">head</h1>\n<h1 id="head-1">head</h1>\n<h1 id="head-2">head</h1>\n');
  });

  it('should NOT add ID attribute with defaults', function() {
    var renderer = new marked.Renderer(marked.defaults);
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
