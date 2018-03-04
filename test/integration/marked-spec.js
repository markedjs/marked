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
  });

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

  });
});
