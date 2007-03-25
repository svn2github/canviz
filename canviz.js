// $Id$

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
			return Number(this.takeChars())
		} else {
			var tokens = this.takeChars(num);
			while (num--) {
				tokens[num] = Number(tokens[num]);
			}
			return tokens;
		}
	},
	takeString: function() {
		var chars = Number(this.takeChars());
		if ('-' != this.str.charAt(0)) {
			return false;
		}
		var str = this.str.substr(1, chars);
		this.str = this.str.substr(1 + chars).replace(/^\s+/, '');
		return str;
	}
}

var Graph = Class.create();
Graph.prototype = {
	initialize: function(file, engine) {
		this.maxXdotVersion = 1.1;
		this.systemScale = 4/3;
		this.scale = 1;
		this.padding = 8;
		if (file) {
			this.load(file, engine);
		}
	},
	load: function(file, engine) {
		$('debug_output').innerHTML = '';
		var url = 'graph.php';
		var params = 'file=' + file;
		if (engine) {
			params += '&engine=' + engine;
		}
		new Ajax.Request(url, {
			method: 'get',
			parameters: params,
			onComplete: this.parse.bind(this)
		});
	},
	parse: function(request) {
		this.xdotversion = false;
		this.commands = new Array();
		this.width = 0;
		this.height = 0;
		this.maxWidth = false;
		this.maxHeight = false;
		this.bbEnlarge = false;
		this.bbScale = 1;
		this.orientation = 'portrait';
		this.bgcolor = '#ffffff';
		this.dashLength = 6;
		this.dotSpacing = 4;
		this.fontName = 'Times New Roman';
		this.fontSize = 14;
		var graph_src = request.responseText;
		var lines = graph_src.split('\n');
		var i = 0;
		var line, lastchar, matches, is_graph, entity, params, param_name, param_value;
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
				matches = line.match(/^(.*?)\s*{$/);
				if (matches) {
					container_stack.push(matches[1]);
//					debug('begin container ' + container_stack.last());
				} else if ('}' == line) {
//					debug('end container ' + container_stack.last());
					container_stack.pop();
				} else {
//					matches = line.match(/^(".*?[^\\]"|\S+?)\s+\[(.+)\];$/);
					matches = line.match(/^(.*?)\s+\[(.+)\];$/);
					if (matches) {
						is_graph = ('graph' == matches[1]);
//						entity = this.unescape(matches[1]);
						entity = matches[1];
						params = matches[2];
						do {
							matches = params.match(/^(\S+?)=(""|".*?[^\\]"|<(<[^>]+>|[^<>]+?)+>|\S+?)(?:,\s*|$)/);
							if (matches) {
								params = params.substr(matches[0].length);
								param_name = matches[1];
								param_value = this.unescape(matches[2]);
//								debug(param_name + ' ' + param_value);
								if (is_graph && 1 == container_stack.length) {
									switch (param_name) {
										case 'bb':
											var bb = param_value.split(/,/);
											this.width  = Number(bb[2]);
											this.height = Number(bb[3]);
											break;
										case 'bgcolor':
											this.bgcolor = this.parseColor(param_value);
											break;
										case 'size':
											var size = param_value.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
											if (size) {
												this.maxWidth  = 72 * Number(size[1]);
												this.maxHeight = 72 * Number(size[2]);
												this.bbEnlarge = ('!' == size[3]);
											} else {
												debug('can\'t parse size');
											}
											break;
										case 'orientation':
											if (param_value.match(/^l/i)) {
												this.orientation = 'landscape';
											}
											break;
										case 'rotate':
											if (90 == param_value) {
												this.orientation = 'landscape';
											}
											break;
										case 'xdotversion':
											this.xdotversion = parseFloat(param_value);
											if (this.maxXdotVersion < this.xdotversion) {
												debug('unsupported xdotversion ' + this.xdotversion + '; this script currently supports up to xdotversion ' + this.maxXdotVersion);
											}
											break;
									}
								}
								switch (param_name) {
									case '_draw_':
									case '_ldraw_':
									case '_hdraw_':
									case '_tdraw_':
									case '_hldraw_':
									case '_tldraw_':
//										debug(entity + ': ' + param_value);
										this.commands.push(param_value);
										break;
								}
							}
						} while (matches);
					}
				}
			}
		}
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
		this.display();
	},
	display: function() {
		var width  = Math.round(this.scale * this.systemScale * this.width  + 2 * this.padding);
		var height = Math.round(this.scale * this.systemScale * this.height + 2 * this.padding);
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
		ctx.save();
		ctx.lineCap = 'round';
		ctx.fillStyle = this.bgcolor;
		ctx.fillRect(0, 0, width, height);
		ctx.translate(this.padding, this.padding);
		ctx.scale(this.scale * this.systemScale, this.scale * this.systemScale);
		ctx.lineWidth = 1 / this.systemScale;
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
				ctx.save();
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
						case 'T': // text
							var x = Math.round(this.scale * this.systemScale * tokenizer.takeNumber() + this.padding);
							var y = Math.round(height - (this.scale * this.systemScale * (tokenizer.takeNumber() + this.bbScale * this.fontSize) + this.padding));
							var text_align = tokenizer.takeNumber();
							var text_width = Math.round(this.scale * this.systemScale * tokenizer.takeNumber());
							var str = tokenizer.takeString();
							if (!str.match(/^\s*$/)) {
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
								entity_text_divs += '<div style="font:' + Math.round(this.fontSize * this.scale * this.systemScale * this.bbScale) + 'px \'' + this.fontName +'\';color:' + ctx.strokeStyle + ';';
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
								ctx.fillStyle = color;
							} else {
								ctx.strokeStyle = color;
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
									ctx.lineWidth = 2 / this.systemScale;
									break;
								default:
									matches = style.match(/^setlinewidth\((.*)\)$/);
									if (matches) {
										ctx.lineWidth = Number(matches[1]) / this.systemScale;
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
				ctx.restore();
				if (entity_text_divs) {
					text_divs += '<div id="entity' + entity_id + '">' + entity_text_divs + '</div>';
				}
			}
		};
		ctx.restore();
		$('graph_texts').innerHTML = text_divs;
	},
	render: function(path, filled) {
		if (filled) {
			ctx.beginPath();
			path.draw(ctx);
			ctx.fill();
		}
		if (ctx.fillStyle != ctx.strokeStyle || !filled) {
			switch (this.dashStyle) {
				case 'dashed':
					ctx.beginPath();
					path.drawDashed(ctx, this.dashLength);
					break;
				case 'dotted':
					var oldLineWidth = ctx.lineWidth;
					ctx.lineWidth *= 2;
					ctx.beginPath();
					path.drawDotted(ctx, this.dotSpacing);
					break;
				case 'solid':
				default:
					if (!filled) {
						ctx.beginPath();
						path.draw(ctx);
					}
			}
			ctx.stroke();
			if (oldLineWidth) ctx.lineWidth = oldLineWidth;
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
		if (gvcolors[color]) { // named color
			return 'rgb(' + gvcolors[color][0] + ',' + gvcolors[color][1] + ',' + gvcolors[color][2] + ')';
		} else {
			var matches = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
			if (matches) { // rgba
				return 'rgba(' + parseInt(matches[1], 16) + ',' + parseInt(matches[2], 16) + ',' + parseInt(matches[3], 16) + ',' + (parseInt(matches[4], 16) / 255) + ')';
			} else {
				matches = color.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
				if (matches) { // hsv
					return this.hsvToRgbColor(matches[1], matches[2], matches[3]);
				} else if (color.match(/^#[0-9a-f]{6}$/i)) {
					return color;
				}
			}
		}
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
		t = v * (1 - (1 - f) * s)
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
}

function debug(str) {
	$('debug_output').innerHTML += '&raquo;' + String(str).escapeHTML() + '&laquo;<br />';
}
