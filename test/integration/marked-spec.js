var marked = require('../../marked.min.js');

describe('integration suite', function () {
  it('should put plaintext into a paragraph', function () {
    expect(marked('Hello World!')).toBe('<p>Hello World!</p>\n');
  });

  describe('inline html', function () {
    it('should permit inline html', function () {
      var inlineHtmlExamples = [{'md': '<div>foo</div>', 'html': '<div>foo</div>'},
                                {'md': '<div>outer <div>inner</div> </div>', 'html': '<div>outer <div>inner</div> </div>'},
                                {'md': '<!-- Comment -->', 'html': '<!-- Comment -->'},
                                {'md': '<!-- \nMultiline\nComment\n-->', 'html': '<!-- \nMultiline\nComment\n-->'},
                                {'md': '<hr>', 'html': '<hr>'},
                                {'md': '<hr/>', 'html': '<hr/>'},
                                {'md': '<hr/>', 'html': '<hr/>'},
                                {'md': '<hr />', 'html': '<hr />'},
                                {'md': '<hr class="foo" id="bar" />', 'html': '<hr class="foo" id="bar" />'},
                                {'md': '<hr class="foo" id="bar"/>', 'html': '<hr class="foo" id="bar"/>'},
                                {'md': '<hr class="foo" id="bar" >', 'html': '<hr class="foo" id="bar" >'},
                               ];

      inlineHtmlExamples.forEach(function(example) {
        expect(marked(example.md)).toBe(example.html);
      });

    });
  });

  describe('links inline style', function () {

    it('should handle regular links', function () {
      var descs = [{'text': 'simpleString',
                    'link': 'simpleString'},
                   {'text': 'string with spaces',
                    'link': 'http://github.com'},
                   {'text': 'string with \[backslash \] brackets',
                    'link': 'http://github.com'},
                   {'text': 'string with [inline brackets]',
                    'link': 'http://github.com'},
                   {'text': 'url has space',
                    'link': '/url has space'},
                   {'text': 'empty',
                    'link': ''},
                  ];
      descs.forEach(function(desc) {
        expect(marked(`[${desc.text}](${desc.link})`)).toBe(`<p><a href="${desc.link}">${desc.text}</a></p>\n`);
      });
    });

    it('should handle links with titles', function () {
      var descs = [{'text': 'simpleString',
                    'link': 'simpleString',
                    'title': 'simpleTitle',
                    'beforeTitle': ' ',
                    'afterTitle': ''},
                   {'text': 'url and title',
                    'link': 'simpleString',
                    'title': 'title preceded by two spaces',
                    'beforeTitle': '  ',
                    'afterTitle': ''},
                   {'text': 'url and title',
                    'link': 'simpleString',
                    'title': 'title preceded by a tab',
                    'beforeTitle': '	',
                    'afterTitle': ''},
                   {'text': 'url and title',
                    'link': 'simpleString',
                    'title': 'title has spaces afterward',
                    'beforeTitle': ' ',
                    'afterTitle': '  '},
                   {'text': 'url and title',
                    'link': '/url/has space/',
                    'title': 'url has space and title',
                    'beforeTitle': ' ',
                    'afterTitle': ''},
                  ];
      descs.forEach(function(desc) {
        expect(marked(`[${desc.text}](${desc.link}${desc.beforeTitle}"${desc.title}"${desc.afterTitle})`)).toBe(`<p><a href="${desc.link}" title="${desc.title}">${desc.text}</a></p>\n`);
      });
    });

  });
});
