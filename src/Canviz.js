// Require Path first to load the circular dependencies in the right order
var Path = require('./path/Path.js');

// Constants
var IS_BROWSER = typeof document != 'undefined';
var XDOT_DPI = 72;

// Constructor
function Canviz(container, url, urlParams) {
  if (!(this instanceof Canviz)) return new Canviz(container, url, urlParams);
  var textModes = this._textModes = [];
  this.canvas = new Canvas(0, 0);
  if (!Canviz.canvasCounter) Canviz.canvasCounter = 0;
  this.canvas.id = 'canviz_canvas_' + ++Canviz.canvasCounter;
  if (IS_BROWSER) {
    this.canvas.style.position = 'absolute';
    this.elements = document.createElement('div');
    this.elements.style.position = 'absolute';
    this.container = typeof container == 'string' ? document.getElementById(container) : container;
    this.container.style.position = 'relative';
    this.container.appendChild(this.canvas);
    if (typeof G_vmlCanvasManager != 'undefined') {
      G_vmlCanvasManager.initElement(this.canvas);
      this.canvas = document.getElementById(this.canvas.id);
    }
    this.container.appendChild(this.elements);
    textModes.push('dom');
  }
  this.ctx = this.canvas.getContext('2d');
  if (this.ctx.fillText) textModes.push('canvas');
  this.setTextMode(textModes[0]);
  this.setScale(1);
  this.dashLength = 6;
  this.dotSpacing = 4;
  this.graphs = [];
  this.images = {};
  this.imagePath = '';
  if (url) {
    this.load(url, urlParams);
  }
}

// Properties
Canviz.Path = Path;
Canviz.colors = {
  fallback: {
    black: '000000',
    lightgrey: 'd3d3d3',
    white: 'ffffff'
  }
};
Canviz.addColors = function (colors) {
  var keys = objectKeys(colors),
    keysLength = keys.length;
  for (var i = 0; i < keysLength; ++i) {
    var key = keys[i];
    Canviz.colors[key] = colors[key];
  }
};

// Constants
var MAX_XDOT_VERSION = '1.5';
// An alphanumeric string or a number or a double-quoted string or an HTML string
var ID_MATCH = '([a-zA-Z\u0080-\uFFFF_][0-9a-zA-Z\u0080-\uFFFF_]*|-?(?:\\.\\d+|\\d+(?:\\.\\d*)?)|"(?:\\\\"|[^"])*"|<(?:<[^>]*>|[^<>]+?)+>)';
// ID or ID:port or ID:compassPoint or ID:port:compassPoint
var NODE_ID_MATCH = ID_MATCH + '(?::' + ID_MATCH + ')?(?::' + ID_MATCH + ')?';
// Regular expressions used by the parser
var GRAPH_MATCH_RE = new RegExp('^(strict\\s+)?(graph|digraph)(?:\\s+' + ID_MATCH + ')?\\s*{$', 'i');
var SUBGRAPH_MATCH_RE = new RegExp('^(?:subgraph\\s+)?' + ID_MATCH + '?\\s*{$', 'i');
var NODE_MATCH_RE = new RegExp('^(' + NODE_ID_MATCH + ')\\s+\\[(.+)\\];$');
var EDGE_MATCH_RE = new RegExp('^(' + NODE_ID_MATCH + '\\s*-[->]\\s*' + NODE_ID_MATCH + ')\\s+\\[(.+)\\];$');
var ATTR_MATCH_RE = new RegExp('^' + ID_MATCH + '=' + ID_MATCH + '(?:[,\\s]+|$)');

