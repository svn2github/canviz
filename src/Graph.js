// Constructor
function Graph(name, canviz, rootGraph, parentGraph) {
  this.nodeAttrs = $H();
  this.edgeAttrs = $H();
  this.nodes = $A();
  this.edges = $A();
  this.subgraphs = $A();
  Entity.call(this, 'attrs', name, canviz, rootGraph, parentGraph, this);
}

// Parent
var Entity = require('./Entity.js');
Graph.prototype = new Entity();

// Properties
Graph.escStringMatchRe = /\\([GL])/g;

// Prototype
Graph.prototype.constructor = Graph;
Graph.prototype.initBB = function () {
    var coords = this.getAttr('bb').split(',');
    this.bbRect = new Rect(coords[0], this.canviz.height - coords[1], coords[2], this.canviz.height - coords[3]);
};
Graph.prototype.draw = function (ctx, ctxScale, redrawCanvasOnly) {
  Entity.prototype.draw.call(this, ctx, ctxScale, redrawCanvasOnly);
    [this.subgraphs, this.nodes, this.edges].each(function (type) {
      type.each(function (entity) {
        entity.draw(ctx, ctxScale, redrawCanvasOnly);
      });
    });
};

// Exports
module.exports = Graph;

// Dependencies
var Rect = require('./path/Rect.js');
