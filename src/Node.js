//#include 'Entity.js'

var CanvizNode = exports.CanvizNode = Class.create(CanvizEntity, {
	initialize: function($super, name, canviz, rootGraph, parentGraph) {
		$super('nodeAttrs', name, canviz, rootGraph, parentGraph, parentGraph);
	}
});
Object.extend(CanvizNode.prototype, {
	escStringMatchRe: /\\([NGL])/g
});
