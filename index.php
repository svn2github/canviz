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
function init() {
	load_graph($F('graph_name'));
}
function another_graph(inc) {
	$('graph_name').selectedIndex = (($('graph_name').selectedIndex + inc) + $('graph_name').options.length) % $('graph_name').options.length;
	load_graph($F('graph_name'));
}
// --></script>
</head>
<body onload="init()">
<div id="busy">Loading...</div>
<form action="javascript:void(0)" id="graph_form">
<input type="button" value="&lt;" onclick="another_graph(-1)" />
<select name="graph_name" id="graph_name" onchange="load_graph($F('graph_name'))">
<?php
foreach ($graphs as $graph) {
	echo '<option value="' . htmlspecialchars($graph) . '"';
	if ($graph == $default_graph) echo ' selected="selected"';
	echo '>' . htmlspecialchars($graph) . '</option>' . "\n";
}
?>
</select>
<input type="button" value="&gt;" onclick="another_graph(1)" />
<input type="button" value="View Dot Source" onclick="window.open('graphs/'+$F('graph_name'))" />
</form>
<div id="graph_container">
<div id="graph_texts"></div>
<canvas id="graph_canvas" width="40" height="40"></canvas>
</div>
<div id="result"></div>

</body>
</html>
