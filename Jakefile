var browserify = require('browserify');
var Canviz = require('./src/Canviz.js');
var diffImages = require('./test/diffImages.js');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');


desc('builds everything');
task('default', ['canviz', 'examples'], function () {});

desc('builds canviz');
task('canviz', ['build/canviz.min.js'], function () {});

desc('builds the examples');
task('examples', ['example-multiple'], function () {});

desc('makes the build directory');
directory('build');

desc('builds the concatenated canviz library for development');
file('build/canviz.js', [
  'build',
  'index.js',
  'Jakefile',
  'src/Canviz.js',
  'src/debug.js',
  'src/Edge.js',
  'src/Entity.js',
  'src/Graph.js',
  'src/hsvToRgbColor.js',
  'src/Image.js',
  'src/loadFile.js',
  'src/Node.js',
  'src/parseHexColor.js',
  'src/path/Bezier.js',
  'src/path/Ellipse.js',
  'src/path/objectKeys.js',
  'src/path/Path.js',
  'src/path/Point.js',
  'src/path/Polygon.js',
  'src/path/Rect.js',
  'src/Tokenizer.js',
  'src/unescapeAttr.js',
  'src/versionCompare.js'
], function () {
  var b = browserify('./index.js');
  b.bundle({standalone: 'Canviz'}, function (err, code) {
    if (err) console.error(err);
    else fs.writeFileSync('build/canviz.js', code, 'utf8');
    complete();
  });
}, {async: true});

desc('builds the minified canviz library for production');
file('build/canviz.min.js', ['build/canviz.js'], function () {
  var options = {
    compress: {
      unsafe: true
    },
    output: {
      ascii_only: true,
      semicolons: false
    },
    warnings: true
  };
  var code = uglify.minify('build/canviz.js', options).code;
  fs.writeFileSync('build/canviz.min.js', code, 'utf8');
});

function graphviz(infile, formats, outfiles, callback) {
  if (typeof outfiles == 'string') outfiles = [outfiles];
  if (typeof formats == 'string') formats = [formats];

  var cmd = 'dot',
    lines = fs.readFileSync(infile, {encoding: 'utf8'}).split('\n');
  lines.forEach(function (line) {
    var matches = /^#args(\s.+)$/.exec(line);
    if (matches) {
      cmd += matches[1];
    }
  });

  cmd += ' \'' + infile + '\'';
  formats.forEach(function (format) {
    cmd += ' -T\'' + format + '\'';
  });
  outfiles.forEach(function (outfile) {
    cmd += ' -o\'' + outfile + '\'';
  });

  exec(cmd, function (error, stdout, stderr) {
    if (error) jake.logger.error(stderr);
    callback();
  });
}

desc('builds the "multiple graphs" example');
task('example-multiple', function () {
  var graphs = new jake.FileList();
  graphs.include('examples/multiple/*.gv');
  graphs.exclude('examples/multiple/*-xdot.gv');
  var remaining = graphs.length();
  graphs.forEach(function (graph) {
    graphviz(graph, 'xdot', path.join(path.dirname(graph), path.basename(graph, '.gv') + '-xdot.gv'), function () {
      if (!--remaining) complete();
    });
  });
}, {async: true});

var testGraphs = new jake.FileList();
testGraphs.include('test/graphs/*.gv');

desc('runs tests');
task('test', testGraphs.toArray().map(function (graph) {
  return graph + '.png';
}), {async: true}, function () {
  var remaining = testGraphs.length();
  var results = [];
  testGraphs.forEach(function (graph) {
    var canviz = Canviz();
    canviz.setTextMode('canvas');
    canviz.parse(fs.readFileSync(graph + '.xdot', {encoding: 'utf8'}));
    var outfile = fs.createWriteStream(graph + '.xdot.png');
    outfile.on('open', function () {
      var stream = canviz.canvas.pngStream();
      stream.on('data', function (chunk) {
        outfile.write(chunk);
      });
      stream.on('end', function () {
        outfile.end(function () {
          diffImages(graph + '.png', graph + '.xdot.png', graph + '.diff.png', function (err, info) {
            if (err) jake.logger.error(err);
            info.graph = graph.replace(/^[^/]+\//, '');
            results.push(info);
            if (!--remaining) {
              var html = [
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '<meta charset="utf-8">',
                '<title>Canviz test results</title>',
                '<style>',
                'body {',
                'background: #eee;',
                'color: #000;',
                '}',
                'table {',
                'width: 100%;',
                '}',
                'td {',
                'text-align: center;',
                '}',
                '</style>',
                '</head>',
                '<body>',
                '<table>',
                '<tr>',
                '<th width="10%">File</th>',
                '<th width="30%">Graphviz PNG</th>',
                '<th width="30%">Graphviz XDOT → Canviz PNG</th>',
                '<th width="30%">Difference</th>',
                '</tr>'
              ];
              results.sort(function (a, b) {
                return a.similarity - b.similarity;
              });
              results.forEach(function (result) {
                html.push('<tr>',
                  '<td>' + path.basename(result.graph) + '<br>' + Math.round(10000 * result.similarity) / 100 + '%</td>',
                  '<td><img src="' + result.graph + '.png" width="' + result.inImage1.width +  '" height="' + result.inImage1.height +  '"></td>',
                  '<td><img src="' + result.graph + '.xdot.png" width="' + result.inImage2.width +  '" height="' + result.inImage2.height +  '"></td>',
                  '<td><img src="' + result.graph + '.diff.png" width="' + result.outImage.width +  '" height="' + result.outImage.height +  '"></td>',
                  '</tr>'
                );
              });
              html.push('</table>', '</body>', '</html>', '');
              fs.writeFile('test/results.html', html.join("\n"), complete);
            }
          });
        });
      });
    });
  });
});

rule('.gv.png', '.gv', {async: true}, function () {
  // This generates both the png and xdot representation, since it's more efficient to do both at once.
  graphviz(this.source, ['png', 'xdot'], [this.source + '.png', this.source + '.xdot'], complete);
});

desc('removes everything that was built');
task('clean', function () {
  jake.rmRf('build');
  var files = new jake.FileList();
  files.include('examples/images/temp.png');
  files.include('examples/multiple/*-xdot.gv');
  files.include('test/graphs/*.gv.diff.png');
  files.include('test/graphs/*.gv.png');
  files.include('test/graphs/*.gv.xdot');
  files.include('test/graphs/*.gv.xdot.png');
  files.include('test/results.html');
  var remaining = files.length();
  files.forEach(function (file) {
    fs.unlink(file, function () {
      jake.logger.log('rm -f ' + file);
      if (!--remaining) complete();
    });
  });
});
