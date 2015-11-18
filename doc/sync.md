# Preview panel synchonization

## Markdown preview block
For markdown preview block on scroll event you can use the following code.
**toLine** - float row number (for accurate and smooth synchronization)
```
function getOffset(toLine) {
	var children = _.toArray(containerEl.childNodes);
	var prev = { ln: 0, dom: { offsetTop: 0 } }
	for (var i = 0; i < children.length; i++) {
		var dom = children[i];
		var ln = dom.getAttribute && +dom.getAttribute("line-number");
		if (ln) {
			if (toLine <= ln)
				break;
			prev = { ln, dom };
		}
	}
	return prev.dom.offsetTop + (dom.offsetTop - prev.dom.offsetTop) / (ln - prev.ln) * (toLine - prev.ln);
}

// added event handler
ctrl.events.scroll.push(
	toLine => ctrl.events.scroll.push(toLine => containerEl.parentNode.scrollTop = getOffset(toLine))
);
```
				
## Ace editor integration
```
session.on("changeScrollTop", () => {
	ctrl.scroll({ top: editor.renderer.getScrollTop() / editor.renderer.lineHeight })
});
```
