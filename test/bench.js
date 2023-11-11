import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { htmlIsEqual, getTests } from '@markedjs/testutils';

import { marked as cjsMarked } from '../lib/marked.cjs';
import { marked as esmMarked } from '../lib/marked.esm.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let marked;

/**
 * Load specs
 */
export async function load() {
  const dir = resolve(__dirname, './specs/commonmark');
  const sections = await getTests(dir);
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
  const specs = await load();
  const tests = {};

  // Non-GFM, Non-pedantic
  cjsMarked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: false
  });
  if (options.marked) {
    cjsMarked.setOptions(options.marked);
  }
  tests['cjs marked'] = cjsMarked.parse;

  esmMarked.setOptions({
    gfm: false,
    breaks: false,
    pedantic: false
  });
  if (options.marked) {
    esmMarked.setOptions(options.marked);
  }
  tests['esm marked'] = esmMarked.parse;

  try {
    tests.commonmark = await (async() => {
      const { Parser, HtmlRenderer } = await import('commonmark');
      const parser = new Parser();
      const writer = new HtmlRenderer();
      return function(text) {
        return writer.render(parser.parse(text));
      };
    })();
  } catch (e) {
    console.error('Could not bench commonmark. (Error: %s)', e.message);
  }

  try {
    tests['markdown-it'] = await (async() => {
      const MarkdownIt = (await import('markdown-it')).default;
      const md = new MarkdownIt();
      return md.render.bind(md);
    })();
  } catch (e) {
    console.error('Could not bench markdown-it. (Error: %s)', e.message);
  }

  await bench(tests, specs);
}

export async function bench(tests, specs) {
  const stats = {};
  for (const name in tests) {
    stats[name] = {
      elapsed: 0n,
      correct: 0
    };
  }

  console.log();
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    process.stdout.write(
      `${((i * 100) / specs.length).toFixed(1).padStart(5)}% ${i
        .toString()
        .padStart(specs.length.toString().length)} of ${specs.length}\r`
    );
    for (const name in tests) {
      const test = tests[name];
      const before = process.hrtime.bigint();
      for (let n = 0; n < 1e3; n++) {
        await test(spec.markdown);
      }
      const after = process.hrtime.bigint();
      stats[name].elapsed += after - before;
      stats[name].correct += (await htmlIsEqual(
        spec.html,
        await test(spec.markdown)
      ))
        ? 1
        : 0;
    }
  }

  for (const name in tests) {
    const ms = prettyElapsedTime(stats[name].elapsed);
    const percent = ((stats[name].correct / specs.length) * 100).toFixed(2);
    console.log(`${name} completed in ${ms}ms and passed ${percent}%`);
  }
}

/**
 * Argument Parsing
 */
function parseArg(argv) {
  argv = argv.slice(2);

  const options = {};
  const orphans = [];

  function getArg() {
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
        argv = arg
          .substring(1)
          .split('')
          .map((ch) => `-${ch}`)
          .concat(argv);
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
    const arg = getArg();
    if (arg.indexOf('--') === 0) {
      const opt = camelize(arg.replace(/^--(no-)?/, ''));
      if (!defaults.hasOwnProperty(opt)) {
        continue;
      }
      options.marked = options.marked || {};
      if (arg.indexOf('--no-') === 0) {
        options.marked[opt] = typeof defaults[opt] !== 'boolean' ? null : false;
      } else {
        options.marked[opt] =
          typeof defaults[opt] !== 'boolean' ? argv.shift() : true;
      }
    } else {
      orphans.push(arg);
    }
  }

  if (orphans.length > 0) {
    console.error();
    console.error('The following arguments are not used:');
    orphans.forEach((arg) => console.error(`  ${arg}`));
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
  marked = cjsMarked;

  const opt = parseArg(argv);

  await runBench(opt);
}

/**
 * returns time to millisecond granularity
 * @param hrtimeElapsed {bigint}
 */
function prettyElapsedTime(hrtimeElapsed) {
  return Number(hrtimeElapsed / 1_000_000n);
}

process.title = 'marked bench';
main(process.argv.slice());
