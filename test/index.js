#!/usr/bin/env node

/**
 * marked tests
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

/**
 * Modules
 */

var fs = require('fs')
  , path = require('path')
  , fm = require('front-matter')
  , g2r = require('glob-to-regexp')
  , marked = require('../');

/**
 * Load Tests
 */

function load(options) {
  var dir = __dirname + '/compiled_tests'
    , files = {}
    , list
    , file
    , name
    , content
    , regex
    , skip
    , glob = g2r(options.glob || "*", { extended: true })
    , i
    , j
    , l;

  list = fs
    .readdirSync(dir)
    .filter(function(file) {
      return path.extname(file) !== '.html';
    })
    .sort();

  l = list.length;

  for (i = 0; i < l; i++) {
    name = path.basename(list[i], ".md");
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
      fs.readdirSync(__dirname + '/new').forEach(function(name) {
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

  var engine = engine || marked
    , options = options || {}
    , files = options.files || load(options)
    , complete = 0
    , failed = 0
    , failures = []
    , keys = Object.keys(files)
    , i = 0
    , len = keys.length
    , filename
    , file
    , opts
    , text
    , html
    , j
    , l;

  if (options.marked) {
    marked.setOptions(options.marked);
  }

main:
  for (; i < len; i++) {
    filename = keys[i];
    file = files[filename];
    opts = Object.keys(file.options);

    if (marked._original) {
      marked.defaults = marked._original;
      delete marked._original;
    }

    if (opts.length) {
      marked._original = marked.defaults;
      marked.defaults = {};
      Object.keys(marked._original).forEach(function(key) {
        marked.defaults[key] = marked._original[key];
      });
      opts.forEach(function(key) {
        if (marked.defaults.hasOwnProperty(key)) {
          marked.defaults[key] = file.options[key];
        }
      });
    }

    try {
      text = engine(file.text).replace(/\s/g, '');
      html = file.html.replace(/\s/g, '');
    } catch (e) {
      console.log('%s failed.', filename);
      throw e;
    }

    j = 0;
    l = html.length;

    for (; j < l; j++) {
      if (text[j] !== html[j]) {
        failed++;
        failures.push(filename);

        text = text.substring(
          Math.max(j - 30, 0),
          Math.min(j + 30, text.length));

        html = html.substring(
          Math.max(j - 30, 0),
          Math.min(j + 30, html.length));

        console.log(
          '\n#%d. %s failed at offset %d. Near: "%s".\n',
          i + 1, filename, j, text);

        console.log('\nGot:\n%s\n', text.trim() || text);
        console.log('\nExpected:\n%s\n', html.trim() || html);

        if (options.stop) {
          break main;
        }

        continue main;
      }
    }

    complete++;
    console.log('#%d. %s completed.', i + 1, filename);
  }

  console.log('%d/%d tests completed successfully.', complete, len);
  if (failed) console.log('%d/%d tests failed.', failed, len);

  return !failed;
}

/**
 * Benchmark a function
 */

function bench(name, files, func) {
  var start = Date.now()
    , times = 1000
    , keys = Object.keys(files)
    , i
    , l = keys.length
    , filename
    , file;

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
  var options = options || {}
    , files = load(options);

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
    bench('showdown (reuse converter)', files, (function() {
      var Showdown = require('showdown');
      var convert = new Showdown.Converter();
      return function(text) {
        return convert.makeHtml(text);
      };
    })());
    bench('showdown (new converter)', files, (function() {
      var Showdown = require('showdown');
      return function(text) {
        var convert = new Showdown.Converter();
        return convert.makeHtml(text);
      };
    })());
  } catch (e) {
    console.log('Could not bench showdown. (Error: %s)', e.message);
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
  var options = options || {}
    , files = load(options);
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
      fs.mkdirSync(path.resolve(__dirname, dir), 0o755);
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
    var text = fs.readFileSync(path.resolve(__dirname, 'original', file));

    if (file === 'hard_wrapped_paragraphs_with_list_like_lines.md') {
      text = '---\ngfm: false\n---\n' + text;
    }

    fs.writeFileSync(path.resolve(__dirname, 'compiled_tests', file), text);
  });

  // node fix.js
  var dir = __dirname + '/compiled_tests';

  fs.readdirSync(dir).filter(function(file) {
    return path.extname(file) === '.html';
  }).forEach(function(file) {
    var file = path.join(dir, file)
      , html = fs.readFileSync(file, 'utf8');

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

      id = id.toLowerCase().replace(/[^\w]+/g, '-');

      return '<' + h + ' id="' + id + '">' + text + '</' + h + '>';
    });

    fs.writeFileSync(file, html);
  });

  // turn <hr /> into <hr>
  fs.readdirSync(dir).forEach(function(file) {
    var file = path.join(dir, file)
      , text = fs.readFileSync(file, 'utf8');

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

function parseArg(argv) {
  var argv = process.argv.slice(2)
    , options = {}
    , opt = ""
    , orphans = []
    , arg;

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
      case '-t':
      case '--time':
        options.time = true;
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

function main(argv) {
  var opt = parseArg();

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
  exports.runBench = runBench;
  exports.load = load;
  exports.bench = bench;
  module.exports = exports;
}
