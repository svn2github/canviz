function parseHexColor(color) {
  var matches = color.match(/^#([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})\s*([0-9a-f]{2})?$/i);
  if (matches) {
    var canvasColor, textColor = '#' + matches[1] + matches[2] + matches[3], opacity = 1;
    if (matches[4]) { // rgba
      opacity = parseInt(matches[4], 16) / 255;
      canvasColor = 'rgba(' + parseInt(matches[1], 16) + ',' + parseInt(matches[2], 16) + ',' + parseInt(matches[3], 16) + ',' + opacity + ')';
    } else { // rgb
      canvasColor = textColor;
    }
  }
  return {canvasColor: canvasColor, textColor: textColor, opacity: opacity};
}

module.exports = parseHexColor;
