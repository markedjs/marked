var specTests = require('../../');

it('should run spec tests', function () {
  // hide output
  function failed() {
    // if tests fail rerun tests and show output
    return specTests({failedOutput: true}).then(() => {
      fail();
    });
  }
  return specTests({stop: true, hideOutput: true}).then(passed => {
    if (!passed) {
      return failed();
    }
  }, failed);
}, 30 * 1000);
