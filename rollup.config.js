const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel').default;
const license = require('rollup-plugin-license');

module.exports = [{
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.umd.js',
    format: 'umd',
    name: 'marked'
  },
  plugins: [
    license({
      banner: `
DO NOT EDIT THIS FILE
The code in this file is generated from files in ./src/
`
    }),
    license({
      banner: `
marked - a markdown parser
Copyright (c) 2011-${new Date().getFullYear()}, Christopher Jeffrey. (MIT Licensed)
https://github.com/markedjs/marked
`
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/preset-env', { loose: true }]]
    })
  ]
},
{
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.cjs',
    format: 'cjs',
    name: 'marked'
  },
  plugins: [
    license({
      banner: `
DO NOT EDIT THIS FILE
The code in this file is generated from files in ./src/
`
    }),
    license({
      banner: `
marked - a markdown parser
Copyright (c) 2011-${new Date().getFullYear()}, Christopher Jeffrey. (MIT Licensed)
https://github.com/markedjs/marked
`
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/preset-env', { loose: true }]]
    })
  ]
}];
