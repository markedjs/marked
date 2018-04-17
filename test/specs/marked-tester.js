const marked = require('../../lib/marked.js');
const HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer();
const since = require('jasmine2-custom-message');

const MarkedTester = module.exports = {};

MarkedTester.message = function(spec, expected, actual) {
  return 'CommonMark (' + spec.section + '):\n' + spec.markdown + '\n------\n\nExpected:\n' + expected + '\n------\n\nMarked:\n' + actual;
}

MarkedTester.test = function(spec, section, ignore, options) {
  if (spec.section === section) {
    var shouldFail = ~ignore.indexOf(spec.example);
    it('should ' + (shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, function() {
      var expected = spec.html;
      var actual = marked(spec.markdown, options);
      since(MarkedTester.message(spec, expected, actual)).expect(
        htmlDiffer.isEqual(expected, actual)
      ).toEqual(!shouldFail);
    });
  }
}
