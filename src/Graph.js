var CanvizGraph = Class.create(CanvizEntity, {
	initialize: function($super, name, canviz, rootGraph, parentGraph) {
		$super('attrs', name, canviz, rootGraph, parentGraph, this);
		this.nodeAttrs = $H();
		this.edgeAttrs = $H();
		this.nodes = $A();
		this.edges = $A();
		this.subgraphs = $A();
	},
	initBB: function() {
		var coords = this.getAttr('bb').split(',');
		this.bbRect = new Rect(coords[0], this.canviz.height - coords[1], coords[2], this.canviz.height - coords[3]);
	},
	draw: function($super, ctx, ctxScale, redrawCanvasOnly) {
		$super(ctx, ctxScale, redrawCanvasOnly);
		[this.subgraphs, this.nodes, this.edges].each(function(type) {
			type.each(function(entity) {
				entity.draw(ctx, ctxScale, redrawCanvasOnly);
			});
		});
	}
});
Object.extend(CanvizGraph.prototype, {
	escStringMatchRe: /\\([GL])/g
});
