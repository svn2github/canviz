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
* Handle the graph "pad" attribute correctly

0.1 / - 2011-12-10
==================

* Initial release of code that hasn't been touched since 2009
