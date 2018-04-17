/**
 * Marked does not have a custom markdown specification. However, there are times
 * when we come across use cases that are not defined in a given specification.
 * Therefore, we will put use cases together to illustrate those instances to
 * consumers of marked.
 *
 */
var marked = require('../../../lib/marked.js');
var tester = require('../marked-tester.js');
var markedSpec = require('./marked.json');

describe('Marked Issues & PRs', function() {
  var section = 'Code spans';

  // var shouldPassButFails = [];
  var shouldPassButFails = [1218];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, { gfm: false, pedantic: false });
  });
});
