const {
  Worker, isMainThread, parentPort
} = require('worker_threads');
let worker;
let count = 0;
const listeners = {};

function newWorker() {
  if (worker) {
    worker.terminate();
  }
  worker = new Worker(__filename);
  module.exports.worker = worker;
  worker.on('message', ([id, err, html, elapsed]) => {
    if (!listeners[id]) {
      return;
    }
    if (err) {
      listeners[id].reject([err, elapsed]);
    } else {
      listeners[id].resolve([html, elapsed]);
    }
    clearTimeout(listeners[id].timeout);
    delete listeners[id];
  });
}

function createTimeout(id, stop) {
  return setTimeout(() => {
    if (listeners[id]) {
      listeners[id].reject(['took longer than 2 second', [2, 0]]);
    }
    delete listeners[id];
    if (stop) {
      worker.terminate();
    } else {
      newWorker();
    }
    Object.keys(listeners).forEach(cid => {
      const listener = listeners[cid];
      clearTimeout(listener.timeout);
      if (stop) {
        delete listeners[cid];
      } else {
        listener.timeout = createTimeout(cid);
        worker.postMessage([cid, listener.md, listener.opts]);
      }
    });
  }, 2000);
}

if (isMainThread) {
  module.exports = function markedAsync(md, opts, stop) {
    return new Promise((resolve, reject) => {
      const id = count++;
      const timeout = createTimeout(id, stop);
      listeners[id] = {md, opts, resolve, reject, timeout};
      worker.postMessage([id, md, opts]);
    });
  };
  module.exports.newWorker = newWorker;
  module.exports.worker = worker;
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
