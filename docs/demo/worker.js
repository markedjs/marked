const versionCache = {};
const gfmCache = new Map();
let currentVersion;

onunhandledrejection = (e) => {
  throw e.reason;
};

onmessage = function(e) {
  if (e.data.version === currentVersion) {
    parse(e);
  } else {
    loadVersion(e.data.version).then(() => {
      parse(e);
    });
  }
};

function getDefaults() {
  if (currentVersion === 'commonmark' || currentVersion === 'gfm') {
    return {};
  }
  const marked = versionCache[currentVersion];
  let defaults = {};
  if (typeof marked.getDefaults === 'function') {
    defaults = marked.getDefaults();
    delete defaults.renderer;
  } else if ('defaults' in marked) {
    for (const prop in marked.defaults) {
      if (prop !== 'renderer') {
        defaults[prop] = marked.defaults[prop];
      }
    }
  }
  return defaults;
}

function mergeOptions(options) {
  const defaults = getDefaults();
  const opts = {};
  const invalidOptions = [
    'renderer',
    'tokenizer',
    'walkTokens',
    'extensions',
    'highlight',
    'sanitizer',
  ];
  for (const prop in defaults) {
    opts[prop] = invalidOptions.includes(prop) || !(prop in options)
      ? defaults[prop]
      : options[prop];
  }
  return opts;
}

function parse(e) {
  switch (e.data.task) {
    case 'defaults': {
      postMessage({
        id: e.data.id,
        task: e.data.task,
        defaults: getDefaults(),
      });
      break;
    }
    case 'parse': {
      if (currentVersion === 'commonmark' || currentVersion === 'gfm') {
        const startTime = new Date();
        Promise.resolve(versionCache[currentVersion].parse(e.data.markdown))
          .then((parsed) => {
            const endTime = new Date();
            postMessage({
              id: e.data.id,
              task: e.data.task,
              version: currentVersion,
              lexed: '',
              parsed,
              time: endTime - startTime,
            });
          })
          .catch((err) => {
            postMessage({
              id: e.data.id,
              task: e.data.task,
              version: currentVersion,
              lexed: '',
              parsed: `Error: ${err.message}`,
              time: 0,
              error: true,
            });
          });
        break;
      }
      const marked = versionCache[currentVersion];
      // marked 0.0.1 had tokens array as the second parameter of lexer and no options
      const options = currentVersion.endsWith('@0.0.1') ? [] : mergeOptions(e.data.options);
      const startTime = new Date();
      const lexed = marked.lexer(e.data.markdown, options);
      const lexedList = jsonString(lexed);
      const parsed = marked.parser(lexed, options);
      const endTime = new Date();
      postMessage({
        id: e.data.id,
        task: e.data.task,
        version: currentVersion,
        lexed: lexedList,
        parsed,
        time: endTime - startTime,
      });
      break;
    }
  }
}

function jsonString(input, level) {
  level = level || 0;
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return '[]';
    }
    const items = [];
    let i;
    if (!Array.isArray(input[0]) && typeof input[0] === 'object' && input[0] !== null) {
      for (i = 0; i < input.length; i++) {
        items.push(' '.repeat(2 * level) + jsonString(input[i], level + 1));
      }
      return '[\n' + items.join('\n') + '\n]';
    }
    for (i = 0; i < input.length; i++) {
      items.push(jsonString(input[i], level));
    }
    return '[' + items.join(', ') + ']';
  } else if (typeof input === 'object' && input !== null) {
    const props = [];
    for (const prop in input) {
      props.push(prop + ':' + jsonString(input[prop], level));
    }
    return '{' + props.join(', ') + '}';
  } else {
    return JSON.stringify(input);
  }
}

function fetchMarked(file) {
  return () =>
    fetch(file)
      .then((res) => res.text())
      .then((text) => {
        const g = globalThis || global;
        g.module = { };
        try {
          // eslint-disable-next-line no-new-func
          Function(text)();
        } catch {
          throw new Error(`Cannot find ${file}`);
        }
        const marked = g.marked || g.module.exports;
        return marked;
      });
}

function loadVersion(ver) {
  let promise;
  if (versionCache[ver]) {
    promise = Promise.resolve();
  } else if (ver === 'commonmark') {
    promise = import('https://cdn.jsdelivr.net/npm/commonmark@0.31.2/+esm')
      .then((cm) => {
        const reader = new cm.Parser();
        const writer = new cm.HtmlRenderer();
        versionCache[ver] = {
          parse: (markdown) => writer.render(reader.parse(markdown)),
        };
      });
  } else if (ver === 'gfm') {
    versionCache[ver] = {
      parse: async(markdown) => {
        if (gfmCache.has(markdown)) {
          return gfmCache.get(markdown);
        }
        const res = await fetch('https://api.github.com/markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: markdown,
            mode: 'gfm',
          }),
        });
        const text = await res.text();
        if (!res.ok) {
          let errorMsg = `HTTP Error ${res.status}`;
          try {
            const json = JSON.parse(text);
            if (json.message) {
              errorMsg = json.message;
            }
          } catch {}
          throw new Error(errorMsg);
        }
        gfmCache.set(markdown, text);
        return text;
      },
    };
    promise = Promise.resolve();
  } else {
    promise = import(ver + '/lib/marked.esm.js')
      .catch(fetchMarked(ver + '/marked.min.js'))
      .catch(fetchMarked(ver + '/lib/marked.umd.js'))
      .catch(fetchMarked(ver + '/lib/marked.js'))
      .then((marked) => {
        if (!marked) {
          throw Error('No marked');
        } else if (marked.marked) {
          versionCache[ver] = marked.marked;
        } else if (marked.default) {
          versionCache[ver] = marked.default;
        } else if (marked.lexer && marked.parser) {
          versionCache[ver] = marked;
        } else {
          throw new Error('Cannot find marked');
        }
      });
  }
  return promise.then(() => {
    currentVersion = ver;
  }).catch((err) => {
    console.error(err);
    let errorMsg = 'Cannot load that version of marked';
    if (ver === 'commonmark') {
      errorMsg = 'Cannot load commonmark';
    } else if (ver === 'gfm') {
      errorMsg = 'Cannot load gfm';
    }
    throw new Error(errorMsg);
  });
}
