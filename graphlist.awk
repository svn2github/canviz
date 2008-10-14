# $Id$

{
	print "var graphs = ["
	for (i = 1; i <= NF; ++i) {
		line = "'" $i ".txt'"
		if (i != NF) {
			line = line ","
		}
		print line
	}
	print "];"
}
