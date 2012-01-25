function debug(str, escape) {
	str = String(str);
	if ('undefined' === typeof escape) {
		escape = true;
	}
	if (escape) {
		str = str.escapeHTML();
	}
	$('debug_output').innerHTML += '&raquo;' + str + '&laquo;<br />';
}
