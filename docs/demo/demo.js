/* globals marked, unfetch, ES6Promise */

if (!window.Promise) {
  window.Promise = ES6Promise;
}
if (!window.fetch) {
  window.fetch = unfetch;
}

var $markdownElem = document.querySelector('#markdown');
var $optionsElem = document.querySelector('#options');
var $outputTypeElem = document.querySelector('#outputType');
var $inputTypeElem = document.querySelector('#inputType');
var $previewIframe = document.querySelector('#preview iframe');
var $permalinkElem = document.querySelector('#permalink');
var $clearElem = document.querySelector('#clear');
var $htmlElem = document.querySelector('#html');
var $lexerElem = document.querySelector('#lexer');
var $panes = document.querySelectorAll('.pane');
var $inputPanes = document.querySelectorAll('.inputPane');
var inputDirty = true;
var $activeOutputElem = null;
var changeTimeout = null;
var search = searchToObject();

var iframeLoaded = false;
$previewIframe.addEventListener('load', function () {
  iframeLoaded = true;
  inputDirty = true;
  checkForChanges();
});

if ('text' in search) {
  $markdownElem.value = search.text;
} else {
  fetch('./initial.md')
    .then(function (res) { return res.text(); })
    .then(function (text) {
      if ($markdownElem.value === '') {
        $markdownElem.value = text;
        inputDirty = true;
        clearTimeout(changeTimeout);
        checkForChanges();
        setScrollPercent(0);
      }
    });
}

if ('options' in search) {
  $optionsElem.value = search.options;
} else {
  $optionsElem.value = JSON.stringify(
    marked.getDefaults(),
    function (key, value) {
      if (value && typeof value === 'object' && Object.getPrototypeOf(value) !== Object.prototype) {
        return undefined;
      }
      return value;
    }, ' ');
}

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
  $optionsElem.value = '';
  handleInput();
}, false);

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
      + '&options=' + encodeURIComponent($optionsElem.value);
  history.replaceState('', document.title, $permalinkElem.href);
}

var delayTime = 1;
var options = {};
function checkForChanges() {
  if (inputDirty) {
    inputDirty = false;

    updateLink();

    var startTime = new Date();

    var scrollPercent = getScrollPercent();

    try {
      var optionsString = $optionsElem.value || '{}';
      var newOptions = JSON.parse(optionsString);
      options = newOptions;
      $optionsElem.classList.remove('badParse');
    } catch (err) {
      $optionsElem.classList.add('badParse');
    }

    var lexed = marked.lexer($markdownElem.value, options);

    var lexedList = [];

    for (var i = 0; i < lexed.length; i++) {
      var lexedLine = [];
      for (var j in lexed[i]) {
        lexedLine.push(j + ':' + jsonString(lexed[i][j]));
      }
      lexedList.push('{' + lexedLine.join(', ') + '}');
    }

    var parsed = marked.parser(lexed, options);

    if (iframeLoaded) {
      $previewIframe.contentDocument.body.innerHTML = (parsed);
    }
    $htmlElem.value = (parsed);
    $lexerElem.value = (lexedList.join('\n'));

    setScrollPercent(scrollPercent);

    var endTime = new Date();
    delayTime = endTime - startTime;
    if (delayTime < 50) {
      delayTime = 50;
    } else if (delayTime > 500) {
      delayTime = 1000;
    }
  }
  changeTimeout = window.setTimeout(checkForChanges, delayTime);
};
checkForChanges();
setScrollPercent(0);
