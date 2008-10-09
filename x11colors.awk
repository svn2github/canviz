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
	line = sprintf("%s:[%d,%d,%d]", $1, $2, $3, $4)
}

END {
	print line
	print "}"
	print "};"
}
