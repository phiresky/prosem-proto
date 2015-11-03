all: bin/libs.css bin/program.js bin/libs.js

bin/program.js:
	tsc

bin/libs.css: lib/bower_components/bootstrap/dist/css/bootstrap.min.css
	paste -d '\n' -s $^ > bin/libs.css

bin/libs.js: lib/bower_components/jquery/dist/jquery.min.js lib/bower_components/bootstrap/dist/js/bootstrap.min.js \
		lib/bower_components/lz-string/libs/lz-string.min.js \
		lib/bower_components/react/react.min.js \
		lib/bower_components/react-dom/react-dom.min.js
	paste -d '\n' -s $^ > bin/libs.js

watch:
	python3 -m http.server &
	while true; do tsc; node runbabel.js; inotifywait -e modify -r src; done
