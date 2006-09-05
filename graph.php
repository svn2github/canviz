<?php

if (!isset($_GET['file'])) exit;
$file = basename($_GET['file']);
if (!file_exists('graphs/' . $file)) exit;

$graph_src = file_get_contents('graphs/' . $file);
//$graph_src = shell_exec('/opt/local/bin/dot -Txdot /usr/local/graphviz/share/graphviz/graphs/directed/pmpipe.dot');
header('Content-Type: text/plain');
echo $graph_src;
exit;

$graph_src = preg_replace('%\\\\\n%', '', $graph_src);

$graph = array();
if (preg_match_all('%(?<=\n)\s*(.+?)\s*\[(.+?)\];(?=\n)%s', $graph_src, $matches, PREG_SET_ORDER)) {
	foreach ($matches as $match) {
		list(, $name, $params_src) = $match;
		if (!isset($graph[$name])) {
			$graph[$name] = array();
		}
		if (preg_match_all('%(.+?)\s*=\s*(".+?[^\\\\]"|[^ ]+?)(?:,\s*|$)%', $params_src, $matches2, PREG_SET_ORDER)) {
			foreach ($matches2 as $match2) {
				list(, $param_name, $param_value) = $match2;
				if (preg_match('%^".*"$%', $param_value)) {
					$param_value = substr(str_replace('\\"', '"', $param_value), 1, -1);
				}
				if (preg_match('%^_(?:|l|h|t|hl|tl)draw_$%', $param_name)) {
					$tokens = explode(' ', $param_value);
					$param_value = $tokens;
				}
				$graph[$name][$param_name] = $param_value;
			}
		}
	}
}
print_a($graph);

echo '<pre>' . htmlspecialchars($graph_src) . '</pre>';

?>
