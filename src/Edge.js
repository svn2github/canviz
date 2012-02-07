//#include 'Entity.js'

var CanvizEdge = exports.CanvizEdge = Class.create(CanvizEntity, {
	initialize: function($super, name, canviz, rootGraph, parentGraph, tailNode, headNode) {
		$super('edgeAttrs', name, canviz, rootGraph, parentGraph, parentGraph);
		this.tailNode = tailNode;
		this.headNode = headNode;
	}
});
Object.extend(CanvizEdge.prototype, {
	escStringMatchRe: /\\([EGTHL])/g
});
