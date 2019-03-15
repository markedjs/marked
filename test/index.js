#!/usr/bin/env node
'use strict';
// 'use strict' is here so we can use let and const in node 4

/**
 * marked tests
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * Modules
 */

const fs = require('fs');
const path = require('path');
const fm = require('front-matter');
const g2r = require('glob-to-regexp');
let marked = require('../');
const htmlDiffer = require('./helpers/html-differ.js');

/**
 * Load Tests
 */

function load(options) {
  options = options || {};
  const dir = path.join(__dirname, 'compiled_tests');
  const glob = g2r(options.glob || '*', { extended: true });

  const list = fs
    .readdirSync(dir)
    .filter(file => {
      return path.extname(file) === '.md';
    })
    .sort();

  const files = list.reduce((obj, item) => {
    const name = path.basename(item, '.md');
    if (glob.test(name)) {
      const file = path.join(dir, item);
      const content = fm(fs.readFileSync(file, 'utf8'));

      obj[name] = {
        options: content.attributes,
        text: content.body,
        html: fs.readFileSync(file.replace(/[^.]+$/, 'html'), 'utf8')
      };
    }
    return obj;
  }, {});

  if (options.bench || options.time) {
    if (!options.glob) {
      // Change certain tests to allow
      // comparison to older benchmark times.
      fs.readdirSync(path.join(__dirname, 'new')).forEach(name => {
        if (path.extname(name) === '.html') return;
        if (name === 'main.md') return;
        delete files[name];
      });
    }

    if (files['backslash_escapes.md']) {
      files['backslash_escapes.md'] = {
        text: 'hello world \\[how](are you) today'
      };
    }

    if (files['main.md']) {
      files['main.md'].text = files['main.md'].text.replace('* * *\n\n', '');
    }
  }

  return files;
}

/**
 * Test Runner
 */

function runTests(engine, options) {
  if (typeof engine !== 'function') {
    options = engine;
    engine = null;
  }

  engine = engine || marked;
  options = options || {};

  let succeeded = 0;
  let failed = 0;
  const files = options.files || load(options);
  const filenames = Object.keys(files);

  if (options.marked) {
    marked.setOptions(options.marked);
  }

  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const file = files[filename];

    const success = testFile(engine, file, filename, i + 1);

    if (success) {
      succeeded++;
    } else {
      failed++;
      if (options.stop) {
        break;
      }
    }
  }

  console.log('\n%d/%d tests completed successfully.', succeeded, filenames.length);
  if (failed) console.log('%d/%d tests failed.', failed, filenames.length);

  return !failed;
}

/**
 * Test a file
 */

function testFile(engine, file, filename, index) {
  const opts = Object.keys(file.options);

  if (marked._original) {
    marked.defaults = marked._original;
    delete marked._original;
  }

  console.log('#%d. Test %s', index, filename);

  if (opts.length) {
    marked._original = marked.defaults;
    marked.defaults = {};
    Object.keys(marked._original).forEach(key => {
      marked.defaults[key] = marked._original[key];
    });
    opts.forEach(key => {
      if (marked.defaults.hasOwnProperty(key)) {
        marked.defaults[key] = file.options[key];
      }
    });
  }

  const before = process.hrtime();

  let text, html, elapsed;
  try {
    text = engine(file.text);
    html = file.html;
  } catch (e) {
    elapsed = process.hrtime(before);
    console.log('\n    failed in %dms\n', prettyElapsedTime(elapsed));
    throw e;
  }

  elapsed = process.hrtime(before);

  if (htmlDiffer.isEqual(text, html)) {
    if (elapsed[0] > 0) {
      console.log('\n    failed because it took too long.\n\n    passed in %dms\n', prettyElapsedTime(elapsed));
      return false;
    }
    console.log('    passed in %dms', prettyElapsedTime(elapsed));
    return true;
  }

  const diff = htmlDiffer.firstDiff(text, html);

  console.log('\n    failed in %dms', prettyElapsedTime(elapsed));
  console.log('    Expected: %s', diff.expected);
  console.log('      Actual: %s\n', diff.actual);
  return false;
}

