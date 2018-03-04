var marked = require('../../marked.min.js');

describe('integration suite', function () {
  it('should put plaintext into a paragraph', function () {
    expect(marked('Hello World!')).toBe('<p>Hello World!</p>\n');
  });

  describe('inline html', function () {
    it('should permit inline html', function () {
      var samples = [{'md': '<div>foo</div>',                     'html': '<div>foo</div>'},
                     {'md': '<div>outer <div>inner</div> </div>', 'html': '<div>outer <div>inner</div> </div>'},
                     {'md': '<!-- Comment -->',                   'html': '<!-- Comment -->'},
                     {'md': '<!-- \nMultiline\nComment\n-->',     'html': '<!-- \nMultiline\nComment\n-->'},
                     {'md': '<hr>',                               'html': '<hr>'},
                     {'md': '<hr/>',                              'html': '<hr/>'},
                     {'md': '<hr/>',                              'html': '<hr/>'},
                     {'md': '<hr />',                             'html': '<hr />'},
                     {'md': '<hr class="foo" id="bar" />',        'html': '<hr class="foo" id="bar" />'},
                     {'md': '<hr class="foo" id="bar"/>',         'html': '<hr class="foo" id="bar"/>'},
                     {'md': '<hr class="foo" id="bar" >',         'html': '<hr class="foo" id="bar" >'},
                    ];

      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });

    });
  }); // inline html

  describe('links inline style', function () {

    it('should handle regular links', function () {
      var samples = [{'md': '[simpleString](url)',                        'html': '<p><a href="url">simpleString</a></p>\n'},
                     {'md': '[text with spaces](http://github.com)',      'html': '<p><a href="http://github.com">text with spaces</a></p>\n'},
                     {'md': '[text with \\[backslash \\] brackets](url)', 'html': '<p><a href="url">text with [backslash ] brackets</a></p>\n'},
                     {'md': '[text with [inline brackets]](url)',         'html': '<p><a href="url">text with [inline brackets]</a></p>\n'},
                     {'md': '[text](url has space)',                      'html': '<p><a href="url has space">text</a></p>\n'},
                    ];
      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });
    });

    it('should handle links with titles', function () {
      var samples = [{'md': '[text](url "title")',                             'html': '<p><a href="url" title="title">text</a></p>\n'},
                     {'md': '[text](url  "2 leading spaces")',                 'html': '<p><a href="url" title="2 leading spaces">text</a></p>\n'},
                     {'md': '[text](/foo/	"leading tab")',                     'html': '<p><a href="/foo/" title="leading tab">text</a></p>\n'},
                     {'md': '[text](http://github.com "2 trailing spaces"  )', 'html': '<p><a href="http://github.com" title="2 trailing spaces">text</a></p>\n'},
                     {'md': '[text](/url has/ space/ "title")',                'html': '<p><a href="/url has/ space/" title="title">text</a></p>\n'},
                    ];
      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });
    });

  }); // links inline style

  describe('auto links', function () {
    it('should handle auto-linking', function() {
      var samples = [
                     // Auto-linking.
                     {'md': 'Link: <http://example.com/>.',  'html': '<p>Link: <a href="http://example.com/">http://example.com/</a>.</p>\n'},
                     {'md': 'With an ampersand: <http://example.com/?foo=1&bar=2>',  'html': '<p>With an ampersand: <a href="http://example.com/?foo=1&amp;bar=2">http://example.com/?foo=1&amp;bar=2</a></p>\n'},
                     {'md': '* In a list?\n' +
                            '* <http://example.com/>\n' +
                            '* It should.\n',
                      'html': '<ul>\n' +
                              '<li>In a list?</li>\n' +
                              '<li><a href="http://example.com/">http://example.com/</a></li>\n' +
                              '<li>It should.</li>\n' +
                              '</ul>\n'

                     },
                     {'md': '> Blockquoted: <http://example.com/>',
                      'html': '<blockquote>\n' + 
                              '<p>Blockquoted: <a href="http://example.com/">http://example.com/</a></p>\n' +
                              '</blockquote>\n'
                     },
                    ];
      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });
    });

    it('should not auto-link when indented', function() {
      var samples = [{'md': '	indented: <http://example.com/>',
                      'html': '<pre><code>indented: &lt;http://example.com/&gt;\n' +
                              '</code></pre>' // TODO Why doesn't this end in a newline?
                     },
                    ];
      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });
    });

    it('should not auto-link in code', function() {
      var samples = [{'md': 'Code: `<http://example.com/>`', 'html': '<p>Code: <code>&lt;http://example.com/&gt;</code></p>\n'},
                    ];
      samples.forEach(function(sample) {
        expect(marked(sample.md)).toBe(sample.html);
      });
    });

  }); // auto links
});
