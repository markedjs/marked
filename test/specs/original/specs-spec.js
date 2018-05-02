var specTests = require('../../');

it('should run spec tests', function () {
  // hide output
  spyOn(console, 'log');
  if (!specTests({stop: true})) {
    // if tests fail rerun tests and show output
    console.log.and.callThrough();
    specTests();
    fail();
  }
});
