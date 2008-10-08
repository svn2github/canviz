# $Id$

AWK=awk
GRAPHVIZ_SRC:=$(shell find . -type d -name 'graphviz-*' | tail -n 1)

gvcolors.js: $(GRAPHVIZ_SRC)/lib/common/color_names
	@echo '// $$I''d$$' > gvcolors.js
	@echo '' >> gvcolors.js
	@echo 'gvcolors={' >> gvcolors.js
	@echo 'x11:{' >> gvcolors.js
	@$(AWK) '{if (line) print line ","; line=sprintf("%s:[%d,%d,%d]", $$1, $$2, $$3, $$4)} END {print line}' < $(GRAPHVIZ_SRC)/lib/common/color_names >> gvcolors.js
	@echo '}' >> gvcolors.js
	@echo '};' >> gvcolors.js

/lib/common/color_names:
	@echo 'Unpack the Graphviz source in this directory first.' 1>&2
	@exit 1
