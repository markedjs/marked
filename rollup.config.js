const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const license = require('rollup-plugin-license');

module.exports = {
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.js',
    format: 'umd',
    name: 'marked'
  },
  plugins: [
    license({
      banner: `
marked - a markdown parser
Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
https://github.com/markedjs/marked
`
    }),
    commonjs(),
    babel({
      presets: ['@babel/preset-env']
    })
  ]
};
