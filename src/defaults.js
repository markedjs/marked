function getDefaults() {
  return {
    breaks: false,
    gfm: true,
    pedantic: false,
    renderer: null,
    tokenizer: null,
    hooks: null,
    walkTokens: null
  };
}

function changeDefaults(newDefaults) {
  module.exports.defaults = newDefaults;
}

module.exports = {
  defaults: getDefaults(),
  getDefaults,
  changeDefaults
};
