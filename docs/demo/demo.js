/* globals marked, unfetch, ES6Promise */

if (!window.Promise) {
  window.Promise = ES6Promise;
}
if (!window.fetch) {
  window.fetch = unfetch;
}

onunhandledrejection = function (e) {
  throw e.reason;
};

var $markdownElem = document.querySelector('#markdown');
var $markedVerElem = document.querySelector('#markedVersion');
var $markedVer = document.querySelector('#markedCdn');
var $optionsElem = document.querySelector('#options');
var $outputTypeElem = document.querySelector('#outputType');
var $inputTypeElem = document.querySelector('#inputType');
var $responseTimeElem = document.querySelector('#responseTime');
var $previewElem = document.querySelector('#preview');
var $previewIframe = document.querySelector('#preview iframe');
var $permalinkElem = document.querySelector('#permalink');
var $clearElem = document.querySelector('#clear');
var $htmlElem = document.querySelector('#html');
var $lexerElem = document.querySelector('#lexer');
var $panes = document.querySelectorAll('.pane');
var $inputPanes = document.querySelectorAll('.inputPane');
var lastInput = '';
var inputDirty = true;
var $activeOutputElem = null;
var search = searchToObject();

var markedVersions = {
  master: 'https://cdn.jsdelivr.net/gh/markedjs/marked/lib/marked.js'
};
var markedVersionCache = {};

var iframeLoaded = false;
$previewIframe.addEventListener('load', function () {
  iframeLoaded = true;
  inputDirty = true;
});

if ('text' in search && search.text) {
  $markdownElem.value = search.text;
} else {
  fetch('./initial.md')
    .then(function (res) { return res.text(); })
    .then(function (text) {
      if ($markdownElem.value === '') {
        $markdownElem.value = text;
        inputDirty = true;
        setScrollPercent(0);
      }
    });
}

fetch('https://data.jsdelivr.com/v1/package/npm/marked')
  .then(function (res) {
    return res.json();
  })
  .then(function (json) {
    for (var i = 0; i < json.versions.length; i++) {
      var ver = json.versions[i];
      markedVersions[ver] = 'https://cdn.jsdelivr.net/npm/marked@' + ver + '/lib/marked.js';
      var opt = document.createElement('option');
      opt.textContent = ver;
      opt.value = ver;
      $markedVerElem.appendChild(opt);
    }
  })
  .then(function () {
    if ('version' in search && search.version) {
      $markedVerElem.value = search.version;
    } else {
      $markedVerElem.value = 'master';
    }

    updateVersion().then(function () {
      if ('options' in search && search.options) {
        $optionsElem.value = search.options;
      } else {
        setDefaultOptions();
      }
    });
  });

if (search.outputType) {
  $outputTypeElem.value = search.outputType;
}

fetch('./quickref.md')
  .then(function (res) { return res.text(); })
  .then(function (text) {
    document.querySelector('#quickref').value = text;
  });

function handleInputChange() {
  handleChange($inputPanes, $inputTypeElem.value);
}

function handleOutputChange() {
  $activeOutputElem = handleChange($panes, $outputTypeElem.value);
  updateLink();
}

function handleChange(panes, visiblePane) {
  var active = null;
  for (var i = 0; i < panes.length; i++) {
    if (panes[i].id === visiblePane) {
      panes[i].style.display = '';
      active = panes[i];
    } else {
      panes[i].style.display = 'none';
    }
  }
  return active;
};

$outputTypeElem.addEventListener('change', handleOutputChange, false);
handleOutputChange();
$inputTypeElem.addEventListener('change', handleInputChange, false);
handleInputChange();
$markedVerElem.addEventListener('change', updateVersion, false);

function handleInput() {
  inputDirty = true;
};

$markdownElem.addEventListener('change', handleInput, false);
$markdownElem.addEventListener('keyup', handleInput, false);
$markdownElem.addEventListener('keypress', handleInput, false);
$markdownElem.addEventListener('keydown', handleInput, false);

$optionsElem.addEventListener('change', handleInput, false);
$optionsElem.addEventListener('keyup', handleInput, false);
$optionsElem.addEventListener('keypress', handleInput, false);
$optionsElem.addEventListener('keydown', handleInput, false);

$clearElem.addEventListener('click', function () {
  $markdownElem.value = '';
  $markedVerElem.value = 'master';
  updateVersion().then(setDefaultOptions);
}, false);

function setDefaultOptions() {
  if (window.Worker) {
    messageWorker({
      task: 'defaults',
      version: markedVersions[$markedVerElem.value]}
    );
  } else {
    var defaults = marked.getDefaults();
    setOptions(defaults);
  }
}

function setOptions(opts) {
  $optionsElem.value = JSON.stringify(
    opts,
    function (key, value) {
      if (value && typeof value === 'object' && Object.getPrototypeOf(value) !== Object.prototype) {
        return undefined;
      }
      return value;
    }, ' ');
}

function searchToObject() {
  // modified from https://stackoverflow.com/a/7090123/806777
  var pairs = location.search.slice(1).split('&');
  var obj = {};

  for (var i = 0; i < pairs.length; i++) {
    if (pairs[i] === '') {
      continue;
    }

    var pair = pairs[i].split('=');

    obj[decodeURIComponent(pair.shift())] = decodeURIComponent(pair.join('='));
  }

  return obj;
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
};

