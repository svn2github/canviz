0.2.0 - 2013-??-??
==================

* Remove PrototypeJS requirement
* Provide a single global Canviz variable; other classes can be accessed as Canviz.Edge, Canviz.Entity, Canviz.Graph, Canviz.Image, Canviz.Node, and Canviz.Tokenizer, although there is usually no need to do so
* Classes can now be instantiated with or without `new`
* Separate each class into its own NodeJS-style module in its own source file
* Use npm for dependencies
* Use Jake build system
* Build a standalone path.js like before using Browserify
* Build a minified path.min.js using UglifyJS
* Update included excanvas to version 0003
* Convert documentation files to Markdown format
* Add a test suite
* Implement alternate text rendering using the canvas (instead of overlay spans)
* Improve text positioning
* Handle the graph "margin", "pad" and "size" attributes correctly
* Handle the graph "landscape", "orientation" and "rotate" attributes correctly
* Handle graphs rendered with the Graphviz "-y" switch
* Handle xdotversion up to 1.6
* Handle gradients
* Handle bold, italic, underline, strikethrough, subscript and superscript text styles
* Fix bug when fill and stroke color are the same which had resulted in edge arrows appearing slightly too small and table horizontal and vertical rules not getting drawn at all
* Create xdot2png command-line script

0.1 / - 2011-12-10
==================

* Initial release of code that hasn't been touched since 2009
