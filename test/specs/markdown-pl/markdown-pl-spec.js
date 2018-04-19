/**
 * Marked does not have a custom markdown specification. However, there are times
 * when we come across use cases that are not defined in a given specification.
 * Therefore, we will put use cases together to illustrate those instances to
 * consumers of marked.
 *
 */
var tester = require('../marked-tester.js');
var markedPlSpec = require('./markdown-pl.json');

describe('Marked.pl', function() {
  var section = 'Emphasis and strong emphasis';

  // var shouldPassButFails = [];
  var shouldPassButFails = [1];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedPlSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, { gfm: false, pedantic: true });
  });
});
