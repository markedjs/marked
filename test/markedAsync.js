const marked = require('../lib/marked.js');
const {
  Worker, isMainThread, parentPort
} = require('worker_threads');
let count = 0;
const listeners = {};

if (isMainThread) {
  const worker = new Worker(__filename);
  worker.on('message', ([id, err, html, elapsed]) => {
    if (!listeners[id]) {
      return;
    }
    if (err) {
      listeners[id].reject([new Error(err), elapsed]);
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
  module.exports.worker = worker;
} else {
  parentPort.on('message', ([id, md, opts]) => {
    marked.defaults = marked.getDefaults();
    let before, elapsed;
    try {
      before = process.hrtime();
      const html = marked(md, opts);
      elapsed = process.hrtime(before);
      parentPort.postMessage([id, null, html, elapsed]);
    } catch (err) {
      elapsed = process.hrtime(before);
      parentPort.postMessage([id, err.message, null, elapsed]);
    }
  });
}
