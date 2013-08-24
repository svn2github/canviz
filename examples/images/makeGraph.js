function makeGraph() {
  function addNodes(oldNode, maxNodes) {
    var numNodes = Math.ceil(Math.random() * maxNodes);
    while (numNodes--) {
      var newNode = ++lastNode;
      graph.push(oldNode + '--' + newNode);
      addNodes(newNode, maxNodes - 1);
    }
  }

  var lastNode = 0;
  var graph = [
    'graph {',
    'node [image="temp.png", width="0.1", height="0.1"]'
  ];
  addNodes(lastNode, 4);
  graph.push('}', '');
  return graph.join('\n');
}

module.exports = makeGraph;
