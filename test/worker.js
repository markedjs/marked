const {
  Worker, isMainThread, parentPort
} = require('worker_threads');

function newWorker(listeners) {
  let worker = new Worker(__filename);
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

  return worker;
}

function createTimeout(worker, listeners, id) {
  return setTimeout(() => {
    if (listeners[id]) {
      listeners[id].reject(['took longer than 5 second', [5, 0]]);
    }
    delete listeners[id];
    worker.terminate();
    worker = newWorker(listeners);
    Object.keys(listeners).forEach(cid => {
      const listener = listeners[cid];
      clearTimeout(listener.timeout);
      listener.timeout = createTimeout(worker, listeners, cid);
      worker.postMessage([cid, listener.md, listener.opts]);
    });
  }, 5000);
}

if (isMainThread) {
  let count = 0;
  const listeners = {};
  let worker = newWorker(listeners);
  module.exports = function markedAsync(md, opts) {
    return new Promise((resolve, reject) => {
      const id = count++;
      const timeout = createTimeout(worker, listeners, id);
      listeners[id] = {md, opts, resolve, reject, timeout};
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
