all:
	@cp lib/marked.cjs marked.cjs
	@uglifyjs --comments '/\*[^\0]+?Copyright[^\0]+?\*/' -o marked.min.js lib/marked.cjs

clean:
	@rm marked.cjs
	@rm marked.min.js

bench:
	@node test --bench

man/marked.1.txt: man/marked.1
	groff -man -Tascii man/marked.1 | col -b > man/marked.1.txt

man/marked.1: man/marked.md
	npx marked-man $< > $@

.PHONY: clean all
