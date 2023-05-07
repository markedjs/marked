import { defineConfig } from 'tsup';
import fs from 'fs';

const pkg = JSON.parse(String(fs.readFileSync('./package.json')));
const version = process.env.SEMANTIC_RELEASE_NEXT_VERSION || pkg.version;

console.log('building version:', version);

const banner = `/**
 * marked v${version} - a markdown parser
 * Copyright (c) 2011-${new Date().getFullYear()}, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */
`;

export default defineConfig({
  entry: ['src/marked.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm', 'iife'],
  globalName: 'marked',
  banner: {
    js: banner
  },
  outDir: 'lib',
  outExtension({ format }) {
    if (format === 'cjs') {
      return {
        js: '.cjs'
      };
    } else if (format === 'iife') {
      return {
        js: '.umd.js'
      };
    }
    return {
      js: `.${format}.js`
    };
  },
  dts: true
});