// Prototype
Canviz.prototype = {
  constructor: Canviz,
  setScale: function (scale) {
    this.scale = scale;
  },
  setImagePath: function (imagePath) {
    this.imagePath = imagePath;
  },
  setTextMode: function (textMode) {
    if (~this._textModes.indexOf(textMode)) this.textMode = textMode;
    else debug('unsupported text mode ' + textMode);
  },
  load: function (url, urlParams) {
    if (urlParams) return console.log('urlParams not supported');

    var self = this;

    loadFile(url, function (err, text) {
      if (err) {
        console.log(err.message);
      } else {
        self.parse(text);
      }
    });
  },
  parse: function (xdot) {
    if (IS_BROWSER) document.getElementById('debug_output').innerHTML = '';

    this.graphs = [];
    this.images = {};
    this.width = this.height = this.maxWidth = this.maxHeight = this.bbEnlarge = this.marginX = this.marginY = this.numImages = this.numImagesFinished = 0;
    this.paddingX = this.paddingY = XDOT_DPI * 0.0555;
    this.dpi = 96;
    this.bgcolor = {opacity: 1};
    this.bgcolor.canvasColor = this.bgcolor.textColor = '#ffffff';
    var lines = xdot.split(/\r?\n/),
      linesLength = lines.length,
      i = 0,
      line, lastChar, matches, rootGraph, isGraph, entity, entityName, attrs, attrName, attrValue, attrHash, drawAttrHash,
      containers = [];
    while (i < linesLength) {
      line = lines[i++].replace(/^\s+/, '');
      if ('' != line && '#' != line.substr(0, 1)) {
        while (i < linesLength && ';' != (lastChar = line.substr(line.length - 1, line.length)) && '{' != lastChar && '}' != lastChar) {
          if ('\\' == lastChar) {
            line = line.substr(0, line.length - 1);
          }
          line += lines[i++];
        }
//        debug(line);
        if (containers.length) {
          matches = line.match(SUBGRAPH_MATCH_RE);
          if (matches) {
            containers.unshift(Graph(matches[1], this, rootGraph, containers[0]));
            containers[1].subgraphs.push(containers[0]);
//            debug('subgraph: ' + containers[0].name);
          }
        } else {
          matches = line.match(GRAPH_MATCH_RE);
          if (matches) {
            rootGraph = Graph(matches[3], this);
            rootGraph.strict = !!matches[1];
            rootGraph.type = 'graph' == matches[2] ? 'undirected' : 'directed';
            rootGraph.attrs.xdotversion = '1.0';
            containers.unshift(rootGraph);
            this.graphs.push(rootGraph);
//            debug('graph: ' + containers[0].name);
          }
        }
        if (matches) {
//          debug('begin container ' + containers[0].name);
        } else if ('}' == line) {
//          debug('end container ' + containers[0].name);
          containers.shift();
          if (!containers.length) {
            break;
          }
        } else {
          matches = line.match(NODE_MATCH_RE);
          if (matches) {
            entityName = matches[2];
            attrs = matches[5];
            drawAttrHash = containers[0].drawAttrs;
            isGraph = false;
            switch (entityName) {
              case 'graph':
                attrHash = containers[0].attrs;
                isGraph = true;
                break;
              case 'node':
                attrHash = containers[0].nodeAttrs;
                break;
              case 'edge':
                attrHash = containers[0].edgeAttrs;
                break;
              default:
                entity = Node(entityName, this, rootGraph, containers[0]);
                attrHash = entity.attrs;
                drawAttrHash = entity.drawAttrs;
                containers[0].nodes.push(entity);
            }
//            debug('node: ' + entityName);
          } else {
            matches = line.match(EDGE_MATCH_RE);
            if (matches) {
              entityName = matches[1];
              attrs = matches[8];
              entity = Edge(entityName, this, rootGraph, containers[0], matches[2], matches[5]);
              attrHash = entity.attrs;
              drawAttrHash = entity.drawAttrs;
              containers[0].edges.push(entity);
//              debug('edge: ' + entityName);
            }
          }
          if (matches) {
            do {
              if (!attrs.length) {
                break;
              }
              matches = attrs.match(ATTR_MATCH_RE);
              if (matches) {
                attrs = attrs.substr(matches[0].length);
                attrName = matches[1];
                attrValue = unescapeAttr(matches[2]);
                if (/^_.*draw_$/.test(attrName)) {
                  drawAttrHash[attrName] = attrValue;
                } else {
                  attrHash[attrName] = attrValue;
                }
//                debug(attrName + ' ' + attrValue);
                if (isGraph && containers.length < 2) {
                  switch (attrName) {
                    case 'bb':
                      attrValue = attrValue.split(',');
                      this.width = Number(attrValue[2]);
                      this.height = Math.abs(attrValue[3] - attrValue[1]);
                      // This is the opposite of the dot "-y" flag because canvas Y-coordinates are already inverted from Graphviz coordinates.
                      this.invertY = attrValue[3] > 0;
                      break;
                    case 'bgcolor':
                      this.bgcolor = rootGraph.parseColor(attrValue);
                      break;
                    case 'dpi':
                      this.dpi = attrValue;
                      break;
                    case 'margin':
                      attrValue = attrValue.split(',');
                      this.marginX = XDOT_DPI * attrValue[0];
                      this.marginY = XDOT_DPI * attrValue[attrValue.length - 1];
                      break;
                    case 'pad':
                      attrValue = attrValue.split(',');
                      this.paddingX = XDOT_DPI * attrValue[0];
                      this.paddingY = XDOT_DPI * attrValue[attrValue.length - 1];
                      break;
                    case 'size':
                      if (attrValue.substr(attrValue.length - 1) == '!') {
                        this.bbEnlarge = 1; // true
                        attrValue = attrValue.substr(0, attrValue.length - 1);
                      }
                      attrValue = attrValue.split(',');
                      this.maxWidth = XDOT_DPI * attrValue[0];
                      this.maxHeight = XDOT_DPI * attrValue[attrValue.length - 1];
                      break;
                    case 'xdotversion':
                      if (versionCompare(attrValue, MAX_XDOT_VERSION) > 0) {
                        debug('unsupported xdotversion ' + attrValue + '; this script currently supports up to xdotversion ' + MAX_XDOT_VERSION);
                      }
                      break;
                  }
                }
              } else {
                debug('can\'t read attributes for entity ' + entityName + ' from ' + attrs);
              }
            } while (matches);
          }
        }
      }
    }
    var drawingWidth = this.width + 2 * this.paddingX;
    var drawingHeight = this.height + 2 * this.paddingY;
    this.bbScale = (this.maxWidth && this.maxHeight && (drawingWidth > this.maxWidth || drawingHeight > this.maxHeight || this.bbEnlarge))
      ? Math.min(this.maxWidth / drawingWidth, this.maxHeight / drawingHeight)
      : 1;
    this.draw();
  },
  draw: function (redrawCanvasOnly) {
    if (typeof redrawCanvasOnly == 'undefined') redrawCanvasOnly = false;
    var xdotVersion = this.graphs[0].attrs.xdotversion;
    var bugs = this.bugs = {gradAngle: !versionCompare(xdotVersion, '1.5')};
    bugs.gradY = bugs.textY = versionCompare(xdotVersion, '1.5') < 0;
    var ctx = this.ctx;
    var ctxScale = this.scale * this.dpi / XDOT_DPI;
    var bbScaledDrawingWidth = this.bbScale * (this.width + 2 * this.paddingX);
    var bbScaledDrawingHeight = this.bbScale * (this.height + 2 * this.paddingY);
    var pixelWidth = Math.round(ctxScale * (2 * this.marginX + bbScaledDrawingWidth));
    var pixelHeight = Math.round(ctxScale * (2 * this.marginY + bbScaledDrawingHeight));
    if (!redrawCanvasOnly) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      if (IS_BROWSER) {
        this.canvas.style.width = this.container.style.width = pixelWidth + 'px';
        this.canvas.style.height = this.container.style.height = pixelHeight + 'px';
        while (this.elements.firstChild) {
          this.elements.removeChild(this.elements.firstChild);
        }
      }
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    ctx.fillStyle = this.bgcolor.canvasColor;
    ctx.fillRect(Math.round(ctxScale * this.marginX), Math.round(ctxScale * this.marginY), Math.round(ctxScale * bbScaledDrawingWidth), Math.round(ctxScale * bbScaledDrawingHeight));
    ctx.scale(ctxScale, ctxScale);
    ctx.translate(this.marginX, this.marginY);
    if (this.invertY) {
      ctx.translate(0, bbScaledDrawingHeight);
      ctx.scale(1, -1);
    }
    ctx.scale(this.bbScale, this.bbScale);
    ctx.translate(this.paddingX, this.paddingY);
    this.graphs[0].draw(ctx, ctxScale, redrawCanvasOnly);
    ctx.restore();
  },
  drawPath: function (ctx, path, filled, dashStyle) {
    if (filled) {
      ctx.beginPath();
      path.makePath(ctx);
      ctx.fill();
    }
      switch (dashStyle) {
        case 'dashed':
          ctx.beginPath();
          path.makeDashedPath(ctx, this.dashLength);
          break;
        case 'dotted':
          var oldLineWidth = ctx.lineWidth;
          ctx.lineWidth *= 2;
          ctx.beginPath();
          path.makeDottedPath(ctx, this.dotSpacing);
          break;
        //case 'solid':
        default:
          if (!filled) {
            ctx.beginPath();
            path.makePath(ctx);
          }
      }
      ctx.stroke();
      if (oldLineWidth) ctx.lineWidth = oldLineWidth;
  }
};

// Exports
module.exports = Canviz;

// Dependencies
var Canvas = require('canvas-browserify');
var debug = require('./debug.js');
var Edge = require('./Edge.js');
var Graph = require('./Graph.js');
var loadFile = require('./loadFile.js');
var Node = require('./Node.js');
var objectKeys = require('./path/objectKeys.js');
var unescapeAttr = require('./unescapeAttr.js');
var versionCompare = require('./versionCompare.js');
