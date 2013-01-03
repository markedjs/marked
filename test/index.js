#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , marked = require('marked')
  , dir = __dirname + '/tests';

var files;

var BREAK_ON_ERROR = false;

function load() {
  files = {};

  var list = fs
    .readdirSync(dir)
    .filter(function(file) {
      return path.extname(file) !== '.html';
    })
    .sort(function(a, b) {
      a = path.basename(a).toLowerCase().charCodeAt(0);
      b = path.basename(b).toLowerCase().charCodeAt(0);
      return a > b ? 1 : (a < b ? -1 : 0);
    });

  var i = 0
    , l = list.length
    , file;

  for (; i < l; i++) {
    file = path.join(dir, list[i]);
    files[path.basename(file)] = {
      text: fs.readFileSync(file, 'utf8'),
      html: fs.readFileSync(file.replace(/[^.]+$/, 'html'), 'utf8')
    };
  }

  return files;
}

function runTests() {
  if (!files) load();

  var complete = 0
    , keys = Object.keys(files)
    , i_ = 0
    , l_ = keys.length
    , filename
    , file
    , text
    , html;

main:
  for (; i_ < l_; i_++) {
    filename = keys[i_];
    file = files[filename];

    try {
      text = marked(file.text).replace(/\s/g, '');
      html = file.html.replace(/\s/g, '');
    } catch(e) {
      console.log('%s failed.', filename);
      throw e;
    }

    var i = 0
      , l = html.length;

    for (; i < l; i++) {
      if (text[i] !== html[i]) {
        text = text.substring(
          Math.max(i - 30, 0),
          Math.min(i + 30, text.length));

        html = html.substring(
          Math.max(i - 30, 0),
          Math.min(i + 30, html.length));

        console.log(
          '\n#%d. %s failed at offset %d. Near: "%s".\n',
          i_ + 1, filename, i, text);

        console.log('\nGot:\n%s\n', text.trim() || text);
        console.log('\nExpected:\n%s\n', html.trim() || html);

        if (BREAK_ON_ERROR) {
          break main;
        } else {
          break;
        }
      }
    }

    if (i === l) {
      complete++;
      console.log('#%d. %s completed.', i_ + 1, filename);
    }
  }

  console.log('%d/%d tests completed successfully.', complete, l_);
}

function bench(name, func) {
  if (!files) {
    load();
    // change certain tests. to allow
    // comparison to older benchmark times.
    fs.readdirSync(__dirname + '/new').forEach(function(name) {
      if (name.split('.').pop() === 'html') return;
      if (name === 'main.text') return;
      delete files[name];
    });
    files['backslash_escapes.text'] = {
      text: 'hello world \\[how](are you) today'
    };
    files['main.text'].text = files['main.text'].text.replace('* * *\n\n', '');
  }

  var start = Date.now()
    , times = 1000
    , keys = Object.keys(files)
    , i = 0
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

function runBench() {
  marked.setOptions({ gfm: false });
  bench('marked', marked);

  marked.setOptions({ gfm: true });
  bench('marked (gfm)', marked);

  marked.setOptions({ pedantic: true });
  bench('marked (pedantic)', marked);

  var discount = require('discount').parse;
  bench('discount', discount);

  var showdown = (function() {
    var Showdown = require('showdown').Showdown;
    var convert = new Showdown.converter();
    return function(text) {
      return convert.makeHtml(text);
    };
  })();
  bench('showdown (reuse converter)', showdown);

  var showdown_slow = (function() {
    var Showdown = require('showdown').Showdown;
    return function(text) {
      var convert = new Showdown.converter();
      return convert.makeHtml(text);
    };
  })();
  bench('showdown (new converter)', showdown_slow);

  var markdownjs = require('markdown');
  bench('markdown-js', function(text) {
    markdownjs.parse(text);
  });
}

function time() {
  var marked = require('../');
  bench('marked', marked);
}

function main(argv) {
  if (~argv.indexOf('--bench')) {
    return runBench();
  }

  if (~argv.indexOf('--time')) {
    return time();
  }

  return runTests();
}

if (!module.parent) {
  main(process.argv.slice());
} else {
  main = runTests;
  main.main = main;
  main.load = load;
  main.bench = bench;
  module.exports = main;
}
