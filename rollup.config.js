const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');

module.exports = {
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.js',
    format: 'umd',
    name: 'marked'
  },
  plugins: [
    commonjs(),
    babel({
      presets: ['@babel/preset-env']
    })
  ]
};
