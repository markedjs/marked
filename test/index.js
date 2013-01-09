#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , marked = require('marked');

function load() {
  var dir = __dirname + '/tests'
    , files = {}
    , list
    , file
    , i
    , l;

  list = fs
    .readdirSync(dir)
    .filter(function(file) {
      return path.extname(file) !== '.html';
    })
    .sort(function(a, b) {
      a = path.basename(a).toLowerCase().charCodeAt(0);
      b = path.basename(b).toLowerCase().charCodeAt(0);
      return a > b ? 1 : (a < b ? -1 : 0);
    });

  i = 0;
  l = list.length;

  for (; i < l; i++) {
    file = path.join(dir, list[i]);
    files[path.basename(file)] = {
      text: fs.readFileSync(file, 'utf8'),
      html: fs.readFileSync(file.replace(/[^.]+$/, 'html'), 'utf8')
    };
  }

  return files;
}

function runTests(options) {
  var options = options || {}
    , files = options.files || load()
    , complete = 0
    , keys = Object.keys(files)
    , i = 0
    , len = keys.length
    , filename
    , file
    , text
    , html
    , j
    , l;

main:
  for (; i < len; i++) {
    filename = keys[i];
    file = files[filename];

    try {
      text = marked(file.text).replace(/\s/g, '');
      html = file.html.replace(/\s/g, '');
    } catch(e) {
      console.log('%s failed.', filename);
      throw e;
    }

    j = 0;
    l = html.length;

    for (; j < l; j++) {
      if (text[j] !== html[j]) {
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
}

function bench(name, func) {
  var files = bench.files || load();

  if (!bench.files) {
    bench.files = files;

    // Change certain tests to allow
    // comparison to older benchmark times.
    fs.readdirSync(__dirname + '/new').forEach(function(name) {
      if (path.extname(name) === '.html') return;
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

function runBench() {
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false
  });
  bench('marked', marked);

  marked.setOptions({
    gfm: true,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false
  });
  bench('marked (gfm)', marked);

  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: true,
    sanitize: false
  });
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

  return runTests({
    stop: !!~argv.indexOf('--stop')
  });
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
