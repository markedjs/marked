const commonjs = require('rollup-plugin-commonjs');
const license = require('rollup-plugin-license');

module.exports = {
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.esm.js',
    format: 'esm'
  },
  plugins: [
    license({
      banner: `
marked - a markdown parser
Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
https://github.com/markedjs/marked
`
    }),
    commonjs()
  ]
};
