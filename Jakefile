var fs = require('fs');
var uglify = require('uglify-js');


desc('builds everything');
task('default', ['canviz.min.js'], function() {});

desc('builds a minified JS file for production');
file('canviz.min.js', ['path/path.js', 'canviz.js'], function() {
  var orig_code = fs.readFileSync('path/path.js', 'utf8') + fs.readFileSync('canviz.js', 'utf8');
  var uglify_options = {
    strict_semicolons: true,
    mangle_options: {except: ['$super']},
    gen_options: {ascii_only: true},
  };
  var final_code = uglify(orig_code, uglify_options);
  fs.writeFileSync('canviz.min.js', final_code, 'utf8');
});

desc('removes everything that was built');
task('clean', function() {
  fs.unlink('canviz.min.js');
});
