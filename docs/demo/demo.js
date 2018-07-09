/* globals marked, unfetch, ES6Promise */

if (!window.Promise) {
  window.Promise = ES6Promise;
}
if (!window.fetch) {
  window.fetch = unfetch;
}

var $inputElem = document.querySelector('#input');
var $outputTypeElem = document.querySelector('#outputType');
var $previewIframe = document.querySelector('#preview iframe');
var $permalinkElem = document.querySelector('#permalink');
var $clearElem = document.querySelector('#clear');
var $htmlElem = document.querySelector('#html');
var $lexerElem = document.querySelector('#lexer');
var $panes = document.querySelectorAll('.pane');
var inputDirty = true;
var $activeElem = null;
var changeTimeout = null;
var search = searchToObject();

var iframeLoaded = false;
$previewIframe.addEventListener('load', function () {
  iframeLoaded = true;
  inputDirty = true;
  checkForChanges();
})

if ('text' in search) {
  $inputElem.value = search.text;
} else {
  fetch('./initial.md')
    .then(function (res) { return res.text(); })
    .then(function (text) {
      if ($inputElem.value === '') {
        $inputElem.value = text;
        inputDirty = true;
        clearTimeout(changeTimeout);
        checkForChanges();
        setScrollPercent(0);
      }
    });
}

if (search.outputType) {
  $outputTypeElem.value = search.outputType;
}

fetch('./quickref.md')
  .then(function (res) { return res.text(); })
  .then(function (text) {
    document.querySelector('#quickref').value = text;
  });

function handleChange() {
  for (var i = 0; i < $panes.length; i++) {
    $panes[i].style.display = 'none';
  }
  $activeElem = document.querySelector('#' + $outputTypeElem.value);
  $activeElem.style.display = '';

  updateLink();
};

$outputTypeElem.addEventListener('change', handleChange, false);
handleChange();

function handleInput() {
  inputDirty = true;
};

$inputElem.addEventListener('change', handleInput, false);
$inputElem.addEventListener('keyup', handleInput, false);
$inputElem.addEventListener('keypress', handleInput, false);
$inputElem.addEventListener('keydown', handleInput, false);

$clearElem.addEventListener('click', function () {
  $inputElem.value = '';
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
  var e = $activeElem;

  return e.scrollHeight - e.clientHeight;
};
function getScrollPercent() {
  var size = getScrollSize();

  if (size <= 0) {
    return 1;
  }

  return $activeElem.scrollTop / size;
};
function setScrollPercent(percent) {
  $activeElem.scrollTop = percent * getScrollSize();
};

function updateLink() {
  var outputType = '';
  if ($outputTypeElem.value !== 'preview') {
    outputType = 'outputType=' + $outputTypeElem.value + '&';
  }

  $permalinkElem.href = '?' + outputType + 'text=' + encodeURIComponent($inputElem.value);
  history.replaceState('', document.title, $permalinkElem.href);
}

var delayTime = 1;
function checkForChanges() {
  if (inputDirty) {
    inputDirty = false;

    updateLink();

    var startTime = new Date();

    var scrollPercent = getScrollPercent();

    var lexed = marked.lexer($inputElem.value);

    var lexedList = [];

    for (var i = 0; i < lexed.length; i++) {
      var lexedLine = [];
      for (var j in lexed[i]) {
        lexedLine.push(j + ':' + jsonString(lexed[i][j]));
      }
      lexedList.push('{' + lexedLine.join(', ') + '}');
    }

    var parsed = marked.parser(lexed);

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
