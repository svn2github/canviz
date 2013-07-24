// Constructor
function Node(name, canviz, rootGraph, parentGraph) {
  if (!(this instanceof Node)) return new Node(name, canviz, rootGraph, parentGraph);
  Entity.call(this, 'nodeAttrs', name, canviz, rootGraph, parentGraph, parentGraph);
}

// Parent
var Entity = require('./Entity.js');
Node.prototype = Entity();

// Prototype
Node.prototype.constructor = Node;
Node.prototype.ESC_STRING_MATCH_RE = /\\([NGL])/g;

// Exports
module.exports = Node;
