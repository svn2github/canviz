// Firefox (23) seems to cap the maximum font size at 1000px
var SIZE = 500;

var cache = {};

function getBaseline(fontFamily, fontSize, fontWeight, fontStyle) {
  fontWeight = fontWeight || 'normal';
  fontStyle = fontStyle || 'normal';
  cache[fontFamily] = cache[fontFamily] || {};
  cache[fontFamily][fontWeight] = cache[fontFamily][fontWeight] || {};
  var baseline = cache[fontFamily][fontWeight][fontStyle];
  if (!baseline) {
    var doc = document;
    var body = doc.getElementsByTagName('body')[0];
    var div = doc.createElement('div'), divStyle = div.style;
    var span1 = div.appendChild(doc.createElement('span')), span1Style = span1.style;
    var span2 = div.appendChild(doc.createElement('span')), span2Style = span2.style;
    divStyle.left = 0;
    divStyle.position = 'absolute';
    divStyle.top = 0;
    span1Style.fontFamily = span2Style.fontFamily = fontFamily;
    span1Style.fontSize = 2 * SIZE + 'px';
    span2Style.fontSize = SIZE + 'px';
    span1Style.fontStyle = span2Style.fontStyle = fontStyle;
    span1Style.fontWeight = span2Style.fontWeight = fontWeight;
    span1Style.padding = span2Style.padding = 0;
    span1Style.position = span2Style.position = 'relative';
    span1Style.verticalAlign = span2Style.verticalAlign = 'baseline';
    divStyle.visibility = span1Style.visibility = span2Style.visibility = 'hidden';
    span1.appendChild(doc.createTextNode('a'));
    span2.appendChild(doc.createTextNode('a'));
    body.appendChild(div);
    baseline = cache[fontFamily][fontWeight][fontStyle] = (span2.offsetTop - span1.offsetTop) / SIZE;
    body.removeChild(div);
  }
  return baseline * fontSize;
}

module.exports = getBaseline;
