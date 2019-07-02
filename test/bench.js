const path = require('path');
const htmlDiffer = require('./helpers/html-differ.js');
const { loadFiles } = require('./helpers/load.js');

let marked = require('../');

/**
 * Load specs
 */
function load() {
  const dir = path.resolve(__dirname, './specs/commonmark');
  const sections = loadFiles(dir);
  let specs = [];

  for (const section in sections) {
    specs = specs.concat(sections[section].specs);
  }

  return specs;
}

/**
 * Run all benchmarks
 */
function runBench(options) {
  options = options || {};
  const specs = load();

  // Non-GFM, Non-pedantic
  marked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked', specs, marked);

  // GFM
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (gfm)', specs, marked);

  // Pedantic
  marked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: true,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (pedantic)', specs, marked);

  try {
    bench('commonmark', specs, (() => {
      const commonmark = require('commonmark');
      const parser = new commonmark.Parser();
      const writer = new commonmark.HtmlRenderer();
      return function(text) {
        return writer.render(parser.parse(text));
      };
    })());
  } catch (e) {
    console.error('Could not bench commonmark. (Error: %s)', e.message);
  }

  try {
    bench('markdown-it', specs, (() => {
      const MarkdownIt = require('markdown-it');
      const md = new MarkdownIt();
      return md.render.bind(md);
    })());
  } catch (e) {
    console.error('Could not bench markdown-it. (Error: %s)', e.message);
  }

  try {
    bench('markdown.js', specs, (() => {
      const md = require('markdown').markdown;
      return md.toHTML.bind(md);
    })());
  } catch (e) {
    console.error('Could not bench markdown.js. (Error: %s)', e.message);
  }
}

function bench(name, specs, engine) {
  const before = process.hrtime();
  for (let i = 0; i < 1e3; i++) {
    for (const spec of specs) {
      engine(spec.markdown);
    }
  }
  const elapsed = process.hrtime(before);
  const ms = prettyElapsedTime(elapsed).toFixed();

  const results = [];
  for (const spec of specs) {
    results.push({
      expected: spec.html,
      actual: engine(spec.markdown)
    });
  }
  const correct = results.reduce((num, result) => num + (htmlDiffer.isEqual(result.expected, result.actual) ? 1 : 0), 0);
  const percent = (correct / results.length * 100).toFixed(2);

  console.log('%s completed in %sms and passed %s%', name, ms, percent);
}

/**
 * A simple one-time benchmark
 */
function time(options) {
  options = options || {};
  const specs = load();
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked', specs, marked);
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

  const defaults = marked.getDefaults();

  while (argv.length) {
    const arg = getarg();
    switch (arg) {
      case '-t':
      case '--time':
        options.time = true;
        break;
      case '-m':
      case '--minified':
        options.minified = true;
        break;
      default:
        if (arg.indexOf('--') === 0) {
          const opt = camelize(arg.replace(/^--(no-)?/, ''));
          if (!defaults.hasOwnProperty(opt)) {
            continue;
          }
          options.marked = options.marked || {};
          if (arg.indexOf('--no-') === 0) {
            options.marked[opt] = typeof defaults[opt] !== 'boolean'
              ? null
              : false;
          } else {
            options.marked[opt] = typeof defaults[opt] !== 'boolean'
              ? argv.shift()
              : true;
          }
        } else {
          orphans.push(arg);
        }
        break;
    }
  }

  if (orphans.length > 0) {
    console.error();
    console.error('The following arguments are not used:');
    orphans.forEach(arg => console.error(`  ${arg}`));
    console.error();
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

  if (opt.minified) {
    marked = require('../marked.min.js');
  }

  if (opt.time) {
    time(opt);
  } else {
    runBench(opt);
  }
}

/**
 * returns time to millisecond granularity
 */
function prettyElapsedTime(hrtimeElapsed) {
  const seconds = hrtimeElapsed[0];
  const frac = Math.round(hrtimeElapsed[1] / 1e3) / 1e3;
  return seconds * 1e3 + frac;
}

if (!module.parent) {
  process.title = 'marked bench';
  main(process.argv.slice());
} else {
  exports = main;
  exports.main = main;
  exports.time = time;
  exports.runBench = runBench;
  exports.load = load;
  exports.bench = bench;
  module.exports = exports;
}
