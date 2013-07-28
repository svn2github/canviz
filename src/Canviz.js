// Require Path first to load the circular dependencies in the right order
var Path = require('./path/Path.js');

// Constructor
function Canviz(container, url, urlParams) {
  if (!(this instanceof Canviz)) return new Canviz(container, url, urlParams);
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
  }
  this.ctx = this.canvas.getContext('2d');
  this.scale = 1;
  this.paddingX = this.paddingY = 72 * 0.0555;
  this.dashLength = 6;
  this.dotSpacing = 4;
  this.graphs = [];
  this.images = {};
  this.numImages = this.numImagesFinished = 0;
  if (url) {
    this.load(url, urlParams);
  }
}

// Constants
var IS_BROWSER = typeof document != 'undefined';

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
var MAX_XDOT_VERSION = '1.2';
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
    this.width = 0;
    this.height = 0;
    this.maxWidth = false;
    this.maxHeight = false;
    this.bbEnlarge = false;
    this.bbScale = 1;
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
        if (0 == containers.length) {
          matches = line.match(GRAPH_MATCH_RE);
          if (matches) {
            rootGraph = Graph(matches[3], this);
            containers.unshift(rootGraph);
            containers[0].strict = ('undefined' !== typeof matches[1]);
            containers[0].type = ('graph' == matches[2]) ? 'undirected' : 'directed';
            containers[0].attrs.xdotversion = '1.0';
            this.graphs.push(containers[0]);
//            debug('graph: ' + containers[0].name);
          }
        } else {
          matches = line.match(SUBGRAPH_MATCH_RE);
          if (matches) {
            containers.unshift(Graph(matches[1], this, rootGraph, containers[0]));
            containers[1].subgraphs.push(containers[0]);
//            debug('subgraph: ' + containers[0].name);
          }
        }
        if (matches) {
//          debug('begin container ' + containers[0].name);
        } else if ('}' == line) {
//          debug('end container ' + containers[0].name);
          containers.shift();
          if (0 == containers.length) {
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
              if (0 == attrs.length) {
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
                if (isGraph && 1 == containers.length) {
                  switch (attrName) {
                    case 'bb':
                      var bb = attrValue.split(',');
                      this.width  = Number(bb[2]);
                      this.height = Number(bb[3]);
                      break;
                    case 'bgcolor':
                      this.bgcolor = rootGraph.parseColor(attrValue);
                      break;
                    case 'dpi':
                      this.dpi = attrValue;
                      break;
                    case 'pad':
                      var pad = attrValue.split(',');
                      this.paddingX = 72 * pad[0];
                      this.paddingY = 72 * pad[(pad.length == 1) ? 0 : 1];
                      break;
                    case 'size':
                      var size = attrValue.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
                      if (size) {
                        this.maxWidth = 72 * size[1];
                        this.maxHeight = 72 * size[2];
                        this.bbEnlarge = ('!' == size[3]);
                      } else {
                        debug('can\'t parse size');
                      }
                      break;
                    case 'xdotversion':
                      if (0 > versionCompare(MAX_XDOT_VERSION, attrHash.xdotversion)) {
                        debug('unsupported xdotversion ' + attrHash.xdotversion + '; this script currently supports up to xdotversion ' + MAX_XDOT_VERSION);
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
/*
    if (this.maxWidth && this.maxHeight) {
      if (this.width > this.maxWidth || this.height > this.maxHeight || this.bbEnlarge) {
        this.bbScale = Math.min(this.maxWidth / this.width, this.maxHeight / this.height);
        this.width  = Math.round(this.width  * this.bbScale);
        this.height = Math.round(this.height * this.bbScale);
      }
    }
*/
//    debug('done');
    this.draw();
  },
  draw: function (redrawCanvasOnly) {
    if ('undefined' === typeof redrawCanvasOnly) redrawCanvasOnly = false;
    var ctxScale = this.scale * this.dpi / 72,
      width = Math.round(ctxScale * (this.width + 2 * this.paddingX)),
      height = Math.round(ctxScale * (this.height + 2 * this.paddingY));
    if (!redrawCanvasOnly) {
      this.canvas.width  = width;
      this.canvas.height = height;
      if (IS_BROWSER) {
        this.canvas.style.width = this.container.style.width = width + 'px';
        this.canvas.style.height = this.container.style.height = height + 'px';
        while (this.elements.firstChild) {
          this.elements.removeChild(this.elements.firstChild);
        }
      }
    }
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.fillStyle = this.bgcolor.canvasColor;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.scale(ctxScale, ctxScale);
    this.ctx.translate(this.paddingX, this.paddingY);
    this.graphs[0].draw(this.ctx, ctxScale, redrawCanvasOnly);
    this.ctx.restore();
  },
  drawPath: function (ctx, path, filled, dashStyle) {
    if (filled) {
      ctx.beginPath();
      path.makePath(ctx);
      ctx.fill();
    }
    if (ctx.fillStyle != ctx.strokeStyle || !filled) {
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
        case 'solid':
        default:
          if (!filled) {
            ctx.beginPath();
            path.makePath(ctx);
          }
      }
      ctx.stroke();
      if (oldLineWidth) ctx.lineWidth = oldLineWidth;
    }
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
