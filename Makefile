
build: components index.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components node_modules

test: components build
	@./node_modules/.bin/testling

.PHONY: clean test
