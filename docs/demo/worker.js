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
      var lexedList = jsonString(lexed);
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

function stringRepeat(char, times) {
  var s = '';
  for (var i = 0; i < times; i++) {
    s += char;
  }
  return s;
}

function jsonString(input, level) {
  level = level || 0;
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return '[]';
    }
    var items = [],
        i;
    if (!Array.isArray(input[0]) && typeof input[0] === 'object' && input[0] !== null) {
      for (i = 0; i < input.length; i++) {
        items.push(stringRepeat(' ', 2 * level) + jsonString(input[i], level + 1));
      }
      return '[\n' + items.join('\n') + '\n]';
    }
    for (i = 0; i < input.length; i++) {
      items.push(jsonString(input[i], level));
    }
    return '[' + items.join(', ') + ']';
  } else if (typeof input === 'object' && input !== null) {
    var props = [];
    for (var prop in input) {
      props.push(prop + ':' + jsonString(input[prop], level));
    }
    return '{' + props.join(', ') + '}';
  } else {
    return JSON.stringify(input);
  }
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
