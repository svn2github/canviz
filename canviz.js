// $Id$

var gvcolors = $H({
	x11:{
		black:[0,0,0],
		lightgrey:[211,211,211],
		white:[255,255,255]
	}
});

var Tokenizer = Class.create();
Tokenizer.prototype = {
	initialize: function(str) {
		this.str = str;
	},
	takeChars: function(num) {
		if (!num) {
			num = 1;
		}
		var tokens = new Array();
		while (num--) {
			var matches = this.str.match(/^(\S+)\s*/);
			if (matches) {
				this.str = this.str.substr(matches[0].length);
				tokens.push(matches[1]);
			} else {
				tokens.push(false);
			}
		}
		if (1 == tokens.length) {
			return tokens[0];
		} else {
			return tokens;
		}
	},
	takeNumber: function(num) {
		if (!num) {
			num = 1;
		}
		if (1 == num) {
			return Number(this.takeChars());
		} else {
			var tokens = this.takeChars(num);
			while (num--) {
				tokens[num] = Number(tokens[num]);
			}
			return tokens;
		}
	},
	takeString: function() {
		var byte_count = Number(this.takeChars()), char_count = 0, char_code;
		if ('-' != this.str.charAt(0)) {
			return false;
		}
		while (0 < byte_count) {
			++char_count;
			char_code = this.str.charCodeAt(char_count);
			if (0x80 > char_code) {
				--byte_count;
			} else if (0x800 > char_code) {
				byte_count -= 2;
			} else {
				byte_count -= 3;
			}
		}
		var str = this.str.substr(1, char_count);
		this.str = this.str.substr(1 + char_count).replace(/^\s+/, '');
		return str;
	}
}

