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

desc('builds the concatenated canviz library');
file('build/canviz.js', ['build', 'src/path/Point.js', 'src/path/Bezier.js', 'src/path/Path.js', 'src/path/Polygon.js', 'src/path/Rect.js', 'src/path/Ellipse.js', 'src/Tokenizer.js', 'src/Entity.js', 'src/Node.js', 'src/Edge.js', 'src/Graph.js', 'src/Canviz.js', 'src/Image.js', 'src/debug.js'], function() {
  var code = [];
  ['src/path/Point.js', 'src/path/Bezier.js', 'src/path/Path.js', 'src/path/Polygon.js', 'src/path/Rect.js', 'src/path/Ellipse.js', 'src/Tokenizer.js', 'src/Entity.js', 'src/Node.js', 'src/Edge.js', 'src/Graph.js', 'src/Canviz.js', 'src/Image.js', 'src/debug.js'].forEach(function(file) {
    code.push(fs.readFileSync(file, 'utf8'));
  });
  fs.writeFileSync('build/canviz.js', code.join("\n"), 'utf8');
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
