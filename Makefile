# $Id$

AWK=awk
GRAPHVIZ_SRC:=$(shell find . -type d -name 'graphviz-*' | tail -n 1)

x11colors.js: x11colors.awk $(GRAPHVIZ_SRC)/lib/common/color_names
	$(AWK) -f x11colors.awk < $(GRAPHVIZ_SRC)/lib/common/color_names > $@

/lib/common/color_names:
	@echo 'Unpack the Graphviz source in this directory first.' 1>&2
	@exit 1