var Graph = Class.create();
Graph.prototype = {
	// an alphanumeric string or a number or a double-quoted string or an HTML string
	idMatch: '([a-zA-Z\u0080-\uFFFF_][0-9a-zA-Z\u0080-\uFFFF_]*|-?(?:\\.\\d+|\\d+(?:\\.\\d*)?)|"(?:\\\\"|[^"])*"|<(?:<[^>]*>|[^<>]+?)+>)'
}
Object.extend(Graph.prototype, {
	// ID or ID:port or ID:compass_pt or ID:port:compass_pt
	nodeIdMatch: Graph.prototype.idMatch + '(?::' + Graph.prototype.idMatch + ')?(?::' + Graph.prototype.idMatch + ')?'
});
Object.extend(Graph.prototype, {
	graphMatchRe: new RegExp('^(strict\\s+)?(graph|digraph)(?:\\s+' + Graph.prototype.idMatch + ')?\\s*{$', 'i'),
	subgraphMatchRe: new RegExp('^(?:subgraph\\s+)?' + Graph.prototype.idMatch + '?\\s*{$', 'i'),
	nodeMatchRe: new RegExp('^(' + Graph.prototype.nodeIdMatch + ')\\s+\\[(.+)\\];$'),
	edgeMatchRe: new RegExp('^(' + Graph.prototype.nodeIdMatch + '\\s*-[->]\\s*' + Graph.prototype.nodeIdMatch + ')\\s+\\[(.+)\\];$'),
	attrMatchRe: new RegExp('^' + Graph.prototype.idMatch + '=' + Graph.prototype.idMatch + '(?:[,\\s]+|$)'),
	initialize: function(ctx, url) {
		this.maxXdotVersion = 1.2;
		this.scale = 1;
		this.padding = 8;
		this.ctx = ctx;
		this.images = new Hash();
		this.numImages = 0;
		this.numImagesFinished = 0;
		if (url) {
			this.load(url);
		}
	},
	setImagePath: function(imagePath) {
		this.imagePath = imagePath;
	},
	load: function(url) {
		$('debug_output').innerHTML = '';
		new Ajax.Request(url, {
			method: 'get',
			onComplete: function(response) {
				this.parse(response.responseText);
			}.bind(this)
		});
	},
	parse: function(xdot) {
		this.xdotversion = false;
		this.commands = new Array();
		this.width = 0;
		this.height = 0;
		this.maxWidth = false;
		this.maxHeight = false;
		this.bbEnlarge = false;
		this.bbScale = 1;
		this.dpi = 96;
		this.orientation = 'portrait';
		this.bgcolor = '#ffffff';
		this.dashLength = 6;
		this.dotSpacing = 4;
		this.fontName = 'Times New Roman';
		this.fontSize = 14;
		var lines = xdot.split(/\r?\n/);
		var i = 0;
		var line, lastchar, matches, is_graph, entity, attrs, attr_name, attr_value;
		var container_stack = new Array();
		while (i < lines.length) {
			line = lines[i++].replace(/^\s+/, '');
			if ('' != line && '#' != line.substr(0, 1)) {
				while (i < lines.length && ';' != (lastchar = line.substr(line.length - 1, line.length)) && '{' != lastchar && '}' != lastchar) {
					if ('\\' == lastchar) {
						line = line.substr(0, line.length - 1);
					}
					line += lines[i++];
				}
//				debug(line);
				if (0 == container_stack.length) {
					matches = line.match(this.graphMatchRe);
					if (matches) {
						entity = matches[3];
//						debug('graph: ' + entity);
					}
				} else {
					matches = line.match(this.subgraphMatchRe);
					if (matches) {
						entity = matches[1];
//						debug('subgraph: ' + entity);
					}
				}
				if (matches) {
					container_stack.push(entity);
//					debug('begin container ' + container_stack.last());
				} else if ('}' == line) {
//					debug('end container ' + container_stack.last());
					container_stack.pop();
					if (0 == container_stack.length) {
						break;
					}
				} else {
					matches = line.match(this.nodeMatchRe);
					if (matches) {
						entity = matches[1];
						attrs = matches[5];
//						debug('node: ' + entity);
					} else {
						matches = line.match(this.edgeMatchRe);
						if (matches) {
							entity = matches[1];
							attrs = matches[8];
//							debug('edge: ' + entity);
						}
					}
					if (matches) {
						is_graph = ('graph' == entity);
						do {
							if (0 == attrs.length) {
								break;
							}
							matches = attrs.match(this.attrMatchRe);
							if (matches) {
								attrs = attrs.substr(matches[0].length);
								attr_name = matches[1];
								attr_value = this.unescape(matches[2]);
//								debug(attr_name + ' ' + attr_value);
								if (is_graph && 1 == container_stack.length) {
									switch (attr_name) {
										case 'bb':
											var bb = attr_value.split(/,/);
											this.width  = Number(bb[2]);
											this.height = Number(bb[3]);
											break;
										case 'bgcolor':
											this.bgcolor = this.parseColor(attr_value);
											break;
										case 'dpi':
											this.dpi = attr_value;
											break;
										case 'size':
											var size = attr_value.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
											if (size) {
												this.maxWidth  = 72 * Number(size[1]);
												this.maxHeight = 72 * Number(size[2]);
												this.bbEnlarge = ('!' == size[3]);
											} else {
												debug('can\'t parse size');
											}
											break;
										case 'orientation':
											if (attr_value.match(/^l/i)) {
												this.orientation = 'landscape';
											}
											break;
										case 'rotate':
											if (90 == attr_value) {
												this.orientation = 'landscape';
											}
											break;
										case 'xdotversion':
											this.xdotversion = parseFloat(attr_value);
											if (this.maxXdotVersion < this.xdotversion) {
												debug('unsupported xdotversion ' + this.xdotversion + '; this script currently supports up to xdotversion ' + this.maxXdotVersion);
											}
											break;
									}
								}
								switch (attr_name) {
									case '_draw_':
									case '_ldraw_':
									case '_hdraw_':
									case '_tdraw_':
									case '_hldraw_':
									case '_tldraw_':
//										debug(entity + ': ' + attr_value);
										this.commands.push(attr_value);
										break;
								}
							} else {
								debug('can\'t read attributes for entity ' + entity + ' from ' + attrs);
							}
						} while (matches);
					}
				}
			}
		}
		this.systemScale = this.dpi / 72;
		if (!this.xdotversion) {
			this.xdotversion = 1.0;
		}
/*
		if (this.maxWidth && this.maxHeight) {
			if (this.width > this.maxWidth || this.height > this.maxHeight || this.bbEnlarge) {
				this.bbScale = Math.min(this.maxWidth / this.width, this.maxHeight / this.height);
				this.width  = Math.round(this.width  * this.bbScale);
				this.height = Math.round(this.height * this.bbScale);
			}
			if ('landscape' == this.orientation) {
				var temp    = this.width;
				this.width  = this.height;
				this.height = temp;
			}
		}
*/
//		debug('done');
		this.draw();
	},
	draw: function(redraw_canvas) {
		if (!redraw_canvas) redraw_canvas = false;
		var width  = Math.round(this.scale * this.systemScale * this.width  + 2 * this.padding);
		var height = Math.round(this.scale * this.systemScale * this.height + 2 * this.padding);
		if (!redraw_canvas) {
			canvas.width  = width;
			canvas.height = height;
			Element.setStyle(canvas, {
				width:  width  + 'px',
				height: height + 'px'
			});
			Element.setStyle('graph_container', {
				width:  width  + 'px'
			});
			$('graph_texts').innerHTML = '';
		}
		this.ctx.save();
		this.ctx.lineCap = 'round';
		this.ctx.fillStyle = this.bgcolor;
		this.ctx.fillRect(0, 0, width, height);
		this.ctx.translate(this.padding, this.padding);
		this.ctx.scale(this.scale * this.systemScale, this.scale * this.systemScale);
		var i, tokens;
		var entity_id = 0;
		var text_divs = '';
		for (var command_index = 0; command_index < this.commands.length; command_index++) {
			var command = this.commands[command_index];
//			debug(command);
			var tokenizer = new Tokenizer(command);
			var token = tokenizer.takeChars();
			if (token) {
				++entity_id;
				var entity_text_divs = '';
				this.dashStyle = 'solid';
				this.ctx.save();
				while (token) {
//					debug('processing token ' + token);
					switch (token) {
						case 'E': // filled ellipse
						case 'e': // unfilled ellipse
							var filled = ('E' == token);
							var cx = tokenizer.takeNumber();
							var cy = this.height - tokenizer.takeNumber();
							var rx = tokenizer.takeNumber();
							var ry = tokenizer.takeNumber();
							this.render(new Ellipse(cx, cy, rx, ry), filled);
							break;
						case 'P': // filled polygon
						case 'p': // unfilled polygon
						case 'L': // polyline
							var filled = ('P' == token);
							var closed = ('L' != token);
							var num_points = tokenizer.takeNumber();
							tokens = tokenizer.takeNumber(2 * num_points); // points
							var path = new Path();
							for (i = 2; i < 2 * num_points; i += 2) {
								path.addBezier([
									new Point(tokens[i - 2], this.height - tokens[i - 1]),
									new Point(tokens[i],     this.height - tokens[i + 1])
								]);
							}
							if (closed) {
								path.addBezier([
									new Point(tokens[2 * num_points - 2], this.height - tokens[2 * num_points - 1]),
									new Point(tokens[0],                  this.height - tokens[1])
								]);
							}
							this.render(path, filled);
							break;
						case 'B': // unfilled b-spline
						case 'b': // filled b-spline
							var filled = ('b' == token);
							var num_points = tokenizer.takeNumber();
							tokens = tokenizer.takeNumber(2 * num_points); // points
							var path = new Path();
							for (i = 2; i < 2 * num_points; i += 6) {
								path.addBezier([
									new Point(tokens[i - 2], this.height - tokens[i - 1]),
									new Point(tokens[i],     this.height - tokens[i + 1]),
									new Point(tokens[i + 2], this.height - tokens[i + 3]),
									new Point(tokens[i + 4], this.height - tokens[i + 5])
								]);
							}
							this.render(path, filled);
							break;
						case 'I': // image
							var x = tokenizer.takeNumber();
							var y = this.height - tokenizer.takeNumber();
							var w = tokenizer.takeNumber();
							var h = tokenizer.takeNumber();
							var src = tokenizer.takeString();
							if (!this.images[src]) {
								y -= h;
								this.images[src] = new GraphImage(this, src, x, y, w, h);
							}
							this.images[src].draw();
							break;
						case 'T': // text
							var x = Math.round(this.scale * this.systemScale * tokenizer.takeNumber() + this.padding);
							var y = Math.round(height - (this.scale * this.systemScale * (tokenizer.takeNumber() + this.bbScale * this.fontSize) + this.padding));
							var text_align = tokenizer.takeNumber();
							var text_width = Math.round(this.scale * this.systemScale * tokenizer.takeNumber());
							var str = tokenizer.takeString();
							if (!redraw_canvas && !str.match(/^\s*$/)) {
//								debug('draw text ' + str + ' ' + x + ' ' + y + ' ' + text_align + ' ' + text_width);
								str = str.escapeHTML();
								do {
									matches = str.match(/ ( +)/);
									if (matches) {
										var spaces = ' ';
										matches[1].length.times(function() {
											spaces += '&nbsp;';
										});
										str = str.replace(/  +/, spaces);
									}
								} while (matches);
								entity_text_divs += '<div style="font:' + Math.round(this.fontSize * this.scale * this.systemScale * this.bbScale) + 'px \'' + this.fontName +'\';color:' + this.ctx.strokeStyle + ';';
								switch (text_align) {
									case -1: //left
										entity_text_divs += 'left:' + x + 'px;';
										break;
									case 1: // right
										entity_text_divs += 'text-align:right;right:' + x + 'px;';
										break;
									case 0: // center
									default:
										entity_text_divs += 'text-align:center;left:' + (x - text_width) + 'px;';
										break;
								}
								entity_text_divs += 'top:' + y + 'px;width:' + (2 * text_width) + 'px">' + str + '</div>';
							}
							break;
						case 'C': // set fill color
						case 'c': // set pen color
							var fill = ('C' == token);
							var color = this.parseColor(tokenizer.takeString());
							if (fill) {
								this.ctx.fillStyle = color;
							} else {
								this.ctx.strokeStyle = color;
							}
							break;
						case 'F': // set font
							this.fontSize = tokenizer.takeNumber();
							this.fontName = tokenizer.takeString();
							switch (this.fontName) {
								case 'Times-Roman':
									this.fontName = 'Times New Roman';
									break;
								case 'Courier':
									this.fontName = 'Courier New';
									break;
								case 'Helvetica':
									this.fontName = 'Arial';
									break;
								default:
									// nothing
							}
//							debug('set font ' + this.fontSize + 'pt ' + this.fontName);
							break;
						case 'S': // set style
							var style = tokenizer.takeString();
							switch (style) {
								case 'solid':
								case 'filled':
									// nothing
									break;
								case 'dashed':
								case 'dotted':
									this.dashStyle = style;
									break;
								case 'bold':
									this.ctx.lineWidth = 2;
									break;
								default:
									matches = style.match(/^setlinewidth\((.*)\)$/);
									if (matches) {
										this.ctx.lineWidth = Number(matches[1]);
									} else {
										debug('unknown style ' + style);
									}
							}
							break;
						default:
							debug('unknown token ' + token);
							return;
					}
					token = tokenizer.takeChars();
				}
				this.ctx.restore();
				if (entity_text_divs) {
					text_divs += '<div id="entity' + entity_id + '">' + entity_text_divs + '</div>';
				}
			}
		};
		this.ctx.restore();
		if (!redraw_canvas) $('graph_texts').innerHTML = text_divs;
	},
	render: function(path, filled) {
		if (filled) {
			this.ctx.beginPath();
			path.draw(this.ctx);
			this.ctx.fill();
		}
		if (this.ctx.fillStyle != this.ctx.strokeStyle || !filled) {
			switch (this.dashStyle) {
				case 'dashed':
					this.ctx.beginPath();
					path.drawDashed(this.ctx, this.dashLength);
					break;
				case 'dotted':
					var oldLineWidth = this.ctx.lineWidth;
					this.ctx.lineWidth *= 2;
					this.ctx.beginPath();
					path.drawDotted(this.ctx, this.dotSpacing);
					break;
				case 'solid':
				default:
					if (!filled) {
						this.ctx.beginPath();
						path.draw(this.ctx);
					}
			}
			this.ctx.stroke();
			if (oldLineWidth) this.ctx.lineWidth = oldLineWidth;
		}
	},
	unescape: function(str) {
		var matches = str.match(/^"(.*)"$/);
		if (matches) {
			return matches[1].replace(/\\"/g, '"');
		} else {
			return str;
		}
	},
	parseColor: function(color) {
		// rgb/rgba
		var matches = color.match(/^#([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})?$/i);
		if (matches) {
			if (matches[4]) { // rgba
				return 'rgba(' + parseInt(matches[1], 16) + ',' + parseInt(matches[2], 16) + ',' + parseInt(matches[3], 16) + ',' + (parseInt(matches[4], 16) / 255) + ')';
			} else { // rgb
				return '#' + matches[1] + matches[2] + matches[3];
			}
		}
		// hsv
		matches = color.match(/^(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)$/);
		if (matches) {
			return this.hsvToRgbColor(matches[1], matches[2], matches[3]);
		}
		// named color
		var color_scheme = 'X11';
		var color_name = color;
		matches = color.match(/^\/(.*)\/(.*)$/);
		if (matches) {
			if (matches[1]) {
				color_scheme = matches[1];
			}
			color_name = matches[2];
		} else {
			matches = color.match(/^\/(.*)$/);
			if (matches) {
				color_scheme = 'X11';
				color_name = matches[1];
			}
		}
		color_name = color_name.toLowerCase();
		var color_scheme_name = color_scheme.toLowerCase();
		if (gvcolors.get(color_scheme_name)) {
			if (gvcolors.get(color_scheme_name)[color_name]) {
				return (3 == gvcolors.get(color_scheme_name)[color_name].length ? 'rgb(' : 'rgba(') + gvcolors.get(color_scheme_name)[color_name].join(',') + ')';
			}
		} else {
			debug('unknown color scheme ' + color_scheme);
		}
		// unknown
		debug('unknown color ' + color);
		return '#000000';
	},
	hsvToRgbColor: function(h, s, v) {
		var i, f, p, q, t, r, g, b;
		h *= 360;
		i = Math.floor(h / 60) % 6;
		f = h / 60 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			case 5: r = v; g = p; b = q; break;
		}
		return 'rgb(' + Math.round(255 * r) + ',' + Math.round(255 * g) + ',' + Math.round(255 * b) + ')';
	}
});

var GraphImage = Class.create();
GraphImage.prototype = {
	initialize: function(graph, src, x, y, w, h) {
		this.graph = graph;
		++this.graph.numImages;
		this.src = this.graph.imagePath + '/' + src;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.loaded = false;
		this.img = new Image();
		this.img.onload = this.succeeded.bind(this);
		this.img.onerror = this.finished.bind(this);
		this.img.onabort = this.finished.bind(this);
		this.img.src = this.src;
	},
	succeeded: function() {
		this.loaded = true;
		this.finished();
	},
	finished: function() {
		++this.graph.numImagesFinished;
		if (this.graph.numImages == this.graph.numImagesFinished) {
			this.graph.draw(true);
		}
	},
	draw: function() {
		if (this.loaded) {
			this.graph.ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
		}
	}
}

function debug(str) {
	$('debug_output').innerHTML += '&raquo;' + String(str).escapeHTML() + '&laquo;<br />';
}
