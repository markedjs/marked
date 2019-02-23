#!/usr/bin/env node

/**
 * marked tests
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * Modules
 */

var fs = require('fs'),
    path = require('path'),
    fm = require('front-matter'),
    g2r = require('glob-to-regexp'),
    marked = require('../'),
    usingWorker = false;

/**
 * Load Tests
 */

function load(options) {
  options = options || {};
  var dir = path.join(__dirname, 'compiled_tests'),
      files = {},
      list,
      file,
      name,
      content,
      glob = g2r(options.glob || '*', { extended: true }),
      i,
      l;

  list = fs
    .readdirSync(dir)
    .filter(function(file) {
      return path.extname(file) === '.md';
    })
    .sort();

  l = list.length;

  for (i = 0; i < l; i++) {
    name = path.basename(list[i], '.md');
    if (glob.test(name)) {
      file = path.join(dir, list[i]);
      content = fm(fs.readFileSync(file, 'utf8'));

      files[name] = {
        options: content.attributes,
        text: content.body,
        html: fs.readFileSync(file.replace(/[^.]+$/, 'html'), 'utf8')
      };
    }
  }

  if (options.bench || options.time) {
    if (!options.glob) {
      // Change certain tests to allow
      // comparison to older benchmark times.
      fs.readdirSync(path.join(__dirname, 'new')).forEach(function(name) {
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

  if (!engine) {
    try {
      engine = require('./worker.js');
      usingWorker = true;
    } catch (ex) {
      engine = marked;
    }
  }
  options = options || {};
  var succeeded = 0,
      failed = 0,
      files = options.files || load(options),
      filenames = Object.keys(files);

  return Promise.all(filenames.map((filename, i) => {
    return testFile(engine, files[filename], filename, i + 1, options)
      .then(success => {
        if (success) {
          succeeded++;
        } else {
          failed++;
          if (options.stop) {
            // eslint-disable-next-line no-throw-literal
            throw 'stop';
          }
        }
      }, () => {
        failed++;
        if (options.stop) {
          // eslint-disable-next-line no-throw-literal
          throw 'stop';
        }
      });
  })).catch(() => {})
    .then(() => {
      if (!options.hideOutput) {
        console.log('%d/%d tests completed successfully.', succeeded, filenames.length);
        if (failed) console.log('%d/%d tests failed.', failed, filenames.length);
      }

      return !failed;
    });
}

/**
 * Test a file
 */

function testFile(engine, file, filename, index, options) {
  var before,
      elapsed,
      opts,
      promise;

  marked.defaults = marked.getDefaults();
  opts = Object.assign({}, options.marked, file.options);

  if (usingWorker) {
    promise = engine(file.text, opts).then(text => {
      elapsed = text[1];
      return text[0];
    }, err => {
      elapsed = err[1];
      return Promise.reject(err[0]);
    });
  } else {
    before = process.hrtime();
    try {
      var text = engine(file.text, opts);
      elapsed = process.hrtime(before);
      promise = Promise.resolve(text);
    } catch (err) {
      elapsed = process.hrtime(before);
      promise = Promise.reject(err);
    }
  }
  return promise
    .then(text => {
      var html,
          j,
          l;

      text = text.replace(/\s/g, '');
      html = file.html.replace(/\s/g, '');

      l = html.length;

      for (j = 0; j < l; j++) {
        if (text[j] !== html[j]) {
          text = text.substring(
            Math.max(j - 30, 0),
            Math.min(j + 30, text.length));

          html = html.substring(
            Math.max(j - 30, 0),
            Math.min(j + 30, l));

          if (!options.hideOutput) {
            console.log('#%d. Test %s', index, filename);
            console.log('    failed in %dms at offset %d. Near: "%s".\n', prettyElapsedTime(elapsed), j, text);

            console.log('\nGot:\n%s\n', text.trim() || text);
            console.log('\nExpected:\n%s\n', html.trim() || html);
          }

          return false;
        }
      }

      if (elapsed[0] > 0) {
        if (!options.hideOutput) {
          console.log('#%d. Test %s', index, filename);
          console.log('    failed because it took too long.\n\n    passed in %dms', prettyElapsedTime(elapsed));
        }
        return false;
      }

      if (!options.failedOutput && !options.hideOutput) {
        console.log('#%d. Test %s', index, filename);
        console.log('    passed in %dms', prettyElapsedTime(elapsed));
      }
      return true;
    }, err => {
      if (!options.hideOutput) {
        console.log('#%d. Test %s', index, filename);
        console.log('    failed in %dms\n\n    %s', prettyElapsedTime(elapsed), err.message || err);
      }
      throw err;
    });
}

/**
 * Benchmark a function
 */

function bench(name, files, func) {
  var start = Date.now(),
      times = 1000,
      keys = Object.keys(files),
      i,
      l = keys.length,
      filename,
      file;

  while (times--) {
    for (i = 0; i < l; i++) {
      filename = keys[i];
      file = files[filename];
      func(file.text);
    }
  }

  console.log('%s completed in %dms.', name, Date.now() - start);
}

/**
 * Benchmark all engines
 */

function runBench(options) {
  options = options || {};
  var files = load(options);

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

  // showdown
  try {
    bench('commonmark', files, (function() {
      var commonmark = require('commonmark'),
          parser = new commonmark.Parser(),
          writer = new commonmark.HtmlRenderer();
      return function(text) {
        return writer.render(parser.parse(text));
      };
    })());
  } catch (e) {
    console.log('Could not bench commonmark. (Error: %s)', e.message);
  }

  // markdown-it
  try {
    bench('markdown-it', files, (function() {
      var MarkdownIt = require('markdown-it');
      var md = new MarkdownIt();
      return function(text) {
        return md.render(text);
      };
    })());
  } catch (e) {
    console.log('Could not bench markdown-it. (Error: %s)', e.message);
  }

  // markdown.js
  try {
    bench('markdown.js', files, (function() {
      var markdown = require('markdown').markdown;
      return function(text) {
        return markdown.toHTML(text);
      };
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
  var files = load(options);
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
  ['compiled_tests', 'original', 'new'].forEach(function(dir) {
    try {
      fs.mkdirSync(path.resolve(__dirname, dir));
    } catch (e) {
      ;
    }
  });

  // rm -rf tests
  fs.readdirSync(path.resolve(__dirname, 'compiled_tests')).forEach(function(file) {
    fs.unlinkSync(path.resolve(__dirname, 'compiled_tests', file));
  });

  // cp -r original tests
  fs.readdirSync(path.resolve(__dirname, 'original')).forEach(function(file) {
    var text = fs.readFileSync(path.resolve(__dirname, 'original', file), 'utf8');

    if (path.extname(file) === '.md') {
      if (fm.test(text)) {
        text = fm(text);
        text = '---\n' + text.frontmatter + '\ngfm: false\n---\n' + text.body;
      } else {
        text = '---\ngfm: false\n---\n' + text;
      }
    }

    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file), text);
  });

  // node fix.js
  var dir = path.join(__dirname, 'compiled_tests');

  fs.readdirSync(dir).filter(function(file) {
    return path.extname(file) === '.html';
  }).forEach(function(file) {
    file = path.join(dir, file);
    var html = fs.readFileSync(file, 'utf8');

    // fix unencoded quotes
    html = html
      .replace(/='([^\n']*)'(?=[^<>\n]*>)/g, '=&__APOS__;$1&__APOS__;')
      .replace(/="([^\n"]*)"(?=[^<>\n]*>)/g, '=&__QUOT__;$1&__QUOT__;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&__QUOT__;/g, '"')
      .replace(/&__APOS__;/g, '\'');

    // add heading id's
    html = html.replace(/<(h[1-6])>([^<]+)<\/\1>/g, function(s, h, text) {
      var id = text
        .replace(/&#39;/g, '\'')
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');

      id = id.toLowerCase().replace(/[^\w]+/g, '-');

      return '<' + h + ' id="' + id + '">' + text + '</' + h + '>';
    });

    fs.writeFileSync(file, html);
  });

  // turn <hr /> into <hr>
  fs.readdirSync(dir).forEach(function(file) {
    file = path.join(dir, file);
    var text = fs.readFileSync(file, 'utf8');

    text = text.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');

    fs.writeFileSync(file, text);
  });

  // markdown does some strange things.
  // it does not encode naked `>`, marked does.
  (function() {
    var file = dir + '/amps_and_angles_encoding.html';
    var html = fs.readFileSync(file, 'utf8')
      .replace('6 > 5.', '6 &gt; 5.');

    fs.writeFileSync(file, html);
  })();

  // cp new/* tests/
  fs.readdirSync(path.resolve(__dirname, 'new')).forEach(function(file) {
    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file),
      fs.readFileSync(path.resolve(__dirname, 'new', file)));
  });
}

/**
 * Argument Parsing
 */

function parseArg(options) {
  var argv = process.argv.slice(2),
      opt = '',
      orphans = [],
      arg;
  options = options || {};

  function getarg() {
    var arg = argv.shift();

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
        argv = arg.substring(1).split('').map(function(ch) {
          return '-' + ch;
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
    arg = getarg();
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
      case '--failed-output':
        options.failedOutput = true;
        break;
      case '--hide-output':
        options.hideOutput = true;
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
          opt = camelize(arg.replace(/^--(no-)?/, ''));
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
  return text.replace(/(\w)-(\w)/g, function(_, a, b) {
    return a + b.toUpperCase();
  });
}

/**
 * Main
 */

function main(options) {
  var opt = parseArg(options);

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
  main(process.argv.slice()).then(success => {
    process.exit(success ? 0 : 1);
  });
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
  var seconds = hrtimeElapsed[0];
  var frac = Math.round(hrtimeElapsed[1] / 1e3) / 1e3;
  return seconds * 1e3 + frac;
}
