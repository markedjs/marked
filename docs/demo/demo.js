onunhandledrejection = (e) => {
  throw e.reason;
};

const $loadingElem = document.querySelector('#loading');
const $mainElem = document.querySelector('#main');
const $markdownElem = document.querySelector('#markdown');
const $markedVerElem = document.querySelector('#markedVersion');
const $optionsElem = document.querySelector('#options');
const $outputTypeElem = document.querySelector('#outputType');
const $inputTypeElem = document.querySelector('#inputType');
const $responseTimeElem = document.querySelector('#responseTime');
const $previewElem = document.querySelector('#preview');
const $previewIframe = document.querySelector('#preview iframe');
const $permalinkElem = document.querySelector('#permalink');
const $clearElem = document.querySelector('#clear');
const $htmlElem = document.querySelector('#html');
const $lexerElem = document.querySelector('#lexer');
const $panes = document.querySelectorAll('.pane');
const $inputPanes = document.querySelectorAll('.inputPane');
let lastInput = '';
let inputDirty = true;
let $activeOutputElem = null;
let latestVersion = 'master';
const search = searchToObject();
const markedVersions = {
  master: '../'
};
let delayTime = 1;
let checkChangeTimeout = null;
let markedWorker;

$previewIframe.addEventListener('load', handleIframeLoad);

$outputTypeElem.addEventListener('change', handleOutputChange, false);

$inputTypeElem.addEventListener('change', handleInputChange, false);

$markedVerElem.addEventListener('change', handleVersionChange, false);

$markdownElem.addEventListener('change', handleInput, false);
$markdownElem.addEventListener('keyup', handleInput, false);
$markdownElem.addEventListener('keypress', handleInput, false);
$markdownElem.addEventListener('keydown', handleInput, false);

$optionsElem.addEventListener('change', handleInput, false);
$optionsElem.addEventListener('keyup', handleInput, false);
$optionsElem.addEventListener('keypress', handleInput, false);
$optionsElem.addEventListener('keydown', handleInput, false);

$clearElem.addEventListener('click', handleClearClick, false);

Promise.all([
  setInitialQuickref(),
  setInitialOutputType(),
  setInitialText(),
  setInitialVersion()
    .then(setInitialOptions)
]).then(() => {
  handleInputChange();
  handleOutputChange();
  checkForChanges();
  setScrollPercent(0);
  $loadingElem.style.display = 'none';
  $mainElem.style.display = 'block';
}).catch(() => {
  $loadingElem.classList.add('loadingError');
  $loadingElem.textContent = 'Failed to load marked. Refresh the page to try again.';
});

function setInitialText() {
  if ('text' in search) {
    $markdownElem.value = search.text;
  } else {
    return fetch('./initial.md')
      .then(res => res.text())
      .then(text => {
        if ($markdownElem.value === '') {
          $markdownElem.value = text;
        }
      });
  }
}

function setInitialQuickref() {
  return fetch('./quickref.md')
    .then(res => res.text())
    .then(text => {
      document.querySelector('#quickref').value = text;
    });
}

function setInitialVersion() {
  return fetch('https://data.jsdelivr.com/v1/package/npm/marked')
    .then(res => res.json())
    .then(json => {
      for (const ver of json.versions) {
        markedVersions[ver] = 'https://cdn.jsdelivr.net/npm/marked@' + ver;
        const opt = document.createElement('option');
        opt.textContent = ver;
        opt.value = ver;
        $markedVerElem.appendChild(opt);
      }

      if (location.host === 'marked.js.org') {
        latestVersion = json.tags.latest;
      } else {
        $markedVerElem.querySelector('option[value="master"]').textContent = 'This Build';
      }

      if (search.version && markedVersions[search.version]) {
        $markedVerElem.value = search.version;
        return;
      }

      $markedVerElem.value = latestVersion;
    })
    .then(updateVersion);
}

function setInitialOptions() {
  if ('options' in search) {
    $optionsElem.value = search.options;
  } else {
    return setDefaultOptions();
  }
}

function setInitialOutputType() {
  if (search.outputType) {
    $outputTypeElem.value = search.outputType;
  }
}

function handleIframeLoad() {
  lastInput = '';
  inputDirty = true;
}

function handleInput() {
  inputDirty = true;
}

function handleVersionChange() {
  updateVersion();
}

function handleClearClick() {
  $markdownElem.value = '';
  $markedVerElem.value = latestVersion;
  updateVersion();
  setDefaultOptions();
}

function handleInputChange() {
  handleChange($inputPanes, $inputTypeElem.value);
}

function handleOutputChange() {
  $activeOutputElem = handleChange($panes, $outputTypeElem.value);
  updateLink();
}

function handleChange(panes, visiblePane) {
  let active = null;
  for (let i = 0; i < panes.length; i++) {
    if (panes[i].id === visiblePane) {
      panes[i].style.display = '';
      active = panes[i];
    } else {
      panes[i].style.display = 'none';
    }
  }
  return active;
}

function setDefaultOptions() {
  return messageWorker({
    task: 'defaults',
    version: markedVersions[$markedVerElem.value]
  });
}

function setOptions(opts) {
  $optionsElem.value = JSON.stringify(
    opts,
    (key, value) => {
      if (value && typeof value === 'object' && Object.getPrototypeOf(value) !== Object.prototype) {
        return undefined;
      }
      return value;
    }, ' ');
}