/**
 * Benchmark a function
 */

function bench(name, files, engine) {
  const start = Date.now();

  for (let i = 0; i < 1000; i++) {
    for (const filename in files) {
      engine(files[filename].text);
    }
  }

  const end = Date.now();

  console.log('%s completed in %dms.', name, end - start);
}

/**
 * Benchmark all engines
 */

function runBench(options) {
  options = options || {};
  const files = load(options);

  // Non-GFM, Non-pedantic
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked', files, marked);

  // GFM
  marked.setOptions({
    gfm: true,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (gfm)', files, marked);

  // Pedantic
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: true,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (pedantic)', files, marked);

  try {
    bench('commonmark', files, (() => {
      const commonmark = require('commonmark');
      const parser = new commonmark.Parser();
      const writer = new commonmark.HtmlRenderer();
      return function (text) {
        return writer.render(parser.parse(text));
      };
    })());
  } catch (e) {
    console.log('Could not bench commonmark. (Error: %s)', e.message);
  }

  try {
    bench('markdown-it', files, (() => {
      const MarkdownIt = require('markdown-it');
      const md = new MarkdownIt();
      return md.render.bind(md);
    })());
  } catch (e) {
    console.log('Could not bench markdown-it. (Error: %s)', e.message);
  }

  try {
    bench('markdown.js', files, (() => {
      const markdown = require('markdown').markdown;
      return markdown.toHTML.bind(markdown);
    })());
  } catch (e) {
    console.log('Could not bench markdown.js. (Error: %s)', e.message);
  }

  return true;
}

/**
 * A simple one-time benchmark
 */

function time(options) {
  options = options || {};
  const files = load(options);
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked', files, marked);

  return true;
}

/**
 * Markdown Test Suite Fixer
 *   This function is responsible for "fixing"
 *   the markdown test suite. There are
 *   certain aspects of the suite that
 *   are strange or might make tests
 *   fail for reasons unrelated to
 *   conformance.
 */

function fix() {
  ['compiled_tests', 'original', 'new', 'redos'].forEach(dir => {
    try {
      fs.mkdirSync(path.resolve(__dirname, dir));
    } catch (e) {
      // directory already exists
    }
  });

  // rm -rf tests
  fs.readdirSync(path.resolve(__dirname, 'compiled_tests')).forEach(file => {
    fs.unlinkSync(path.resolve(__dirname, 'compiled_tests', file));
  });

  // cp -r original tests
  fs.readdirSync(path.resolve(__dirname, 'original')).forEach(file => {
    let text = fs.readFileSync(path.resolve(__dirname, 'original', file), 'utf8');

    if (path.extname(file) === '.md') {
      if (fm.test(text)) {
        text = fm(text);
        text = `---\n${text.frontmatter}\ngfm: false\n---\n${text.body}`;
      } else {
        text = `---\ngfm: false\n---\n${text}`;
      }
    }

    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file), text);
  });

  // node fix.js
  const dir = path.join(__dirname, 'compiled_tests');

  fs.readdirSync(dir).filter(file => {
    return path.extname(file) === '.html';
  }).forEach(file => {
    file = path.join(dir, file);
    let html = fs.readFileSync(file, 'utf8');

    // fix unencoded quotes
    html = html
      .replace(/='([^\n']*)'(?=[^<>\n]*>)/g, '=&__APOS__;$1&__APOS__;')
      .replace(/="([^\n"]*)"(?=[^<>\n]*>)/g, '=&__QUOT__;$1&__QUOT__;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&__QUOT__;/g, '"')
      .replace(/&__APOS__;/g, '\'');

    fs.writeFileSync(file, html);
  });

  // turn <hr /> into <hr>
  fs.readdirSync(dir).forEach(file => {
    file = path.join(dir, file);
    let text = fs.readFileSync(file, 'utf8');

    text = text.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');

    fs.writeFileSync(file, text);
  });

  // markdown does some strange things.
  // it does not encode naked `>`, marked does.
  {
    const file = `${dir}/amps_and_angles_encoding.html`;
    const html = fs.readFileSync(file, 'utf8')
      .replace('6 > 5.', '6 &gt; 5.');

    fs.writeFileSync(file, html);
  }

  // cp new/* tests/
  fs.readdirSync(path.resolve(__dirname, 'new')).forEach(file => {
    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file),
      fs.readFileSync(path.resolve(__dirname, 'new', file)));
  });

  // cp redos/* tests/
  fs.readdirSync(path.resolve(__dirname, 'redos')).forEach(file => {
    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file),
      fs.readFileSync(path.resolve(__dirname, 'redos', file)));
  });
}

