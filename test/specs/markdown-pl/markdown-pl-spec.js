/**
 * Marked does not have a custom markdown specification. However, there are times
 * when we come across use cases that are not defined in a given specification.
 * Therefore, we will put use cases together to illustrate those instances to
 * consumers of marked.
 *
 */
var tester = require('../marked-tester.js');
var markedPlSpec = require('./markdown-pl.json');

var options = {
  gfm: false,
  pedantic: true
}

describe('Marked.pl', function() {
  var section = 'Emphasis and strong emphasis';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedPlSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, options);
  });
});

describe('Marked.pl', function() {
  var section = 'Link reference definitions';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedPlSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, options);
  });
});