function searchToObject() {
  // modified from https://stackoverflow.com/a/7090123/806777
  const pairs = location.search.slice(1).split('&');
  const obj = {};

  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i] === '') {
      continue;
    }

    const pair = pairs[i].split('=');

    obj[decodeURIComponent(pair.shift())] = decodeURIComponent(pair.join('='));
  }

  return obj;
}

function getScrollSize() {
  if (!$activeOutputElem) {
    return 0;
  }

  const e = $activeOutputElem;

  return e.scrollHeight - e.clientHeight;
}

function getScrollPercent() {
  if (!$activeOutputElem) {
    return 1;
  }

  const size = getScrollSize();

  if (size <= 0) {
    return 1;
  }

  return $activeOutputElem.scrollTop / size;
}

function setScrollPercent(percent) {
  if ($activeOutputElem) {
    $activeOutputElem.scrollTop = percent * getScrollSize();
  }
}

function updateLink() {
  let outputType = '';
  if ($outputTypeElem.value !== 'preview') {
    outputType = 'outputType=' + $outputTypeElem.value + '&';
  }

  $permalinkElem.href = '?' + outputType + 'text=' + encodeURIComponent($markdownElem.value)
      + '&options=' + encodeURIComponent($optionsElem.value)
      + '&version=' + encodeURIComponent($markedVerElem.value);
  history.replaceState('', document.title, $permalinkElem.href);
}

function updateVersion() {
  handleInput();
}

function checkForChanges() {
  if (inputDirty && $markedVerElem.value !== 'pr') {
    inputDirty = false;

    updateLink();

    let options = {};
    const optionsString = $optionsElem.value || '{}';
    try {
      const newOptions = JSON.parse(optionsString);
      options = newOptions;
      $optionsElem.classList.remove('error');
    } catch (err) {
      $optionsElem.classList.add('error');
    }

    const version = markedVersions[$markedVerElem.value];
    const markdown = $markdownElem.value;
    const hash = version + markdown + optionsString;
    if (lastInput !== hash) {
      lastInput = hash;
      delayTime = 100;
      messageWorker({
        task: 'parse',
        version,
        markdown,
        options
      });
    }
  }
  checkChangeTimeout = window.setTimeout(checkForChanges, delayTime);
}

function setResponseTime(ms) {
  let amount = ms;
  let suffix = 'ms';
  if (ms > 1000 * 60 * 60) {
    amount = 'Too Long';
    suffix = '';
  } else if (ms > 1000 * 60) {
    amount = '>' + Math.floor(ms / (1000 * 60));
    suffix = 'm';
  } else if (ms > 1000) {
    amount = '>' + Math.floor(ms / 1000);
    suffix = 's';
  }
  $responseTimeElem.textContent = amount + suffix;
  $responseTimeElem.animate([
    { transform: 'scale(1.2)' },
    { transform: 'scale(1)' }
  ], 200);
}

function setParsed(parsed, lexed) {
  try {
    $previewIframe.contentDocument.body.innerHTML = parsed;
  } catch (ex) {}
  $htmlElem.value = parsed;
  $lexerElem.value = lexed;
}

const workerPromises = {};
function messageWorker(message) {
  if (!markedWorker || markedWorker.working) {
    if (markedWorker) {
      clearTimeout(markedWorker.timeout);
      markedWorker.terminate();
    }
    markedWorker = new Worker('worker.js');
    markedWorker.onmessage = (e) => {
      clearTimeout(markedWorker.timeout);
      markedWorker.working = false;
      switch (e.data.task) {
        case 'defaults': {
          setOptions(e.data.defaults);
          break;
        }
        case 'parse': {
          $previewElem.classList.remove('error');
          $htmlElem.classList.remove('error');
          $lexerElem.classList.remove('error');
          const scrollPercent = getScrollPercent();
          setParsed(e.data.parsed, e.data.lexed);
          setScrollPercent(scrollPercent);
          setResponseTime(e.data.time);
          break;
        }
      }
      clearTimeout(checkChangeTimeout);
      delayTime = 10;
      checkForChanges();
      workerPromises[e.data.id]();
      delete workerPromises[e.data.id];
    };
    markedWorker.onerror = markedWorker.onmessageerror = (err) => {
      clearTimeout(markedWorker.timeout);
      let error = 'There was an error in the Worker';
      if (err) {
        if (err.message) {
          error = err.message;
        } else {
          error = err;
        }
      }
      error = error.replace(/^Uncaught Error: /, '');
      $previewElem.classList.add('error');
      $htmlElem.classList.add('error');
      $lexerElem.classList.add('error');
      setParsed(error, error);
      setScrollPercent(0);
    };
  }
  if (message.task !== 'defaults') {
    markedWorker.working = true;
    workerTimeout(0);
  }
  return new Promise(resolve => {
    message.id = uniqueWorkerMessageId();
    workerPromises[message.id] = resolve;
    markedWorker.postMessage(message);
  });
}

function uniqueWorkerMessageId() {
  let id;
  do {
    id = Math.random().toString(36);
  } while (id in workerPromises);
  return id;
}

function workerTimeout(seconds) {
  markedWorker.timeout = setTimeout(() => {
    seconds++;
    markedWorker.onerror('Marked has taken longer than ' + seconds + ' second' + (seconds > 1 ? 's' : '') + ' to respond...');
    workerTimeout(seconds);
  }, 1000);
}
