#!/bin/bash

INSTALL_DIR=/usr/local/graphviz-devel
TEMP_GRAPH=$(mktemp -t canviz)
TEMP_HEADER=$(mktemp -t canviz)
DOT_VERSION=$($INSTALL_DIR/bin/dot -V 2>&1)
OUTPUT_GRAPHS=./graphs

echo "Generating with $DOT_VERSION"
for PROGRAM in dot neato fdp circo twopi; do
	printf '%-8s' "$PROGRAM:"
	mkdir -p $OUTPUT_GRAPHS/$PROGRAM
	for FILE_PATH in $(find $INSTALL_DIR/share/graphviz/graphs -type f -name '*.dot' -or -name '*.gv'); do
		FILE_NAME=$(basename $(basename $FILE_PATH .dot) .gv).dot
		echo -n "."
		(time $INSTALL_DIR/bin/$PROGRAM -Txdot $FILE_PATH > $TEMP_GRAPH) 2> $TEMP_HEADER
		if [ -s $TEMP_GRAPH ]; then
			NOW=$(TZ=GMT date)
			echo "# Generated $NOW by $DOT_VERSION" > $OUTPUT_GRAPHS/$PROGRAM/$FILE_NAME
			echo '#' >> $OUTPUT_GRAPHS/$PROGRAM/$FILE_NAME
			sed 's/^/# /' < $TEMP_HEADER >> $OUTPUT_GRAPHS/$PROGRAM/$FILE_NAME
			echo >> $OUTPUT_GRAPHS/$PROGRAM/$FILE_NAME
			cat $TEMP_GRAPH >> $OUTPUT_GRAPHS/$PROGRAM/$FILE_NAME
		else
			echo
			echo "$FILE_NAME - CRASHED!"
		fi
	done
	echo
done
rm -f $TEMP_GRAPH $TEMP_HEADER
