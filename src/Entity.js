// Constants
var EVENT_TYPES = ['onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout'];
var EVENT_TYPES_LENGTH = EVENT_TYPES.length;
var IS_BROWSER = typeof document != 'undefined';
var TEXT_ALIGNMENTS = ['left', 'center', 'right'];

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

// Prototype
Entity.prototype = {
  constructor: Entity,
  initBB: function () {
    var matches = this.getAttr('pos').match(/([0-9.]+),([0-9.]+)/);
    var x = Number(matches[1]);
    var y = Number(matches[2]);
    this.bbRect = Rect(x, y, x, y);
  },
  getAttr: function (attrName, escString) {
    if (typeof escString == 'undefined') escString = false;
    var self = this;
    var attrValue = this.attrs[attrName];
    if (typeof attrValue == 'undefined') {
      var graph = this.parentGraph;
      while (typeof graph == 'undefined') {
        attrValue = graph[this.defaultAttrHashName][attrName];
        if (typeof attrValue == 'undefined') {
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
      if (IS_BROWSER) {
        var bbDiv = document.createElement('div');
        this.canviz.elements.appendChild(bbDiv);
      }
    }
    ctx.lineWidth = 1;
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
              var cy = tokenizer.takeNumber();
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
                  Point(tokens[i - 2], tokens[i - 1]),
                  Point(tokens[i], tokens[i + 1])
                ]);
              }
              if (closed) {
                path.addBezier([
                  Point(tokens[2 * numPoints - 2], tokens[2 * numPoints - 1]),
                  Point(tokens[0], tokens[1])
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
                  Point(tokens[i - 2], tokens[i - 1]),
                  Point(tokens[i], tokens[i + 1]),
                  Point(tokens[i + 2], tokens[i + 3]),
                  Point(tokens[i + 4], tokens[i + 5])
                ]);
              }
              break;
            case 'I': // image
              var l = tokenizer.takeNumber();
              var b = tokenizer.takeNumber();
              var w = tokenizer.takeNumber();
              var h = tokenizer.takeNumber();
              var src = tokenizer.takeString();
              if (!this.canviz.images[src]) {
                this.canviz.images[src] = CanvizImage(this.canviz, src);
              }
              this.canviz.images[src].draw(ctx, l, b - h, w, h);
              break;
            case 'T': // text
              var left = tokenizer.takeNumber(),
                bottom = tokenizer.takeNumber(),
                textAlignIndex = 1 + tokenizer.takeNumber(),
                textAlign = TEXT_ALIGNMENTS[textAlignIndex],
                textWidth = tokenizer.takeNumber(),
                str = tokenizer.takeString();
              
              if (!/^\s*$/.test(str)) {
                switch (this.canviz.textMode) {
                  case 'canvas':
                    ctx.save();
                    ctx.translate(left - textAlignIndex * textWidth / 2, bottom);
                    // Uninvert the coordinate system so text isn't drawn upside down.
                    if (this.canviz.invertY) ctx.scale(1, -1);
                    ctx.font = fontSize + 'px ' + fontFamily;
                    // xdot uses pen color for text, but canvas uses fill color
                    ctx.fillStyle = ctx.strokeStyle;
                    //var metrics = ctx.measureText(str);
                    //console.log(str, metrics);
                    ctx.fillText(str, 0, 0); // TODO: the Y-coordinate is even less correct than when using the DOM
                    ctx.restore();
                    break;
                  case 'dom':
                    if (!redrawCanvasOnly) {
                      str = escapeHtml(str).replace(/ /g, '&nbsp;');
                      left = this.canviz.paddingX + left - textAlignIndex * textWidth;
                      var top = this.canviz.paddingY + (this.canviz.invertY ? this.canviz.height - bottom : bottom) - this.canviz.bbScale * fontSize;
                      var text;
                      var href = this.getAttr('URL', true) || this.getAttr('href', true);
                      if (href) {
                        var target = this.getAttr('target', true) || '_self';
                        var tooltip = this.getAttr('tooltip', true) || this.getAttr('label', true);
//                        debug(this.name + ', href ' + href + ', target ' + target + ', tooltip ' + tooltip);
                        text = document.createElement('a');
                        text.setAttribute('href', href);
                        text.setAttribute('target', target);
                        text.setAttribute('title', tooltip);
                        for (var e = 0; e < EVENT_TYPES_LENGTH; ++e) {
                          var attrName = EVENT_TYPES[e];
                          var attrValue = this.getAttr(attrName, true);
                          if (attrValue) {
                            text.setAttribute(attrName, attrValue);
                          }
                        }
                        text.style.textDecoration = 'none';
                      } else {
                        text = document.createElement('span');
                      }
                      text.innerHTML = str;
                      text.style.fontSize = (fontSize * ctxScale * this.canviz.bbScale) + 'px';
                      text.style.fontFamily = fontFamily;
                      text.style.color = strokeColor.textColor;
                      text.style.position = 'absolute';
                      text.style.textAlign = textAlign;
                      text.style.left = ctxScale * left + 'px';
                      text.style.top = ctxScale * top + 'px';
                      text.style.width = (ctxScale * 2 * textWidth) + 'px';
                      if (strokeColor.opacity < 1) setOpacity(text, strokeColor.opacity);
                      this.canviz.elements.appendChild(text);
                    }
                    break;
                }
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
              var fontSize = tokenizer.takeNumber();
              var fontFamily = tokenizer.takeString();
              if (fontFamily == 'Times-Roman') fontFamily = 'Times';
//              debug('set font ' + fontSize + 'pt ' + fontFamily);
              break;
            case 'S': // set style
              var style = tokenizer.takeString();
              switch (style) {
                case 'solid':
                case 'filled':
                case 'tapered':
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
                  var matches = style.match(/^setlinewidth\((.*)\)$/);
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
        if (IS_BROWSER && !redrawCanvasOnly) {
          bbDiv.style.position = 'absolute';
          bbDiv.style.left = Math.round(ctxScale * (this.canviz.paddingX + this.bbRect.l)) + 'px';
          bbDiv.style.top = Math.round(ctxScale * (this.canviz.paddingY + this.bbRect.t)) + 'px';
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
    // gradient
    matches = color.match(/^(?:\[([^\]]+)\]|\(([^)]+)\))$/);
    if (matches) {
      // TODO
      parsedColor.canvasColor = parsedColor.textColor = '#000000';
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
var Canviz = require('./Canviz.js');
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
var setOpacity = require('./setOpacity.js');
var Tokenizer = require('./Tokenizer.js');
