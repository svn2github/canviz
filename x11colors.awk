# $Id$

BEGIN { 
	print "// $I" "d$"
	print
	print "gvcolors={"
	print "x11:{"
}

/^[^#]/ {
	if (line != "") {
		print line ","
	}
	if ($5 != 255) {
		alpha = "," $5
	} else {
		alpha = ""
	}
	line = sprintf("%s:[%d,%d,%d%s]", $1, $2, $3, $4, alpha)
}

END {
	print line
	print "}"
	print "};"
}
