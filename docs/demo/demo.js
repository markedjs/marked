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

var $loadingElem = document.querySelector('#loading');
var $mainElem = document.querySelector('#main');
var $markdownElem = document.querySelector('#markdown');
var $markedVerElem = document.querySelector('#markedVersion');
var $commitVerElem = document.querySelector('#commitVersion');
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
var delayTime = 1;
var checkChangeTimeout = null;
var markedWorker;

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

$commitVerElem.style.display = 'none';
$commitVerElem.addEventListener('keypress', handleAddVersion, false);

$clearElem.addEventListener('click', handleClearClick, false);

Promise.all([
  setInitialQuickref(),
  setInitialOutputType(),
  setInitialText(),
  setInitialVersion()
    .then(setInitialOptions)
]).then(function () {
  handleInputChange();
  handleOutputChange();
  checkForChanges();
  setScrollPercent(0);
  $loadingElem.style.display = 'none';
  $mainElem.style.display = 'block';
});

function setInitialText() {
  if ('text' in search) {
    $markdownElem.value = search.text;
  } else {
    return fetch('./initial.md')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        if ($markdownElem.value === '') {
          $markdownElem.value = text;
        }
      });
  }
}

function setInitialQuickref() {
  return fetch('./quickref.md')
    .then(function (res) { return res.text(); })
    .then(function (text) {
      document.querySelector('#quickref').value = text;
    });
}

function setInitialVersion() {
  return fetch('https://data.jsdelivr.com/v1/package/npm/marked')
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
      return fetch('https://api.github.com/repos/markedjs/marked/commits')
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          markedVersions['master'] = 'https://cdn.jsdelivr.net/gh/markedjs/marked@' + json[0].sha + '/lib/marked.js';
        })
        .catch(function () {
          // do nothing
          // uses url without commit
        });
    })
    .then(function () {
      if (search.version) {
        if (markedVersions[search.version]) {
          return search.version;
        } else {
          var match = search.version.match(/^(\w+):(.+)$/);
          if (match) {
            switch (match[1]) {
              case 'commit':
                addCommitVersion(search.version, match[2].substring(0, 7), match[2]);
                return search.version;
              case 'pr':
                return getPrCommit(match[2])
                  .then(function (commit) {
                    if (!commit) {
                      return 'master';
                    }
                    addCommitVersion(search.version, 'PR #' + match[2], commit);
                    return search.version;
                  });
            }
          }
        }
      }

      return 'master';
    })
    .then(function (version) {
      $markedVerElem.value = version;
    })
    .then(updateVersion);
}

function setInitialOptions() {
  if ('options' in search) {
    $optionsElem.value = search.options;
  } else {
    setDefaultOptions();
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
};

function handleVersionChange() {
  if ($markedVerElem.value === 'commit' || $markedVerElem.value === 'pr') {
    $commitVerElem.style.display = '';
  } else {
    $commitVerElem.style.display = 'none';
    updateVersion();
  }
}

function handleClearClick() {
  $markdownElem.value = '';
  $markedVerElem.value = 'master';
  $commitVerElem.style.display = 'none';
  updateVersion().then(setDefaultOptions);
}

function handleAddVersion(e) {
  if (e.which === 13) {
    switch ($markedVerElem.value) {
      case 'commit':
        var commit = $commitVerElem.value.toLowerCase();
        if (!commit.match(/^[0-9a-f]{40}$/)) {
          alert('That is not a valid commit');
          return;
        }
        addCommitVersion('commit:' + commit, commit.substring(0, 7), commit);
        $markedVerElem.value = 'commit:' + commit;
        $commitVerElem.style.display = 'none';
        $commitVerElem.value = '';
        updateVersion();
        break;
      case 'pr':
        $commitVerElem.disabled = true;
        var pr = $commitVerElem.value.replace(/\D/g, '');
        getPrCommit(pr)
          .then(function (commit) {
            $commitVerElem.disabled = false;
            if (!commit) {
              alert('That is not a valid PR');
              return;
            }
            addCommitVersion('pr:' + pr, 'PR #' + pr, commit);
            $markedVerElem.value = 'pr:' + pr;
            $commitVerElem.style.display = 'none';
            $commitVerElem.value = '';
            updateVersion();
          });
    }
  }
}

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

function addCommitVersion(value, text, commit) {
  if (markedVersions[value]) {
    return;
  }
  markedVersions[value] = 'https://cdn.jsdelivr.net/gh/markedjs/marked@' + commit + '/lib/marked.js';
  var opt = document.createElement('option');
  opt.textContent = text;
  opt.value = value;
  $markedVerElem.insertBefore(opt, $markedVerElem.firstChild);
}

function getPrCommit(pr) {
  return fetch('https://api.github.com/repos/markedjs/marked/pulls/' + pr + '/commits')
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      return json[json.length - 1].sha;
    }).catch(function () {
      // return undefined
    });
}

function setDefaultOptions() {
  if (window.Worker) {
    messageWorker({
      task: 'defaults',
      version: markedVersions[$markedVerElem.value]
    });
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
  if (markedVersionCache[$markedVerElem.value]) {
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

function checkForChanges() {
  if (inputDirty && $markedVerElem.value !== 'commit' && $markedVerElem.value !== 'pr' && (typeof marked !== 'undefined' || window.Worker)) {
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
  try {
    $previewIframe.contentDocument.body.innerHTML = parsed;
  } catch (ex) {}
  $htmlElem.value = parsed;
  $lexerElem.value = lexed;
}

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
  markedWorker.postMessage(message);
}

function workerTimeout(seconds) {
  markedWorker.timeout = setTimeout(function () {
    seconds++;
    markedWorker.onerror('Marked has taken longer than ' + seconds + ' second' + (seconds > 1 ? 's' : '') + ' to respond...');
    workerTimeout(seconds);
  }, 1000);
}
