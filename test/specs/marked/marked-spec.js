/**
 * Marked does not have a custom markdown specification. However, there are times
 * when we come across use cases that are not defined in a given specification.
 * Therefore, we will put use cases together to illustrate those instances to
 * consumers of marked.
 *
 */
var tester = require('../marked-tester.js');
var markedSpec = require('./marked.json');

describe('Marked Issues & PRs', function() {
  var section = 'Code spans';

  // var shouldPassButFails = [];
  var shouldPassButFails = [1];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, { gfm: false, pedantic: false });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Blockquotes';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, { gfm: false, pedantic: false });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Strikethrough';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethroughs
    tester.test(spec, section, ignore, { gfm: true, pedantic: false });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Emphasis and strong emphasis';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethrough example
    tester.test(spec, section, ignore, { gfm: false, pedantic: false });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Smart punctuation';

  // var shouldPassButFails = [];
  // TODO: Figure out why 5 & 6 fails. Visually seems correct.
  var shouldPassButFails = [5, 6];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethrough example
    tester.test(spec, section, ignore, { gfm: false, pedantic: false, smartypants: true });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Heading IDs';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethrough example
    tester.test(spec, section, ignore, { gfm: true, pedantic: false });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Relative paths';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethrough example
    tester.test(spec, section, ignore, { gfm: false, pedantic: false, baseUrl: "http://example.com/base/" });
  });
});

describe('Marked Issues & PRs', function() {
  var section = 'Sanitizer';

  // var shouldPassButFails = [];
  var shouldPassButFails = [];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  markedSpec.forEach(function(spec) {
    // GFM true required for strikethrough example
    tester.test(spec, section, ignore, { gfm: false, pedantic: false, sanitize: true });
  });
});