/**
 * Argument Parsing
 */

function parseArg(argv) {
  argv = argv.slice(2);

  const options = {};
  const orphans = [];

  function getarg() {
    let arg = argv.shift();

    if (arg.indexOf('--') === 0) {
      // e.g. --opt
      arg = arg.split('=');
      if (arg.length > 1) {
        // e.g. --opt=val
        argv.unshift(arg.slice(1).join('='));
      }
      arg = arg[0];
    } else if (arg[0] === '-') {
      if (arg.length > 2) {
        // e.g. -abc
        argv = arg.substring(1).split('').map(ch => {
          return `-${ch}`;
        }).concat(argv);
        arg = argv.shift();
      } else {
        // e.g. -a
      }
    } else {
      // e.g. foo
    }

    return arg;
  }

  while (argv.length) {
    let arg = getarg();
    switch (arg) {
      case '-f':
      case '--fix':
      case 'fix':
        if (options.fix !== false) {
          options.fix = true;
        }
        break;
      case '--no-fix':
      case 'no-fix':
        options.fix = false;
        break;
      case '-b':
      case '--bench':
        options.bench = true;
        break;
      case '-s':
      case '--stop':
        options.stop = true;
        break;
      case '-t':
      case '--time':
        options.time = true;
        break;
      case '-m':
      case '--minified':
        options.minified = true;
        break;
      case '--glob':
        arg = argv.shift();
        options.glob = arg.replace(/^=/, '');
        break;
      default:
        if (arg.indexOf('--') === 0) {
          const opt = camelize(arg.replace(/^--(no-)?/, ''));
          if (!marked.defaults.hasOwnProperty(opt)) {
            continue;
          }
          options.marked = options.marked || {};
          if (arg.indexOf('--no-') === 0) {
            options.marked[opt] = typeof marked.defaults[opt] !== 'boolean'
              ? null
              : false;
          } else {
            options.marked[opt] = typeof marked.defaults[opt] !== 'boolean'
              ? argv.shift()
              : true;
          }
        } else {
          orphans.push(arg);
        }
        break;
    }
  }

  return options;
}

/**
 * Helpers
 */

function camelize(text) {
  return text.replace(/(\w)-(\w)/g, (_, a, b) => a + b.toUpperCase());
}

/**
 * Main
 */

function main(argv) {
  const opt = parseArg(argv);

  if (opt.fix !== false) {
    fix();
  }

  if (opt.fix) {
    // only run fix
    return;
  }

  if (opt.bench) {
    return runBench(opt);
  }

  if (opt.time) {
    return time(opt);
  }

  if (opt.minified) {
    marked = require('../marked.min.js');
  }
  return runTests(opt);
}

/**
 * Execute
 */

if (!module.parent) {
  process.title = 'marked';
  process.exit(main(process.argv.slice()) ? 0 : 1);
} else {
  exports = main;
  exports.main = main;
  exports.runTests = runTests;
  exports.testFile = testFile;
  exports.runBench = runBench;
  exports.load = load;
  exports.bench = bench;
  module.exports = exports;
}

// returns time to millisecond granularity
function prettyElapsedTime(hrtimeElapsed) {
  const seconds = hrtimeElapsed[0];
  const frac = Math.round(hrtimeElapsed[1] / 1e3) / 1e3;
  return seconds * 1e3 + frac;
}
