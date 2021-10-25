import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { isEqual } from './helpers/html-differ.js';
import { loadFiles } from './helpers/load.js';

import { marked as esmMarked } from '../lib/marked.esm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let marked;

/**
 * Load specs
 */
export function load() {
  const dir = resolve(__dirname, './specs/commonmark');
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
export async function runBench(options) {
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
  await bench('cjs marked', specs, marked.parse);

  esmMarked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    esmMarked.setOptions(options.marked);
  }
  await bench('esm marked', specs, esmMarked.parse);

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
  await bench('cjs marked (gfm)', specs, marked.parse);

  esmMarked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    esmMarked.setOptions(options.marked);
  }
  await bench('esm marked (gfm)', specs, esmMarked.parse);

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
  await bench('cjs marked (pedantic)', specs, marked.parse);

  esmMarked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: true,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    esmMarked.setOptions(options.marked);
  }
  await bench('esm marked (pedantic)', specs, esmMarked.parse);

  try {
    await bench('commonmark', specs, (await (async() => {
      const { Parser, HtmlRenderer } = await import('commonmark');
      const parser = new Parser();
      const writer = new HtmlRenderer();
      return function(text) {
        return writer.render(parser.parse(text));
      };
    })()));
  } catch (e) {
    console.error('Could not bench commonmark. (Error: %s)', e.message);
  }

  try {
    await bench('markdown-it', specs, (await (async() => {
      const MarkdownIt = (await import('markdown-it')).default;
      const md = new MarkdownIt();
      return md.render.bind(md);
    })()));
  } catch (e) {
    console.error('Could not bench markdown-it. (Error: %s)', e.message);
  }
}

export async function bench(name, specs, engine) {
  const before = process.hrtime();
  for (let i = 0; i < 1e3; i++) {
    for (const spec of specs) {
      await engine(spec.markdown);
    }
  }
  const elapsed = process.hrtime(before);
  const ms = prettyElapsedTime(elapsed).toFixed();

  let correct = 0;
  for (const spec of specs) {
    if (await isEqual(spec.html, await engine(spec.markdown))) {
      correct++;
    }
  }
  const percent = (correct / specs.length * 100).toFixed(2);

  console.log('%s completed in %sms and passed %s%', name, ms, percent);
}

/**
 * A simple one-time benchmark
 */
export async function time(options) {
  options = options || {};
  const specs = load();
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  await bench('marked', specs, marked);
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
export default async function main(argv) {
  marked = (await import('../lib/marked.cjs')).marked;

  const opt = parseArg(argv);

  if (opt.minified) {
    marked = (await import('../marked.min.js')).marked;
  }

  if (opt.time) {
    await time(opt);
  } else {
    await runBench(opt);
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

process.title = 'marked bench';
main(process.argv.slice());
