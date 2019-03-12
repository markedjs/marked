var specTests = require('../../');

it('should run spec tests', () => {
  // hide output
  spyOn(console, 'log');
  if (!specTests(['', '', '--stop'])) {
    // if tests fail rerun tests and show output
    console.log.and.callThrough();
    specTests([]);
    fail();
  }
});
