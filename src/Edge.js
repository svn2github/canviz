// Constructor
function Edge(name, canviz, rootGraph, parentGraph, tailNode, headNode) {
  if (!(this instanceof Edge)) return new Edge(name, canviz, rootGraph, parentGraph, tailNode, headNode);
  this.tailNode = tailNode;
  this.headNode = headNode;
  Entity.call(this, 'edgeAttrs', name, canviz, rootGraph, parentGraph, parentGraph);
}

// Parent
var Entity = require('./Entity.js');
Edge.prototype = Entity();

// Prototype
Edge.prototype.constructor = Edge;
Edge.prototype.ESC_STRING_MATCH_RE = /\\([EGTHL])/g;

// Exports
module.exports = Edge;
