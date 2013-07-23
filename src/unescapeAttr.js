function unescapeAttr(str) {
  var matches = str.match(/^"(.*)"$/);
  return matches ? matches[1].replace(/\\"/g, '"') : str;
}

module.exports = unescapeAttr;
