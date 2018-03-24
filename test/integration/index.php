<?php
header('Content-Type: text/plain');

$json = file_get_contents('./commonmark.json');
$decoded = json_decode($json);

foreach ($decoded as $example) {
	printTestForExample($example);
}

function printTestForExample($example) {

$ignore = [
	// 'cm_tabs'
];

$section = 'cm_'. str_replace(' ', '_', strtolower($example->section));

if (in_array($section,$ignore)) {
	return;
}



echo '// cm_'. str_replace(' ', '_', strtolower($example->section)) .'.js'."\n";
echo 'it(\'should pass cm example '. $example->example .'\', function() {'."\n";
echo "  var result = marked('". getWhiteSpacedString($example->markdown) ."');"."\n";
echo '  var expected = \''. getWhiteSpacedString($example->html) .'\';'."\n\n";
echo '  expected(result).toBe(expected);'."\n";
echo "}"."\n\n";
}

function getWhiteSpacedString($string) 
{
	$newLines = implode('\n', explode("\n", $string));
	$tabs = implode('\t', explode("\t", $newLines));
	return $tabs;
}
