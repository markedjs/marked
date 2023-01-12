import babel from '@rollup/plugin-babel';
import { defineConfig } from 'rollup';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

const banner = `/**
 * marked ${process.env.SEMANTIC_RELEASE_NEXT_VERSION || pkg.version} - a markdown parser
 * Copyright (c) 2011-${new Date().getFullYear()}, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */
`;

export default defineConfig([{
  input: 'src/marked.js',
  output: {
    file: 'lib/marked.esm.js',
    format: 'esm',
    banner
  }
},
{
  input: 'src/marked.js',
  output: [{
    file: 'lib/marked.umd.js',
    format: 'umd',
    name: 'marked',
    banner
  },
  {
    file: 'lib/marked.cjs',
    format: 'cjs',
    name: 'marked',
    banner
  }],
  plugins: [
    babel({
      presets: [['@babel/preset-env', { loose: true }]]
    })
  ]
}]);
