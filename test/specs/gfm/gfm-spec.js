var tester = require('../marked-tester.js');
var gfmSpec = require('./gfm.0.28.json')

var testOptions = {
  gfm: true,
  pedantic: false,
  tables: true,
  headerIds: false,
  xhtml: true
}

describe('GFM 0.28 Tables', function() {
  var section = 'Tables';

  // TODO: Verify exmaple 193 is valid and passing
  // var shouldPassButFails = [];
  var shouldPassButFails = [192, 193, 195, 196, 197];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, testOptions);
  });
});

describe('GFM 0.28 Task list items', function() {
  var section = 'Task list items';

  var shouldPassButFails = [272, 273];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, testOptions);
  });
});

describe('GFM 0.28 Strikethrough', function() {
  var section = 'Strikethrough';

  var shouldPassButFails = [469, 470];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, testOptions);
  });
});

describe('GFM 0.28 Autolinks', function() {
  var section = 'Autolinks';

  var shouldPassButFails = [607];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, testOptions);
  });
});

describe('GFM 0.28 Disallowed Raw HTML', function() {
  var section = 'Disallowed Raw HTML';

  var shouldPassButFails = [629];

  var willNotBeAttemptedByCoreTeam = [];

  var ignore = shouldPassButFails.concat(willNotBeAttemptedByCoreTeam);

  gfmSpec.forEach(function(spec) {
    tester.test(spec, section, ignore, testOptions);
  });
});
