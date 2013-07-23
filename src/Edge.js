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

// Properties
Edge.escStringMatchRe = /\\([EGTHL])/g;

// Prototype
Edge.prototype.constructor = Edge;

// Exports
module.exports = Edge;
