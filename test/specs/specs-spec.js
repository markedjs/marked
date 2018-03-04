var tests = require('../');

it('should run spec tests', function () {
  // hide output
  spyOn(console, 'log');
  if (!tests.runTests({stop: true})) {
    // if tests fail rerun tests and show output
    console.log.and.callThrough();
    tests.runTests();
    fail();
  }
});
