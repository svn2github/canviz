var express = require('express');
var fs = require('fs');
var graphviz = require('./graphviz.js');
var makeGraph = require('./makeGraph.js');
var makeImageCanvas = require('./makeImageCanvas.js');
var path = require('path');

var app = module.exports = express();

app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, '..', 'contentloaded')));
app.use('/js', express.static(path.join(__dirname, '..', '..', 'build')));
app.set('image_radius', 20);

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.contentType('text/plain');
  res.send(err.message);
});

app.get('/graph.gv.xdot', function (req, res) {
  var graph = makeGraph();
  graphviz('neato', 'xdot', graph, function (err, xdot) {
    if (err) return next(err);
    res.contentType('text/vnd.graphviz');
    var i = 999;
    res.send(xdot.replace(/-temp\.png/g, function () {
      return '-' + ++i + '.png';
    }));
  });
});

app.get('/:random.png', function (req, res) {
  var portion = Math.random();
  var canvas = makeImageCanvas(app.get('image_radius'), portion);

  setTimeout(function () {
    res.contentType('image/png');
    var stream = canvas.pngStream();
    stream.on('data', function (chunk) {
      res.write(chunk);
    });
    stream.on('end', function () {
      res.end();
    });
  }, Math.round(1000 * portion));
});

var canvas = makeImageCanvas(app.get('image_radius'), 0);
var out = fs.createWriteStream(path.join(__dirname, 'temp.png'));
var stream = canvas.pngStream();
stream.on('data', function (chunk) {
  out.write(chunk);
});
stream.on('end', function () {
  out.end();
});
