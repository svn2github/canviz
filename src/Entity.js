// Constructor
function Entity(defaultAttrHashName, name, canviz, rootGraph, parentGraph, immediateGraph) {
  if (!(this instanceof Entity)) return new Entity(defaultAttrHashName, name, canviz, rootGraph, parentGraph, immediateGraph);
  this.defaultAttrHashName = defaultAttrHashName;
  this.name = name;
  this.canviz = canviz;
  this.rootGraph = rootGraph;
  this.parentGraph = parentGraph;
  this.immediateGraph = immediateGraph;
  this.attrs = {};
  this.drawAttrs = {};
}

// Constants
var EVENT_TYPES = ['onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout'],
  EVENT_TYPES_LENGTH = EVENT_TYPES.length;

// Prototype
Entity.prototype = {
  constructor: Entity,
  initBB: function () {
    var matches = this.getAttr('pos').match(/([0-9.]+),([0-9.]+)/);
    var x = Math.round(matches[1]);
    var y = Math.round(this.canviz.height - matches[2]);
    this.bbRect = Rect(x, y, x, y);
  },
  getAttr: function (attrName, escString) {
    var self = this;
    if ('undefined' === typeof escString) escString = false;
    var attrValue = this.attrs[attrName];
    if ('undefined' === typeof attrValue) {
      var graph = this.parentGraph;
      while ('undefined' !== typeof graph) {
        attrValue = graph[this.defaultAttrHashName][attrName];
        if ('undefined' === typeof attrValue) {
          graph = graph.parentGraph;
        } else {
          break;
        }
      }
    }
    if (attrValue && escString) {
      attrValue = attrValue.replace(this.ESC_STRING_MATCH_RE, function (match, p1) {
        switch (p1) {
          case 'N': // fall through
          case 'E': return self.name;
          case 'T': return self.tailNode;
          case 'H': return self.headNode;
          case 'G': return self.immediateGraph.name;
          case 'L': return self.getAttr('label', true);
        }
        return match;
      });
    }
    return attrValue;
  },
  draw: function (ctx, ctxScale, redrawCanvasOnly) {
    var i, tokens, fillColor, strokeColor;
    if (!redrawCanvasOnly) {
      this.initBB();
      var bbDiv = document.createElement('div');
      this.canviz.elements.appendChild(bbDiv);
    }
    var keys = objectKeys(this.drawAttrs),
      keysLength = keys.length;
    for (var k = 0; k < keysLength; ++k) {
      var command = this.drawAttrs[keys[k]],
        tokenizer = Tokenizer(command),
        token = tokenizer.takeChars();
//      debug(command);
      if (token) {
        var dashStyle = 'solid';
        ctx.save();
        while (token) {
//          debug('processing token ' + token);
          switch (token) {
            case 'E': // filled ellipse
            case 'e': // unfilled ellipse
              var filled = ('E' == token);
              var cx = tokenizer.takeNumber();
              var cy = this.canviz.height - tokenizer.takeNumber();
              var rx = tokenizer.takeNumber();
              var ry = tokenizer.takeNumber();
              var path = Ellipse(cx, cy, rx, ry);
              break;
            case 'P': // filled polygon
            case 'p': // unfilled polygon
            case 'L': // polyline
              var filled = ('P' == token);
              var closed = ('L' != token);
              var numPoints = tokenizer.takeNumber();
              tokens = tokenizer.takeNumber(2 * numPoints); // points
              var path = Path();
              for (i = 2; i < 2 * numPoints; i += 2) {
                path.addBezier([
                  Point(tokens[i - 2], this.canviz.height - tokens[i - 1]),
                  Point(tokens[i],     this.canviz.height - tokens[i + 1])
                ]);
              }
              if (closed) {
                path.addBezier([
                  Point(tokens[2 * numPoints - 2], this.canviz.height - tokens[2 * numPoints - 1]),
                  Point(tokens[0],                  this.canviz.height - tokens[1])
                ]);
              }
              break;
            case 'B': // unfilled b-spline
            case 'b': // filled b-spline
              var filled = ('b' == token);
              var numPoints = tokenizer.takeNumber();
              tokens = tokenizer.takeNumber(2 * numPoints); // points
              var path = Path();
              for (i = 2; i < 2 * numPoints; i += 6) {
                path.addBezier([
                  Point(tokens[i - 2], this.canviz.height - tokens[i - 1]),
                  Point(tokens[i],     this.canviz.height - tokens[i + 1]),
                  Point(tokens[i + 2], this.canviz.height - tokens[i + 3]),
                  Point(tokens[i + 4], this.canviz.height - tokens[i + 5])
                ]);
              }
              break;
            case 'I': // image
              var l = tokenizer.takeNumber();
              var b = this.canviz.height - tokenizer.takeNumber();
              var w = tokenizer.takeNumber();
              var h = tokenizer.takeNumber();
              var src = tokenizer.takeString();
              if (!this.canviz.images[src]) {
                this.canviz.images[src] = CanvizImage(this.canviz, src);
              }
              this.canviz.images[src].draw(ctx, l, b - h, w, h);
              break;
            case 'T': // text
              var l = Math.round(ctxScale * tokenizer.takeNumber() + this.canviz.padding);
              var t = Math.round(ctxScale * this.canviz.height + 2 * this.canviz.padding - (ctxScale * (tokenizer.takeNumber() + this.canviz.bbScale * fontSize) + this.canviz.padding));
              var textAlign = tokenizer.takeNumber();
              var textWidth = Math.round(ctxScale * tokenizer.takeNumber());
              var str = tokenizer.takeString();
              if (!redrawCanvasOnly && !/^\s*$/.test(str)) {
//                debug('draw text ' + str + ' ' + l + ' ' + t + ' ' + textAlign + ' ' + textWidth);
                str = escapeHtml(str);
                do {
                  matches = str.match(/ ( +)/);
                  if (matches) {
                    var spaces = ' ';
                    matches[1].length.times(function () {
                      spaces += '&nbsp;';
                    });
                    str = str.replace(/  +/, spaces);
                  }
                } while (matches);
                var text;
                var href = this.getAttr('URL', true) || this.getAttr('href', true);
                if (href) {
                  var target = this.getAttr('target', true) || '_self';
                  var tooltip = this.getAttr('tooltip', true) || this.getAttr('label', true);
//                  debug(this.name + ', href ' + href + ', target ' + target + ', tooltip ' + tooltip);
                  text = document.createElement('a');
                  text.setAttribute('href', href);
                  text.setAttribute('target', target);
                  text.setAttribute('title', tooltip);
                  for (var e = 0; e < EVENT_TYPES_LENGTH; ++e) {
                    var attrName = EVENT_TYPES[e],
                      attrValue = this.getAttr(attrName, true);
                    if (attrValue) {
                      text.setAttribute(attrName, attrValue);
                    }
                  }
                  text.style.textDecoration = 'none';
                } else {
                  text = document.createElement('span');
                }
                text.innerHTML = str;
                text.style.fontSize = Math.round(fontSize * ctxScale * this.canviz.bbScale) + 'px';
                text.style.fontFamily = fontFamily;
                text.style.color = strokeColor.textColor;
                text.style.position = 'absolute';
                text.style.textAlign = (-1 == textAlign) ? 'left' : (1 == textAlign) ? 'right' : 'center';
                text.style.left = (l - (1 + textAlign) * textWidth) + 'px';
                text.style.top = t + 'px';
                text.style.width = (2 * textWidth) + 'px';
                if (1 != strokeColor.opacity) text.setOpacity(strokeColor.opacity);
                this.canviz.elements.appendChild(text);
              }
              break;
            case 'C': // set fill color
            case 'c': // set pen color
              var fill = ('C' == token);
              var color = this.parseColor(tokenizer.takeString());
              if (fill) {
                fillColor = color;
                ctx.fillStyle = color.canvasColor;
              } else {
                strokeColor = color;
                ctx.strokeStyle = color.canvasColor;
              }
              break;
            case 'F': // set font
              fontSize = tokenizer.takeNumber();
              fontFamily = tokenizer.takeString();
              switch (fontFamily) {
                case 'Times-Roman':
                  fontFamily = 'Times New Roman';
                  break;
                case 'Courier':
                  fontFamily = 'Courier New';
                  break;
                case 'Helvetica':
                  fontFamily = 'Arial';
                  break;
                default:
                  // nothing
              }
//              debug('set font ' + fontSize + 'pt ' + fontFamily);
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
                  dashStyle = style;
                  break;
                case 'bold':
                  ctx.lineWidth = 2;
                  break;
                default:
                  matches = style.match(/^setlinewidth\((.*)\)$/);
                  if (matches) {
                    ctx.lineWidth = Number(matches[1]);
                  } else {
                    debug('unknown style ' + style);
                  }
              }
              break;
            default:
              debug('unknown token ' + token);
              return;
          }
          if (path) {
            this.canviz.drawPath(ctx, path, filled, dashStyle);
            if (!redrawCanvasOnly) this.bbRect.expandToInclude(path.getBB());
            path = undefined;
          }
          token = tokenizer.takeChars();
        }
        if (!redrawCanvasOnly) {
          bbDiv.style.position = 'absolute';
          bbDiv.style.left = Math.round(ctxScale * this.bbRect.l + this.canviz.padding) + 'px';
          bbDiv.style.top= Math.round(ctxScale * this.bbRect.t + this.canviz.padding) + 'px';
          bbDiv.style.width = Math.round(ctxScale * this.bbRect.getWidth()) + 'px';
          bbDiv.style.height = Math.round(ctxScale * this.bbRect.getHeight()) + 'px';
        }
        ctx.restore();
      }
    }
  },
  parseColor: function (color) {
    var parsedColor = {opacity: 1};
    // rgb/rgba
    if (/^#(?:[0-9a-f]{2}\s*){3,4}$/i.test(color)) {
      return parseHexColor(color);
    }
    // hsv
    var matches = color.match(/^(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)$/);
    if (matches) {
      parsedColor.canvasColor = parsedColor.textColor = hsvToRgbColor(matches[1], matches[2], matches[3]);
      return parsedColor;
    }
    // named color
    var colorScheme = this.getAttr('colorscheme') || 'X11';
    var colorName = color;
    matches = color.match(/^\/(.*)\/(.*)$/);
    if (matches) {
      if (matches[1]) {
        colorScheme = matches[1];
      }
      colorName = matches[2];
    } else {
      matches = color.match(/^\/(.*)$/);
      if (matches) {
        colorScheme = 'X11';
        colorName = matches[1];
      }
    }
    colorName = colorName.toLowerCase();
    var colorSchemeName = colorScheme.toLowerCase();
    var colorSchemeData = Canviz.colors[colorSchemeName];
    if (colorSchemeData) {
      var colorData = colorSchemeData[colorName];
      if (colorData) {
        return parseHexColor('#' + colorData);
      }
    }
    colorData = Canviz.colors.fallback[colorName];
    if (colorData) {
      return parseHexColor('#' + colorData);
    }
    if (!colorSchemeData) {
      debug('unknown color scheme ' + colorScheme);
    }
    // unknown
    debug('unknown color ' + color + '; color scheme is ' + colorScheme);
    parsedColor.canvasColor = parsedColor.textColor = '#000000';
    return parsedColor;
  }
};

// Exports
module.exports = Entity;

// Dependencies
var CanvizImage = require('./Image.js');
var debug = require('./debug.js');
var Ellipse = require('./path/Ellipse.js');
var escapeHtml = require('escape-html');
var hsvToRgbColor = require('./hsvToRgbColor.js');
var objectKeys = require('./path/objectKeys.js');
var parseHexColor = require('./parseHexColor.js');
var Path = require('./path/Path.js');
var Point = require('./path/Point.js');
var Rect = require('./path/Rect.js');
var Tokenizer = require('./Tokenizer.js');
