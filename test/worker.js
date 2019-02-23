const {
  Worker, isMainThread, parentPort
} = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename);
  let count = 0;
  const listeners = {};
  worker.on('message', ([id, err, html, elapsed]) => {
    if (!listeners[id]) {
      return;
    }
    if (err) {
      listeners[id].reject([err, elapsed]);
    } else {
      listeners[id].resolve([html, elapsed]);
    }
    delete listeners[id];
  });
  module.exports = function markedAsync(md, opts) {
    return new Promise((resolve, reject) => {
      const id = count++;
      listeners[id] = {resolve, reject};
      worker.postMessage([id, md, opts]);
    });
  };
} else {
  const marked = require('../');
  parentPort.on('message', ([id, md, opts]) => {
    marked.defaults = marked.getDefaults();
    let before, elapsed;
    before = process.hrtime();
    try {
      const html = marked(md, opts);
      elapsed = process.hrtime(before);
      parentPort.postMessage([id, null, html, elapsed]);
    } catch (err) {
      elapsed = process.hrtime(before);
      parentPort.postMessage([id, (err.stack ? err.stack.toString() : err.toString()), null, elapsed]);
    }
  });
}
