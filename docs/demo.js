(function () {
	var $inputElem = document.querySelector('#input');
	var $outputTypeElem = document.querySelector('#outputType');
	var $previewElem = document.querySelector('#preview');
	var $htmlElem = document.querySelector('#html');
	var $lexerElem = document.querySelector('#lexer');
	var $syntaxElem = document.querySelector('#syntax');
	var $pane = document.querySelector('#rightContainer .pane');
	var inputDirty = true;
	var $activeElem = null;

	if (top.document.location.href.match(/\?blank=1$/)) {
		$inputElem.value = '';
	}

	var handleChange = function () {
		var panes = document.querySelectorAll('#rightContainer .pane');
		for (var i = 0; i < panes.length; i++) {
			panes[i].style.display = 'none';
		}
		$activeElem = document.querySelector('#' + $outputTypeElem.value);
		$activeElem.style.display = 'block';
	};

	$outputTypeElem.addEventListener('change', handleChange, false);
	handleChange();


	var handleInput = function () {
		inputDirty = true;
	};

	$inputElem.addEventListener('change', handleInput, false);
	$inputElem.addEventListener('keyup', handleInput, false);
	$inputElem.addEventListener('keypress', handleInput, false);
	$inputElem.addEventListener('keydown', handleInput, false);

	var jsonString = function (input) {
		var output = (input + '').
			replace(/\n/g, '\\n').
			replace(/\r/g, '\\r').
			replace(/\t/g, '\\t').
			replace(/\f/g, '\\f').
			replace(/[\\"']/g, '\\$&').
			replace(/\u0000/g, '\\0');
		return '"' + output + '"';
	};

	var getScrollSize = function () {
		var e = $activeElem;

		return e.scrollHeight - e.clientHeight;
	};
	var getScrollPercent = function () {
		var size = getScrollSize();

		if (size <= 0) {
			return 1;
		}

		return $activeElem.scrollTop / size;
	};
	var setScrollPercent = function (percent) {
		$activeElem.scrollTop = percent * getScrollSize();
	};

	var delayTime = 1;
	var checkForChanges = function () {
		if (inputDirty) {
			inputDirty = false;
			var startTime = new Date();

			// Save scroll position
			var scrollPercent = getScrollPercent();

			// Convert
			var lexed = marked.lexer($inputElem.value);

			// Grab lexed output and convert to a string before the parser
			// destroys the data
			var lexedList = [];

			for (var i = 0; i < lexed.length; i ++) {
				var lexedLine = [];
				for (var j in lexed[i]) {
					lexedLine.push(j + ":" + jsonString(lexed[i][j]));
				}
				lexedList.push("{" + lexedLine.join(", ") + "}");
			}

			var parsed = marked.parser(lexed);

			// Assign
			$previewElem.innerHTML = (parsed);
			$htmlElem.value = (parsed);
			$lexerElem.value = (lexedList.join("\n"));

			// Set the scroll percent
			setScrollPercent(scrollPercent);

			var endTime = new Date();
			delayTime = endTime - startTime;
			if (delayTime < 50) {
				delayTime = 50;
			} else if (delayTime > 500) {
				delayTime = 1000;
			}
		}
		window.setTimeout(checkForChanges, delayTime);
	};
	checkForChanges();
	setScrollPercent(0);
})();
