var browserify = require('browserify');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');


desc('builds everything');
task('default', ['canviz', 'examples'], function() {});

desc('builds canviz');
task('canviz', ['build/canviz.min.js'], function() {});

desc('builds the examples');
task('examples', ['example-multiple'], function() {});

desc('makes the build directory');
directory('build');

desc('builds the concatenated canviz library for development');
file('build/canviz.js', [
  'build',
  'index.js',
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
], function() {
  var b = browserify('./index.js');
  b.bundle({standalone: 'Canviz'}, function(err, code) {
    if (err) console.error(err);
    else fs.writeFileSync('build/canviz.js', code, 'utf8');
    complete();
  });
}, {async: true});

desc('builds the minified canviz library for production');
file('build/canviz.min.js', ['build/canviz.js'], function() {
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

function graphviz(infile, outfile, format, cb) {
  var cmd = 'dot -T\'' + format + '\' -o\'' + outfile + '\' \'' + infile + '\'';
  exec(cmd, function(error, stdout, stderr) {
    if (error !== null) {
      console.log(stderr);
    }
    cb();
  });
}

desc('builds the "multiple graphs" example');
task('example-multiple', function() {
  var graphs = new jake.FileList();
  graphs.include('examples/multiple/*.gv');
  graphs.exclude('examples/multiple/*-xdot.gv');
  var remaining = graphs.length();
  graphs.forEach(function(graph) {
    graphviz(graph, path.join(path.dirname(graph), path.basename(graph, '.gv') + '-xdot.gv'), 'xdot', function() {
      if (0 == --remaining) {
        complete();
      }
    });
  });
}, {async: true});

desc('removes everything that was built');
task('clean', function() {
  jake.rmRf('build');
});
