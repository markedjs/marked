#!/usr/bin/env node

var fs = require('fs')
  , path = require('path')
  , marked = require('marked')
  , dir = __dirname + '/tests';

var breakOnError = true;

var main = function() {
  var list = fs.readdirSync(dir)
    , complete = 0;

  list = list.filter(function(file) {
    return path.extname(file) === '.text';
  });

  list.push('/../main.md');

main: 
  for (var i_ = 0, l_ = list.length, file; i_ < l_; i_++) {
    file = list[i_];
    file = path.join(dir, file);

    var text = fs.readFileSync(file, 'utf8')
      , html = fs.readFileSync(file.replace(/\.(text|md)$/, '.html'), 'utf8');

    try { // this was messing with `node test | less` on sakura
      text = marked(text).replace(/\s/g, '');
      html = html.replace(/\s/g, '');
    } catch(e) { 
      console.log(list[i_]); 
      throw e; 
    }

    for (var i = 0, l = html.length; i < l; i++) {
      if (text[i] !== html[i]) {
        text = text.substring(
          Math.max(i - 30, 0), 
          Math.min(i + 30, text.length));
        html = html.substring(
          Math.max(i - 30, 0), 
          Math.min(i + 30, html.length));
        console.log(
          '\n#%d. %s failed at offset %d. Near: "%s".\n', 
          i_ + 1, list[i_], i, text);
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
      console.log('#%d. %s completed.', i_ + 1, list[i_]);
    }
  }

  console.log('%d/%d tests completed successfully.', complete, l_);
};

if (!module.parent) {
  process.nextTick(main);
} else {
  module.exports = main;
}

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
