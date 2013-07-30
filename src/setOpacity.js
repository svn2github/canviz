function setOpacity(element, opacity) {
  var style = element.style;
  style.zoom = 1; // enable hasLayout in IE
  style.filter = 'alpha(opacity=' + (opacity * 100) + ')'; // IE
  style.opacity = opacity;
}

module.exports = setOpacity;
