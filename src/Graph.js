// Constructor
function Graph(name, canviz, rootGraph, parentGraph) {
  if (!(this instanceof Graph)) return new Graph(name, canviz, rootGraph, parentGraph);
  this.nodeAttrs = {};
  this.edgeAttrs = {};
  this.nodes = [];
  this.edges = [];
  this.subgraphs = [];
  Entity.call(this, 'attrs', name, canviz, rootGraph, parentGraph, this);
}

// Parent
var Entity = require('./Entity.js');
Graph.prototype = Entity();

// Prototype
Graph.prototype.constructor = Graph;
Graph.prototype.initBB = function () {
    var coords = this.getAttr('bb').split(',');
    this.bbRect = Rect(coords[0], this.canviz.height - coords[1], coords[2], this.canviz.height - coords[3]);
};
Graph.prototype.draw = function (ctx, ctxScale, redrawCanvasOnly) {
  Entity.prototype.draw.call(this, ctx, ctxScale, redrawCanvasOnly);
  var types = [this.subgraphs, this.nodes, this.edges],
    typesLength = types.length;
  for (var t = 0; t < typesLength; ++t) {
    var entities = types[t],
      entitiesLength = entities.length;
    for (var e = 0; e < entitiesLength; ++e) {
      entities[e].draw(ctx, ctxScale, redrawCanvasOnly);
    }
  }
};
Graph.prototype.ESC_STRING_MATCH_RE = /\\([GL])/g;

// Exports
module.exports = Graph;

// Dependencies
var Rect = require('./path/Rect.js');
