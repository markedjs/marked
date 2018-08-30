/**
 * Marked does not have a custom markdown specification. However, there are times
 * when we come across use cases that are not defined in a given specification.
 * Therefore, we will put use cases together to illustrate those instances to
 * consumers of marked.
 *
 */
var marked = require('../../../lib/marked.js');
var markedSpec = require('./marked.json');
var HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer();
var since = require('jasmine2-custom-message');

var Messenger = function() {}

Messenger.prototype.message = function(spec, expected, actual) {
  return 'CommonMark (' + spec.section + '):\n' + spec.markdown + '\n------\n\nExpected:\n' + expected + '\n------\n\nMarked:\n' + actual;
}

Messenger.prototype.test = function(spec, section, ignore) {
  if (spec.section === section) {
    var shouldFail = ~ignore.indexOf(spec.example);
    it('should ' + (shouldFail ? 'fail' : 'pass') + ' example ' + spec.example, function() {
      var expected = spec.html;
      var actual = marked(spec.markdown, { headerIds: false, xhtml: true });
      since(messenger.message(spec, expected, actual)).expect(
        htmlDiffer.isEqual(expected, actual)
      ).toEqual(!shouldFail);
    });
  }
}

var messenger = new Messenger();

describe('Marked Autolinks', function() {
  var section = 'Autolinks';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('Marked Code spans', function() {
  var section = 'Code spans';

  var shouldPassButFails = [1];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('Marked Links', function() {
  var section = 'Links';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});

describe('Marked Table cells', function() {
  var section = 'Table cells';

  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    messenger.test(spec, section, ignore);
  });
});
