import babel from 'rollup-plugin-babel';

export default {
  input: 'src/marked.js',
  output: {
    file: 'marked.min.js',
    format: 'umd',
    name: 'marked'
  },
  plugins: [babel()]
};
