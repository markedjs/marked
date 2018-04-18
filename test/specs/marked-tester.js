const marked = require('../../lib/marked.js');
const HtmlDiffer = require('html-differ').HtmlDiffer,
  htmlDiffer = new HtmlDiffer();
const since = require('jasmine2-custom-message');

const MarkedTester = module.exports = {};

MarkedTester.message = function(spec, ignore, expected, actual) {
  var spacer = '\n------\n\n';
  var title = 'CommonMark (' + spec.section + ')';
  var ignoreString = 'ignore: ' + ignore;
  var markdown = 'Markdown:\n\n' + spec.markdown;
  var html = 'Expected:\n\n' + expected;
  var marked = 'Marked:\n\n' + actual;

  return title + '\n' + ignoreString + '\n\n' + markdown + spacer + html + spacer + marked;
}

MarkedTester.test = function(spec, section, ignore, options) {
  if (spec.section === section) {
    var shouldFail = ~ignore.indexOf(spec.example);
    var example = spec.example;
    it('should ' + (shouldFail ? 'fail' : 'pass') + ' example ' + example, function() {
      var expected = spec.html;
      // TODO: Might be nice if JSON could set its own options
      var actual = marked(spec.markdown, options);
      since(MarkedTester.message(spec, ignore, expected, actual)).expect(
        htmlDiffer.isEqual(expected, actual)
      ).toEqual(!shouldFail);
    });
  }
}
