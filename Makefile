# $Id$

AWK=awk
GRAPHVIZ_SRC:=$(shell find . -type d -name 'graphviz-*' | tail -n 1)

all: x11colors.js brewercolors.js

x11colors.js: gvcolors.awk $(GRAPHVIZ_SRC)/lib/common/color_names
	$(AWK) -f gvcolors.awk < $(GRAPHVIZ_SRC)/lib/common/color_names > $@

brewercolors.js: gvcolors.awk $(GRAPHVIZ_SRC)/lib/common/brewer_lib
	$(AWK) -f gvcolors.awk < $(GRAPHVIZ_SRC)/lib/common/brewer_lib > $@

/lib/common/color_names /lib/common/brewer_lib:
	@echo 'Unpack the Graphviz source in this directory first.' 1>&2
	@exit 1
