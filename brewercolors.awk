# $Id$

BEGIN { 
	FS = ","
	print "// $I" "d$"
	print
	print "gvcolors.merge({"
}

/^[^#]/ {
	if ($1 != "") {
		if (line != "") {
			print line
			print "},"
		}
		line = ""
		color_scheme = $1 $2
		gsub("\"", "", color_scheme)
		print color_scheme ":{"
	}
	if (line != "") {
		print line ","
	}
	line = sprintf("%s:[%d,%d,%d]", $5, $7, $8, $9)
}

END {
	print line
	print "}"
	print "});"
}
