var Canvas = require('canvas');

function makeImageCanvas(radius, portion) {
  var diameter = 2 * radius;
  var canvas = new Canvas(diameter, diameter);
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(255, 255, 255, 0)';
  ctx.fillRect(0, 0, diameter, diameter);
  ctx.translate(radius, radius);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(1, -1);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI, true);
  ctx.fillStyle = '#0f0';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0, -2 * Math.PI * portion, true);
  ctx.fillStyle = '#f00';
  ctx.fill();
  
  return canvas;
}

module.exports = makeImageCanvas;
