all:
	@cp lib/marked.js marked.js
	@uglifyjs -mt --unsafe -o marked.min.js marked.js

clean:
	@rm marked.js
	@rm marked.min.js

.PHONY: clean all

