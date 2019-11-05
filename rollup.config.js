module.exports = {
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.js',
    format: 'umd',
    name: 'marked'
  },
  plugins: [require('rollup-plugin-babel')({
    presets: ['@babel/preset-env']
  })]
};
