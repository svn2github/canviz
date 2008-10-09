# $Id$

AWK=awk
GRAPHVIZ_SRC:=$(shell find . -type d -name 'graphviz-*' | tail -n 1)

all: x11colors.js brewercolors.js

x11colors.js: x11colors.awk $(GRAPHVIZ_SRC)/lib/common/color_names
	$(AWK) -f x11colors.awk < $(GRAPHVIZ_SRC)/lib/common/color_names > $@

brewercolors.js: brewercolors.awk $(GRAPHVIZ_SRC)/lib/common/brewer_colors
	$(AWK) -f brewercolors.awk < $(GRAPHVIZ_SRC)/lib/common/brewer_colors > $@

/lib/common/color_names /lib/common/brewer_colors:
	@echo 'Unpack the Graphviz source in this directory first.' 1>&2
	@exit 1
