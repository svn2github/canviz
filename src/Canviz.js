// Constructor
function Canviz(container, url, urlParams) {
  this.canvas = document.createElement('canvas');
  Element.setStyle(this.canvas, {
    position: 'absolute'
  });
  if (!Canviz.canvasCounter) Canviz.canvasCounter = 0;
  this.canvas.id = 'canviz_canvas_' + ++Canviz.canvasCounter;
  this.elements = new Element('div');
  this.elements.setStyle({
    position: 'absolute'
  });
  this.container = $(container);
  this.container.setStyle({
    position: 'relative'
  });
  this.container.appendChild(this.canvas);
  if (Prototype.Browser.IE) {
    G_vmlCanvasManager.initElement(this.canvas);
    this.canvas = $(this.canvas.id);
  }
  this.container.appendChild(this.elements);
  this.ctx = this.canvas.getContext('2d');
  this.scale = 1;
  this.padding = 8;
  this.dashLength = 6;
  this.dotSpacing = 4;
  this.graphs = $A();
  this.images = new Hash();
  this.numImages = 0;
  this.numImagesFinished = 0;
  if (url) {
    this.load(url, urlParams);
  }
}

// Properties
Canviz.colors = $H({
  fallback: {
    black: '000000',
    lightgrey: 'd3d3d3',
    white: 'ffffff'
  }
});
Canviz.addColors = function (colors) {
  Canviz.colors.update(colors);
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
    $('debug_output').innerHTML = '';
    new Ajax.Request(url, {
      method: 'get',
      parameters: urlParams,
      onComplete: function (response) {
        this.parse(response.responseText);
      }.bind(this)
    });
  },
  parse: function (xdot) {
    this.graphs = $A();
    this.width = 0;
    this.height = 0;
    this.maxWidth = false;
    this.maxHeight = false;
    this.bbEnlarge = false;
    this.bbScale = 1;
    this.dpi = 96;
    this.bgcolor = {opacity: 1};
    this.bgcolor.canvasColor = this.bgcolor.textColor = '#ffffff';
    var lines = xdot.split(/\r?\n/);
    var i = 0;
    var line, lastChar, matches, rootGraph, isGraph, entity, entityName, attrs, attrName, attrValue, attrHash, drawAttrHash;
    var containers = $A();
    while (i < lines.length) {
      line = lines[i++].replace(/^\s+/, '');
      if ('' != line && '#' != line.substr(0, 1)) {
        while (i < lines.length && ';' != (lastChar = line.substr(line.length - 1, line.length)) && '{' != lastChar && '}' != lastChar) {
          if ('\\' == lastChar) {
            line = line.substr(0, line.length - 1);
          }
          line += lines[i++];
        }
//        debug(line);
        if (0 == containers.length) {
          matches = line.match(GRAPH_MATCH_RE);
          if (matches) {
            rootGraph = new Graph(matches[3], this);
            containers.unshift(rootGraph);
            containers[0].strict = ('undefined' !== typeof matches[1]);
            containers[0].type = ('graph' == matches[2]) ? 'undirected' : 'directed';
            containers[0].attrs.set('xdotversion', '1.0');
            this.graphs.push(containers[0]);
//            debug('graph: ' + containers[0].name);
          }
        } else {
          matches = line.match(SUBGRAPH_MATCH_RE);
          if (matches) {
            containers.unshift(new Graph(matches[1], this, rootGraph, containers[0]));
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
                entity = new Node(entityName, this, rootGraph, containers[0]);
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
              entity = new Edge(entityName, this, rootGraph, containers[0], matches[2], matches[5]);
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
                  drawAttrHash.set(attrName, attrValue);
                } else {
                  attrHash.set(attrName, attrValue);
                }
//                debug(attrName + ' ' + attrValue);
                if (isGraph && 1 == containers.length) {
                  switch (attrName) {
                    case 'bb':
                      var bb = attrValue.split(/,/);
                      this.width  = Number(bb[2]);
                      this.height = Number(bb[3]);
                      break;
                    case 'bgcolor':
                      this.bgcolor = rootGraph.parseColor(attrValue);
                      break;
                    case 'dpi':
                      this.dpi = attrValue;
                      break;
                    case 'size':
                      var size = attrValue.match(/^(\d+|\d*(?:\.\d+)),\s*(\d+|\d*(?:\.\d+))(!?)$/);
                      if (size) {
                        this.maxWidth  = 72 * Number(size[1]);
                        this.maxHeight = 72 * Number(size[2]);
                        this.bbEnlarge = ('!' == size[3]);
                      } else {
                        debug('can\'t parse size');
                      }
                      break;
                    case 'xdotversion':
                      if (0 > versionCompare(MAX_XDOT_VERSION, attrHash.get('xdotversion'))) {
                        debug('unsupported xdotversion ' + attrHash.get('xdotversion') + '; this script currently supports up to xdotversion ' + MAX_XDOT_VERSION);
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
    var ctxScale = this.scale * this.dpi / 72;
    var width  = Math.round(ctxScale * this.width  + 2 * this.padding);
    var height = Math.round(ctxScale * this.height + 2 * this.padding);
    if (!redrawCanvasOnly) {
      this.canvas.width  = width;
      this.canvas.height = height;
      this.canvas.setStyle({
        width:  width  + 'px',
        height: height + 'px'
      });
      this.container.setStyle({
        width:  width  + 'px',
        height: height + 'px'
      });
      while (this.elements.firstChild) {
        this.elements.removeChild(this.elements.firstChild);
      }
    }
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.fillStyle = this.bgcolor.canvasColor;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.translate(this.padding, this.padding);
    this.ctx.scale(ctxScale, ctxScale);
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
var debug = require('./debug.js');
var Edge = require('./Edge.js');
var Graph = require('./Graph.js');
var Node = require('./Node.js');
var unescapeAttr = require('./unescapeAttr.js');
var versionCompare = require('./versionCompare.js');
