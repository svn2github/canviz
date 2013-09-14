// Constants
var EVENT_TYPES = ['onclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout'];
var EVENT_TYPES_LENGTH = EVENT_TYPES.length;
var IS_BROWSER = typeof document != 'undefined';
var TEXT_ALIGNMENTS = ['left', 'center', 'right'];
var TEXT_BOLD = 1;
var TEXT_ITALIC = 2;
var TEXT_SUBSCRIPT = 16;
var TEXT_SUPERSCRIPT = 8;
var TEXT_UNDERLINE = 4;

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
    var xy = this.getAttr('pos').split(',');
    var x = Number(xy[0]);
    var y = Number(xy[1]);
    this.bbRect = Rect(x, y, x, y);
  },
  getAttr: function (attrName, escString) {
    if (typeof escString == 'undefined') escString = false;
    var self = this;
    var attrValue = this.attrs[attrName];
    if (typeof attrValue == 'undefined') {
      var graph = this.parentGraph;
      while (typeof graph != 'undefined') {
        attrValue = graph[this.defaultAttrHashName][attrName];
        if (typeof attrValue != 'undefined') break;
        graph = graph.parentGraph;
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
        var bbScale = this.canviz.bbScale;
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

              ctx.save();
              ctx.translate(l, b);
              // Uninvert the coordinate system so the image isn't drawn upside down.
              if (this.canviz.invertY) ctx.scale(1, -1);
              this.canviz.images[src].draw(ctx, 0, -h, w, h);
              ctx.restore();
              break;
            case 'T': // text
              var x = tokenizer.takeNumber(),
                baseline = tokenizer.takeNumber(),
                textAlignIndex = 1 + tokenizer.takeNumber(),
                textAlign = TEXT_ALIGNMENTS[textAlignIndex],
                textWidth = tokenizer.takeNumber(),
                str = tokenizer.takeString();
              
              if (!/^\s*$/.test(str)) {
                // Prior to xdotversion 1.5 (Graphviz version 2.33.20130906.0446,
                // git commit 5059989a0e35c3423da5b870480748569c61fb4a) the
                // Y-coordinate of text operations in xdot neglects to take
                // into account the yoffset_centerline. The error for "simple"
                // strings is 0.2 * fontSize and 1 for complex ones;
                // unfortunately xdot does not tell us whether a string is
                // simple or complex. We adjust for the more common simple
                // case, though this causes complex strings to look worse.
                // http://www.graphviz.org/mantisbt/view.php?id=2333
                var yError = this.canviz.bugs.textY * 0.2 * fontSize;
                switch (this.canviz.textMode) {
                  case 'canvas':
                    ctx.save();
                    var font = '';
                    if (textStyle & TEXT_BOLD) font += 'bold ';
                    if (textStyle & TEXT_ITALIC) font += 'italic ';
                    ctx.font = font + fontSize + 'px ' + fontFamily;
                    var metrics = ctx.measureText ? ctx.measureText(str) : {};
                    textWidth = metrics.width || textWidth;
                    ctx.translate(x - textAlignIndex * textWidth / 2, baseline);
                    // Uninvert the coordinate system so the text isn't drawn upside down.
                    if (this.canviz.invertY) ctx.scale(1, -1);
                    // Correct the pre-xdotversion-1.5 Y-coordinate error.
                    ctx.translate(0, -yError);
                    // xdot uses pen color for text, but canvas uses fill color
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fillText(str, 0, 0);
                    if (textStyle & TEXT_UNDERLINE) {
                      var emHeightAscent =  metrics.emHeightAscent || fontSize;
                      var emHeightDescent = metrics.emHeightDescent || fontSize / 4; // wild approximation
                      var emHeight = emHeightAscent + emHeightDescent;
                      var underlinePosition = emHeightDescent / 2; // wild approximation
                      ctx.lineWidth = emHeight / 18; // wild approximation
                      ctx.lineCap = 'butt';
                      ctx.beginPath();
                      ctx.moveTo(0, underlinePosition);
                      ctx.lineTo(textWidth, underlinePosition);
                      ctx.stroke();
                    }

                    if (0) {
                      // "actualBoundingBox"
                      ctx.lineCap = 'butt';
                      ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
                      ctx.lineWidth = 1.5;
                      ctx.beginPath();
                      ctx.moveTo(-metrics.actualBoundingBoxLeft, -metrics.actualBoundingBoxAscent);
                      ctx.lineTo(metrics.actualBoundingBoxRight, -metrics.actualBoundingBoxAscent);
                      ctx.lineTo(metrics.actualBoundingBoxRight, metrics.actualBoundingBoxDescent);
                      ctx.lineTo(-metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxDescent);
                      ctx.closePath();
                      ctx.stroke();
                      // "emHeight"
                      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
                      ctx.beginPath();
                      ctx.moveTo(fontSize / 4, -metrics.emHeightAscent);
                      ctx.lineTo(0, -metrics.emHeightAscent);
                      ctx.lineTo(0, metrics.emHeightDescent);
                      ctx.lineTo(fontSize / 4, metrics.emHeightDescent);
                      ctx.moveTo(metrics.width - fontSize / 4, -metrics.emHeightAscent);
                      ctx.lineTo(metrics.width, -metrics.emHeightAscent);
                      ctx.lineTo(metrics.width, metrics.emHeightDescent);
                      ctx.lineTo(metrics.width - fontSize / 4, metrics.emHeightDescent);
                      ctx.stroke();
                      // "alphabeticBaseline"
                      ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                      ctx.lineWidth = 1;
                      ctx.beginPath();
                      ctx.moveTo(0, metrics.alphabeticBaseline);
                      ctx.lineTo(metrics.width, metrics.alphabeticBaseline);
                      ctx.stroke();
                    }

                    ctx.restore();
                    break;
                  case 'dom':
                    if (!redrawCanvasOnly) {
                      str = escapeHtml(str).replace(/ /g, '&nbsp;');
                      var left = this.canviz.marginX + bbScale * (this.canviz.paddingX + x - textAlignIndex * textWidth);
                      var top = this.canviz.marginY + bbScale * (this.canviz.paddingY + (this.canviz.invertY ? this.canviz.height - baseline : baseline) - fontSize);
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
                      } else {
                        text = document.createElement('span');
                      }
                      text.innerHTML = str;
                      var style = text.style;
                      style.color = strokeColor.textColor;
                      style.fontFamily = fontFamily;
                      style.fontSize = ctxScale * bbScale * fontSize + 'px';
                      style.fontStyle = textStyle & TEXT_ITALIC ? 'italic' : 'normal';
                      style.fontWeight = textStyle & TEXT_BOLD ? 'bold' : 'normal';
                      style.left = ctxScale * left + 'px';
                      style.position = 'absolute';
                      style.textAlign = textAlign;
                      style.textDecoration = textStyle & TEXT_UNDERLINE ? 'underline' : 'none';
                      style.top = ctxScale * top + 'px';
                      style.width = ctxScale * bbScale * 2 * textWidth + 'px';
                      if (strokeColor.opacity < 1) setOpacity(text, strokeColor.opacity);
                      this.canviz.elements.appendChild(text);
                    }
                    break;
                }
              }
              break;
            case 't': // set text style
              var textStyle = tokenizer.takeNumber();
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
          bbDiv.style.left = Math.round(ctxScale * (this.canviz.marginX + bbScale * (this.canviz.paddingX + this.bbRect.l))) + 'px';
          var y = Math.round(ctxScale * (this.canviz.marginY + bbScale * (this.canviz.paddingY + this.bbRect.t)));
          var h = Math.round(ctxScale * bbScale * this.bbRect.getHeight());
          bbDiv.style.top = (this.canviz.invertY ? this.canviz.canvas.height - y - h : y) + 'px';
          bbDiv.style.width = Math.round(ctxScale * bbScale * this.bbRect.getWidth()) + 'px';
          bbDiv.style.height = h + 'px';
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
    matches = color.match(/^(\[[^\]]+\]|\(([^)]+)\))$/);
    if (matches) {
      var ctx = this.canviz.ctx;
      var match = matches[1];
      var radial = matches[2];
      var tokenizer = Tokenizer(match.substr(1, match.length - 2));
      var x0 = tokenizer.takeNumber();
      var y0 = tokenizer.takeNumber();
      var r0, x1, y1, r1, colorStops, gradient;
      if (radial) r0 = tokenizer.takeNumber();
      x1 = tokenizer.takeNumber();
      y1 = tokenizer.takeNumber();
      if (this.canviz.bugs.gradY) {
        // Prior to xdotversion 1.5 (Graphviz version 2.34.0, git commit
        // 7baedbfdd2607942bd74cc22fe6130aceb5dc0fc) the gradient Y-coordinate
        // is inadvertently mirrored across the bottom edge of the graph.
        // http://graphviz.org/mantisbt/view.php?id=2336
        if (this.canviz.invertY) {
          y0 *= -1;
          y1 *= -1;
        } else {
          y0 -= this.canviz.height;
          y1 -= this.canviz.height;
          r1 = y1;
          y1 = y0;
          y0 = r1;
        }
      }
      if (radial) {
        r1 = tokenizer.takeNumber();
        if (this.canviz.bugs.gradAngle) {
          // In xdotversion 1.5 (Graphviz version 2.34.0 to 2.35.20130913.0446
          // inclusive, fixed in git commit 99a0ab64cba065db6ba14e167f9a05481c227e9c)
          // the radial gradient angle is inverted. (x1, y1) happens to be the
          // center, so we can reflect y0 across the line y=y1.
          // http://www.graphviz.org/mantisbt/view.php?id=2367
          y0 += 2 * (y1 - y0);
        }
        gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
      } else {
        gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      }
      colorStops = tokenizer.takeNumber();
      while (colorStops--) {
        gradient.addColorStop(tokenizer.takeNumber(), tokenizer.takeString());
      }
      parsedColor.canvasColor = gradient;
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
