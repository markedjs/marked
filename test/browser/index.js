var fs = require('fs'),
    path = require('path');

var testMod = require('../'),
    load = testMod.load;

var express = require('express'),
    app = express();

var files = load();

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();
});

app.get('/test.js', function(req, res, next) {
  var test = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8');
  var testScript = test.replace('__TESTS__', JSON.stringify(files))
    .replace('__MAIN__', testMod.runTests + '')
    .replace('__LIBS__', testMod.testFile + '');

  res.contentType('.js');
  res.send(testScript);
});

app.use(express.static(path.join(__dirname, '/../../lib')));
app.use(express.static(__dirname));

app.listen(8080);
