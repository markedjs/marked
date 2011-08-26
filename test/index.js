#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , marked = require('marked')
  , dir = __dirname + '/tests';

var breakOnError = true;

var files;

var load = function() {
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
};

var main = function() {
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

    // this was messing with 
    // `node test | less` on sakura
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
        console.log('\nGot:\n%s\n', 
          pretty(text).trim() || text);
        console.log('\nExpected:\n%s\n', 
          pretty(html).trim() || html);
        if (breakOnError) {
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
};

main.bench = function(name, func) {
  if (!files) load();

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
};

var bench = function() {
  var marked = require('../');
  main.bench('marked', marked);

  /**
   * There's two ways to benchmark showdown here.
   * The first way is to create a new converter
   * every time, this will renew any closured
   * variables. It is the "proper" way of using
   * showdown. However, for this benchmark, 
   * I will use the completely improper method
   * which is must faster, just to be fair.
   */

  var showdown = (function() {
    var Showdown = require('showdown').Showdown;
    var convert = new Showdown.converter();
    return function(text) {
      return convert.makeHtml(text);
    };
  })();
  main.bench('showdown', showdown);

  var markdownjs = require('markdown-js');
  main.bench('markdown-js', function(text) {
    markdownjs.toHTML(text);
  });
};

var old_bench = function() {
  var text = fs.readFileSync(__dirname + '/main.md', 'utf8');

  var benchmark = function(func, t) {
    var start = new Date()
      , i = t || 10000;
    while (i--) func();
    console.log('%s: %sms', func.name, new Date() - start);
  };

  var marked_ = require('../');
  benchmark(function marked() {
    marked_(text);
  });

  var showdown_ = (function() {
    var Showdown = require('showdown').Showdown;
    var convert = new Showdown.converter();
    return function(str) {
      return convert.makeHtml(str);
    };
  })();
  benchmark(function showdown() {
    showdown_(text);
  });

  var markdownjs_ = require('markdown-js');
  benchmark(function markdownjs() {
    markdownjs_.toHTML(text);
  });
};

var old_test = function() {
  var assert = require('assert')
    , text = fs.readFileSync(__dirname + '/main.md', 'utf8');

  var a = markdown(text)
    , b = fs.readFileSync(__dirname + '/main.html', 'utf8');

  console.log(a);
  console.log('--------------------------------------------------------------');
  console.log(b);
  console.log('--------------------------------------------------------------');

  a = a.replace(/\s+/g, '');
  b = b.replace(/\s+/g, '');

  assert.ok(a === b, 'Failed.');
  console.log('Complete.');
};

/**
 * Pretty print HTML
 * Copyright (c) 2011, Christopher Jeffrey
 */

var pretty = (function() {
  var indent = function(num) {
    return Array((num >= 0 ? num : 0) + 1).join('  ');
  };

  var closing = {
    base: true,
    link: true,
    meta: true,
    hr: true,
    br: true,
    wbr: true,
    img: true,
    embed: true,
    param: true,
    source: true,
    track: true,
    area: true,
    col: true,
    input: true,
    keygen: true,
    command: true
  };

  var remove = /<(pre|textarea|title|p|li|a)(?:\s[^>]+)?>[\s\S]+?<\/\1>/g
    , replace = /<!(\d+)%*\/>/g
    , wrap = /([ \t]*)<p>([\s\S]+?)<\/p>/g;

  return function(str) {
    var hash = []
      , out = []
      , cap
      , depth = 0
      , text
      , full
      , tag
      , name;

    // temporarily remove elements before 
    // processing, also remove whitespace
    str = str.replace(remove, function(element, name) {
        element = element
          .replace(/(<[^\/][^>]*>)\s+|\s+(<\/)/g, '$1$2')
          .replace(/[\r\n]/g, '');
      return '<!' + (hash.push(element) - 1) 
                  + (Array(element.length - 3).join('%')) + '/>';
    });

    // indent elements
    str = str
      .replace(/(>)\s+|\s+(<)/g, '$1$2')
      .replace(/[\r\n]/g, '');

    while (cap = /^([\s\S]*?)(<([^>]+)>)/.exec(str)) {
      str = str.substring(cap[0].length);
      text = cap[1];
      full = cap[2];
      tag = cap[3];
      name = tag.split(' ')[0];

      if (text) {
        out.push(indent(depth) + text);
      }

      if (name[0] !== '/') {
        out.push(indent(depth) + full);
        if (!closing[name] 
            && name[0] !== '!' 
            && name[0] !== '?' 
            && tag[tag.length-1] !== '/') {
          depth++;
        }
      } else {
        depth--;
        out.push(indent(depth) + full);
      }
    }
    str = out.join('\n');

    // restore the elements to 
    // their original locations
    str = str.replace(replace, function($0, $1) {
      return hash[$1];
    });

    // wrap paragraphs
    str = str.replace(wrap, function($0, $1, $2) {
      var indent = $1 + '  '
        , text = indent + $2;

      text = text
        .replace(/[\t\r\n]+/g, '')
        .replace(/(<\/[^>]+>|\/>)(?=\s*<\w)/g, '$1\n' + indent)
        .replace(/(.{75,}?\s+(?![^<]+>))/g, '$1\n' + indent)
        .replace(/([^<>\n]{50,}?)(<[^<]{15,}>)/g, '$1\n' + indent + '$2');

      return $1 + '<p>\n' + text + '\n' + $1 + '</p>';
    });

    return str;
  };
})();

if (!module.parent) {
  if (~process.argv.indexOf('--bench')) {
    bench();
  } else if (~process.argv.indexOf('--old_bench')) {
    old_bench();
  } else if (~process.argv.indexOf('--old_test')) {
    old_test();
  } else {
    main();
  }
} else {
  module.exports = main;
}
