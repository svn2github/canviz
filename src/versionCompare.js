function versionCompare(a, b) {
  a = a.split('.');
  b = b.split('.');
  var a1, b1;
  while (a.length || b.length) {
    a1 = a.length ? a.shift() : 0;
    b1 = b.length ? b.shift() : 0;
    if (a1 < b1) return -1;
    if (a1 > b1) return 1;
  }
  return 0;
}

module.exports = versionCompare;
