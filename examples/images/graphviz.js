var spawn = require('child_process').spawn;

function graphviz(layout, format, graph, callback) {
  var options = {
    env: {
      GV_FILE_PATH: __dirname,
      PATH: process.env.PATH,
      SERVER_NAME: 'example'
    }
  };
  var spawned = spawn(layout, ['-T' + format], options);

  function readStderr() {
    var chunk;
    while ((chunk = spawned.stderr.read()) !== null) {
      console.error(chunk.toString());
    }
  }
  spawned.stderr.on('readable', readStderr);

  var stdout = [];
  function readStdout() {
    var chunk;
    while ((chunk = spawned.stdout.read()) !== null) {
      stdout.push(chunk);
    }
  }
  spawned.stdout.on('readable', readStdout);
  spawned.stdout.on('end', function () {
    callback(null, Buffer.concat(stdout).toString());
  });

  spawned.stdin.end(graph);
}

module.exports = graphviz;
