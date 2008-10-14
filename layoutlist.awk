# $Id$

{
	print "var layouts = ["
	for (i = 1; i <= NF; ++i) {
		line = "'" $i "'"
		if (i != NF) {
			line = line ","
		}
		print line
	}
	print "];"
}
