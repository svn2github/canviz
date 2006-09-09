<?php
header('Content-Type: text/html; charset=utf-8');
$graphs = glob('graphs/*.dot');
foreach ($graphs as $i => $graph) {
	$graphs[$i] = basename($graph);
}
$default_graph = $graphs[0];
//$default_graph = 'crazy.dot';
?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta name="MSSmartTagsPreventParsing" content="true" />
	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<title>canviz: graphviz on a canvas</title>
	<link rel="stylesheet" type="text/css" href="canviz.css" />
	<!--[if IE]><script type="text/javascript" src="excanvas/excanvas.js"></script><![endif]-->
	<script type="text/javascript" src="prototype/prototype.js"></script>
	<script type="text/javascript" src="canviz.js"></script>
	<script type="text/javascript" src="gvcolors.js"></script>
	<script type="text/javascript"><!--
var canvas, ctx, graph;
function init() {
	canvas = $('graph_canvas');
	if (canvas.getContext) {
		ctx = canvas.getContext('2d');
		graph = new Graph();
		graph.scale = $F('graph_scale');
		load_graph();
	}
}
function load_graph() {
	if (canvas.getContext) {
		graph.load($F('graph_name'));
	}
}
function set_graph_scale() {
	if (canvas.getContext) {
		graph.scale = $F('graph_scale');
		graph.display();
	}
}
function change_graph(inc) {
	$('graph_name').selectedIndex = (($('graph_name').selectedIndex + inc) + $('graph_name').options.length) % $('graph_name').options.length;
	load_graph();
}
function change_scale(inc) {
	var new_scale = $('graph_scale').selectedIndex + inc;
	if (new_scale < 0 || new_scale >= $('graph_scale').options.length) {
		return;
	}
	$('graph_scale').selectedIndex = new_scale;
	set_graph_scale();
}
// --></script>
</head>
<body onload="init()">
<div id="busy" style="display:none">Loading...</div>
<form action="javascript:void(0)" id="graph_form">
<div>
<input type="button" value="&lt;" onclick="change_graph(-1)" />
<select name="graph_name" id="graph_name" onchange="load_graph()">
<?php
foreach ($graphs as $graph) {
	echo '<option value="' . htmlspecialchars($graph) . '"';
	if ($graph == $default_graph) echo ' selected="selected"';
	echo '>' . htmlspecialchars($graph) . '</option>' . "\n";
}
?>
</select>
<input type="button" value="&gt;" onclick="change_graph(1)" />
</div>
<div>
<input type="button" value="&lt;" onclick="change_scale(1)" />
<select name="graph_scale" id="graph_scale" onchange="set_graph_scale()">
<?php
foreach (array(4, 2, 1.5, 1, 0.75, 0.5) as $scale) {
	echo '<option value="' . htmlspecialchars($scale) . '"';
	if (1 == $scale) echo ' selected="selected"';
	echo '>' . htmlspecialchars(100 * $scale) . '%</option>' . "\n";
}
?>
</select>
<input type="button" value="&gt;" onclick="change_scale(-1)" />
</div>
<div>
<input type="button" value="View Dot Source" onclick="window.open('graphs/'+$F('graph_name'))" />
</div>
</form>
<div id="graph_container">
<div id="graph_texts"></div>
<canvas id="graph_canvas" width="40" height="40"></canvas>
</div>
<div id="debug_output"></div>

</body>
</html>
