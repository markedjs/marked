/* globals marked, unfetch, ES6Promise, Promise */ // eslint-disable-line no-redeclare

if (!self.Promise) {
  self.importScripts('https://cdn.jsdelivr.net/npm/es6-promise/dist/es6-promise.js');
  self.Promise = ES6Promise;
}
if (!self.fetch) {
  self.importScripts('https://cdn.jsdelivr.net/npm/unfetch/dist/unfetch.umd.js');
  self.fetch = unfetch;
}

var versionCache = {};
var currentVersion;

onunhandledrejection = function(e) {
  throw e.reason;
};

onmessage = function(e) {
  if (e.data.version === currentVersion) {
    parse(e);
  } else {
    loadVersion(e.data.version).then(function() {
      parse(e);
    });
  }
};

function parse(e) {
  switch (e.data.task) {
    case 'defaults':

      var defaults = {};
      if (typeof marked.getDefaults === 'function') {
        defaults = marked.getDefaults();
        delete defaults.renderer;
      } else if ('defaults' in marked) {
        for (var prop in marked.defaults) {
          if (prop !== 'renderer') {
            defaults[prop] = marked.defaults[prop];
          }
        }
      }
      postMessage({
        task: e.data.task,
        defaults: defaults
      });
      break;
    case 'parse':
      var startTime = new Date();
      var lexed = marked.lexer(e.data.markdown, e.data.options);
      var lexedList = getLexedList(lexed);
      var parsed = marked.parser(lexed, e.data.options);
      var endTime = new Date();
      postMessage({
        task: e.data.task,
        lexed: lexedList,
        parsed: parsed,
        time: endTime - startTime
      });
      break;
  }
}

function getLexedList(lexed, level) {
  level = level || 0;
  var lexedList = [];
  for (var i = 0; i < lexed.length; i++) {
    var lexedLine = [];
    for (var j in lexed[i]) {
      if (j === 'tokens' || j === 'items') {
        lexedLine.push(j + ': [\n' + getLexedList(lexed[i][j], level + 1) + '\n]');
      } else {
        lexedLine.push(j + ':' + jsonString(lexed[i][j]));
      }
    }
    lexedList.push(stringRepeat(' ', 2 * level) + '{' + lexedLine.join(', ') + '}');
  }
  return lexedList.join('\n');
}

function stringRepeat(char, times) {
  var s = '';
  for (var i = 0; i < times; i++) {
    s += char;
  }
  return s;
}

function jsonString(input) {
  var output = (input + '')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/[\\"']/g, '\\$&')
    .replace(/\u0000/g, '\\0');
  return '"' + output + '"';
}

function loadVersion(ver) {
  var promise;
  if (versionCache[ver]) {
    promise = Promise.resolve(versionCache[ver]);
  } else {
    promise = fetch(ver)
      .then(function(res) { return res.text(); })
      .then(function(text) {
        versionCache[ver] = text;
        return text;
      });
  }
  return promise.then(function(text) {
    try {
      // eslint-disable-next-line no-new-func
      Function(text)();
    } catch (err) {
      throw new Error('Cannot load that version of marked');
    }
    currentVersion = ver;
  });
}
