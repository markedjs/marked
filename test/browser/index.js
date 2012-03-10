var fs = require('fs');

var main = require('../')
  , load = main.load;

var express = require('express')
  , app = express.createServer();

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

var dir = __dirname + '/../tests'
  , files = {};

app.get('/test.js', function(req, res, next) {
  var test = fs.readFileSync(__dirname + '/test.js', 'utf8')
    , files = load();

  test = test.replace('__TESTS__', JSON.stringify(files));
  test = test.replace('__MAIN__', main + '');

  res.contentType('.js');
  res.send(test);
});

app.use(express.static(__dirname + '/../../lib'));
app.use(express.static(__dirname));

app.listen(8080);
