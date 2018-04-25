/* globals marked, unfetch, ES6Promise */

if (!window.Promise) {
  window.Promise = ES6Promise;
}
if (!window.fetch) {
  window.fetch = unfetch;
}

var $version = document.querySelector('#version');

var $inputElem = document.querySelector('#input');
var $outputTypeElem = document.querySelector('#outputType');
var $previewElem = document.querySelector('#preview');
var $permalinkElem = document.querySelector('#permalink');
var $clearElem = document.querySelector('#clear');
var $htmlElem = document.querySelector('#html');
var $lexerElem = document.querySelector('#lexer');
var $panes = document.querySelectorAll('.pane');
var $specUrls = document.querySelectorAll('.spec-url');

var $spec = document.querySelector('#spec');
var $smartypants = document.querySelector('#smartypants');

var inputDirty = true;
var $activeElem = null;
var changeTimeout = null;
var search = searchToObject();

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

if (search.spec) {
  $spec.value = search.spec;
}

if (search.smartypants) {
  $smartypants.checked = true;
}

fetch('./quickref.md')
  .then(function (res) { return res.text(); })
  .then(function (text) {
    document.querySelector('#quickref').value = text;
  });

fetch('https://cdn.jsdelivr.net/npm/marked/package.json')
  .then(function (res) { return res.json(); })
  .then(function (json) {
    $version.textContent = 'v' + json.version;
  });

function handleOutputTypeChange() {
  for (var i = 0; i < $panes.length; i++) {
    $panes[i].style.display = 'none';
  }
  $activeElem = document.querySelector('#' + $outputTypeElem.value);
  $activeElem.style.display = 'block';

  updateLink();
};

$outputTypeElem.addEventListener('change', handleOutputTypeChange, false);
handleOutputTypeChange();

function handleSpecChange() {
  for (var i = 0; i < $specUrls.length; i++) {
    $specUrls[i].style.display = 'none';
  }
  var $activeSpec = document.querySelector('#' + $spec.value + '-spec-url');
  $activeSpec.style.display = 'inline';
}

function handleInput() {
  inputDirty = true;
};

$spec.addEventListener('change', function () {
  handleSpecChange();
  handleInput();
}, false);
handleSpecChange();

$smartypants.addEventListener('change', handleInput, false);
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
  var href = '';
  if ($outputTypeElem.value !== 'preview') {
    href += 'outputType=' + $outputTypeElem.value + '&';
  }

  if ($spec.value) {
    href += 'spec=' + $spec.value + '&';
  }

  if ($smartypants.checked) {
    href += 'smartypants=1&';
  }

  $permalinkElem.href = '?' + href + 'text=' + encodeURIComponent($inputElem.value);
  history.replaceState('', document.title, $permalinkElem.href);
}

var delayTime = 1;
function checkForChanges() {
  if (inputDirty) {
    inputDirty = false;

    updateLink();

    marked.setOptions({
      pedantic: $spec.value === 'pedantic',
      gfm: $spec.value === 'gfm',
      smartypants: $smartypants.checked
    });

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

    $previewElem.innerHTML = (parsed);
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
