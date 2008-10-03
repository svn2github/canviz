# $Id$

AWK=awk
colorlist:=$(shell ls graphviz-*/lib/common/color_names | tail -n 1)

gvcolors.js: $(colorlist)
	@echo '// $$Id$$' > gvcolors.js
	@echo '' >> gvcolors.js
	@echo 'gvcolors={' >> gvcolors.js
	@$(AWK) '{if (line) print line ","; line=sprintf("%s:[%d,%d,%d]", $$1, $$2, $$3, $$4)} END {print line}' < $(colorlist) >> gvcolors.js
	@echo '};' >> gvcolors.js
