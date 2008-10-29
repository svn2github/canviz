# $Id$

BEGIN { 
	print "// $I" "d$"
	print
	print "Canviz.prototype.colors.update({"
	last_color_scheme = ""
}

/^[^#]/ {
	if (1 == split($1, x, /\//)) {
		color_scheme = "x11"
		color_name = x[1]
	} else {
		color_scheme = x[2]
		color_name = x[3]
	}
	if (color_scheme != last_color_scheme) {
		if (last_color_scheme != "") {
			print line
			print "},"
		}
		line = ""
		print color_scheme ":{"
		last_color_scheme = color_scheme
	}
	if (line != "") {
		print line ","
	}
	if ($5 != 255) {
		alpha = "," $5
	} else {
		alpha = ""
	}
	line = sprintf("%s:[%d,%d,%d%s]", color_name, $2, $3, $4, alpha)
}

END {
	print line
	print "}"
	print "});"
}
