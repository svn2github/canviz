var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var uglify = require('uglify-js');


desc('builds everything');
task('default', ['canviz', 'examples'], function() {});

desc('builds canviz');
task('canviz', ['build/canviz.min.js'], function() {});

desc('builds the examples');
task('examples', ['example-multiple'], function() {});

desc('makes the build directory');
directory('build');

function preprocessFile(file) {
  var includeFiles = [];
  function _preprocessFile(file) {
    includeFiles.push(file);
    var lines = fs.readFileSync(file, 'utf8').split("\n");
    for (var i = 0; i < lines.length; ++i) {
      var matches = /^\s*\/\/#include\s*(?:'([^']+)'|"([^"]+)")\s*$/.exec(lines[i]);
      if (matches) {
        var includeFile = path.join(path.dirname(file), matches[1]);
        if (includeFiles.indexOf(includeFile) === -1) {
          lines[i] = _preprocessFile(includeFile);
        } else {
          lines.splice(i--, 1);
        }
      }
    }
    return lines.join("\n");
  }
  return _preprocessFile(file);
}

desc('builds the concatenated canviz library');
file('build/canviz.js', [
  'build',
  'src/Canviz.js',
  'src/debug.js',
  'src/Edge.js',
  'src/Entity.js',
  'src/Graph.js',
  'src/Image.js',
  'src/Node.js',
  'src/path/Bezier.js',
  'src/path/Ellipse.js',
  'src/path/Path.js',
  'src/path/Point.js',
  'src/path/Polygon.js',
  'src/path/Rect.js',
  'src/Tokenizer.js',
], function() {
  var code = preprocessFile('src/all.js');
  fs.writeFileSync('build/canviz.js', code, 'utf8');
});

desc('builds the minified canviz library for production');
file('build/canviz.min.js', ['build/canviz.js'], function() {
  var code = fs.readFileSync('build/canviz.js', 'utf8');
  var uglify_options = {
    strict_semicolons: true,
    mangle_options: {except: ['$super']},
    gen_options: {ascii_only: true},
  };
  var minified_code = uglify(code, uglify_options);
  fs.writeFileSync('build/canviz.min.js', minified_code, 'utf8');
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
  rimraf('build', {gently: true}, complete);
}, {async: true});
