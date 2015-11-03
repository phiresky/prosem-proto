var babel = require('babel-core');
var fs = require('fs');
fs.truncateSync("bin/bin.js",0);
var map = JSON.parse(fs.readFileSync('bin/tmp.js.map'));
var out = babel.transformFileSync("bin/tmp.js", {
	"inputSourceMap":map,
	"plugins": [
		"transform-es2015-parameters",
		"transform-es2015-classes",
		"transform-es2015-destructuring",
	],
	"sourceMaps":"inline",
});
fs.writeFileSync("bin/bin.js", out.code+"\n//# sourceMappingURL=bin.js.map");
fs.writeFileSync("bin/bin.js.map", JSON.stringify(out.map));