function getScrollSize() {
  var e = $activeOutputElem;

  return e.scrollHeight - e.clientHeight;
};
function getScrollPercent() {
  var size = getScrollSize();

  if (size <= 0) {
    return 1;
  }

  return $activeOutputElem.scrollTop / size;
};
function setScrollPercent(percent) {
  $activeOutputElem.scrollTop = percent * getScrollSize();
};

function updateLink() {
  var outputType = '';
  if ($outputTypeElem.value !== 'preview') {
    outputType = 'outputType=' + $outputTypeElem.value + '&';
  }

  $permalinkElem.href = '?' + outputType + 'text=' + encodeURIComponent($markdownElem.value)
      + '&options=' + encodeURIComponent($optionsElem.value)
      + '&version=' + encodeURIComponent($markedVerElem.value);
  history.replaceState('', document.title, $permalinkElem.href);
}

function updateVersion() {
  if (window.Worker) {
    handleInput();
    return Promise.resolve();
  }
  var promise;
  if ($markedVerElem.value in markedVersionCache) {
    promise = Promise.resolve(markedVersionCache[$markedVerElem.value]);
  } else {
    promise = fetch(markedVersions[$markedVerElem.value])
      .then(function (res) { return res.text(); })
      .then(function (text) {
        markedVersionCache[$markedVerElem.value] = text;
        return text;
      });
  }
  return promise.then(function (text) {
    var script = document.createElement('script');
    script.textContent = text;

    $markedVer.parentNode.replaceChild(script, $markedVer);
    $markedVer = script;
  }).then(handleInput);
}

var delayTime = 1;
var checkChangeTimeout = null;
function checkForChanges() {
  if (inputDirty && (typeof marked !== 'undefined' || window.Worker)) {
    inputDirty = false;

    updateLink();

    var options = {};
    var optionsString = $optionsElem.value || '{}';
    try {
      var newOptions = JSON.parse(optionsString);
      options = newOptions;
      $optionsElem.classList.remove('error');
    } catch (err) {
      $optionsElem.classList.add('error');
    }

    var version = markedVersions[$markedVerElem.value];
    var markdown = $markdownElem.value;
    var hash = version + markdown + optionsString;
    if (lastInput !== hash) {
      lastInput = hash;
      if (window.Worker) {
        delayTime = 100;
        messageWorker({
          task: 'parse',
          version: version,
          markdown: markdown,
          options: options
        });
      } else {
        var startTime = new Date();
        var lexed = marked.lexer(markdown, options);
        var lexedList = [];
        for (var i = 0; i < lexed.length; i++) {
          var lexedLine = [];
          for (var j in lexed[i]) {
            lexedLine.push(j + ':' + jsonString(lexed[i][j]));
          }
          lexedList.push('{' + lexedLine.join(', ') + '}');
        }
        var parsed = marked.parser(lexed, options);
        var scrollPercent = getScrollPercent();
        setParsed(parsed, lexedList.join('\n'));
        setScrollPercent(scrollPercent);
        var endTime = new Date();
        delayTime = endTime - startTime;
        setResponseTime(delayTime);
        if (delayTime < 50) {
          delayTime = 50;
        } else if (delayTime > 500) {
          delayTime = 1000;
        }
      }
    }
  }
  checkChangeTimeout = window.setTimeout(checkForChanges, delayTime);
};

function setResponseTime(ms) {
  var amount = ms;
  var suffix = 'ms';
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
}

function setParsed(parsed, lexed) {
  if (iframeLoaded) {
    $previewIframe.contentDocument.body.innerHTML = parsed;
  }
  $htmlElem.value = parsed;
  $lexerElem.value = lexed;
}

var markedWorker;
function messageWorker(message) {
  if (!markedWorker || markedWorker.working) {
    if (markedWorker) {
      clearTimeout(markedWorker.timeout);
      markedWorker.terminate();
    }
    markedWorker = new Worker('worker.js');
    markedWorker.onmessage = function (e) {
      clearTimeout(markedWorker.timeout);
      markedWorker.working = false;
      switch (e.data.task) {
        case 'defaults':
          setOptions(e.data.defaults);
          break;
        case 'parse':
          $previewElem.classList.remove('error');
          $htmlElem.classList.remove('error');
          $lexerElem.classList.remove('error');
          var scrollPercent = getScrollPercent();
          setParsed(e.data.parsed, e.data.lexed);
          setScrollPercent(scrollPercent);
          setResponseTime(e.data.time);
          break;
      }
      clearTimeout(checkChangeTimeout);
      delayTime = 10;
      checkForChanges();
    };
    markedWorker.onerror = markedWorker.onmessageerror = function (err) {
      clearTimeout(markedWorker.timeout);
      var error = 'There was an error in the Worker';
      if (err) {
        if (err.message) {
          error = err.message;
        } else {
          error = err;
        }
      }
      $previewElem.classList.add('error');
      $htmlElem.classList.add('error');
      $lexerElem.classList.add('error');
      setParsed(error, error);
      setScrollPercent(0);
    };
  }
  markedWorker.working = true;
  workerTimeout(0);
  markedWorker.postMessage(message);
}

function workerTimeout(seconds) {
  markedWorker.timeout = setTimeout(function () {
    seconds++;
    markedWorker.onerror('Marked has taken longer than ' + seconds + ' second' + (seconds > 1 ? 's' : '') + ' to respond...');
    workerTimeout(seconds);
  }, 1000);
}
checkForChanges();
setScrollPercent(0);
