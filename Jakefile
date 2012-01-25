var fs = require('fs');
var uglify = require('uglify-js');


desc('builds everything');
task('default', ['build/canviz.min.js'], function() {});

desc('makes the build directory');
directory('build');

desc('builds the concatenated canviz library');
file('build/canviz.js', ['build', 'path/path.js', 'src/Tokenizer.js', 'src/Entity.js', 'src/Node.js', 'src/Edge.js', 'src/Graph.js', 'src/Canviz.js', 'src/Image.js', 'src/debug.js'], function() {
  var code = [];
  ['path/path.js', 'src/Tokenizer.js', 'src/Entity.js', 'src/Node.js', 'src/Edge.js', 'src/Graph.js', 'src/Canviz.js', 'src/Image.js', 'src/debug.js'].forEach(function(file) {
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

desc('removes everything that was built');
task('clean', function() {
  ['build/canviz.js', 'build/canviz.min.js'].forEach(function(file) {
    fs.unlink(file);
  });
});
