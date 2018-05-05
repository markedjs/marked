var marked = require('../../../lib/marked.js');
var gfmSpec = require('./gfm.0.28.json')
var HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer();
var since = require('jasmine2-custom-message');

var Messenger = function() {}

Messenger.prototype.message = function(spec, expected, actual) {
  return 'CommonMark (' + spec.section + '):\n' + spec.markdown + '\n------\n\nExpected:\n' + expected + '\n------\n\nMarked:\n' + actual;
}

Messenger.prototype.test = function(spec, section, ignore) {
  if (spec.section === section && ignore.indexOf(spec.example) < 0) {
    var shouldFail = ~ignore.indexOf(spec.example);
    it('should ' + (shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, function() {
      var expected = spec.html;
      var actual = marked(spec.markdown, { headerIds: false, xhtml: false });
      since(messenger.message(spec, expected, actual)).expect(
        htmlDiffer.isEqual(expected, actual)
      ).toEqual(!shouldFail);
    });
  }
}

var messenger = new Messenger();

describe('GFM 0.28 Tables', function() {
  var section = 'Tables';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('GFM 0.28 Task list items', function() {
  var section = 'Task list items';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('GFM 0.28 Strikethrough', function() {
  var section = 'Strikethrough';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('GFM 0.28 Autolinks', function() {
  var section = 'Autolinks';

  var shouldPassButFails = [607];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('GFM 0.28 Disallowed Raw HTML', function() {
  var section = 'Disallowed Raw HTML';

  var shouldPassButFails = [629];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});
