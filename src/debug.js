function debug(str, escape) {
  str = String(str);
  if ('undefined' === typeof escape) {
    escape = true;
  }
  if (escape) {
    str = escapeHtml(str);
  }
  $('debug_output').innerHTML += '&raquo;' + str + '&laquo;<br />';
}

module.exports = debug;

var escapeHtml = require('escape-html');
