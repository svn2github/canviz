// Constructor
function Node(name, canviz, rootGraph, parentGraph) {
  if (!(this instanceof Node)) return new Node(name, canviz, rootGraph, parentGraph);
  Entity.call(this, 'nodeAttrs', name, canviz, rootGraph, parentGraph, parentGraph);
}

// Parent
var Entity = require('./Entity.js');
Node.prototype = Entity();

// Properties
Node.escStringMatchRe = /\\([NGL])/g;

// Prototype
Node.prototype.constructor = Node;

// Exports
module.exports = Node;
