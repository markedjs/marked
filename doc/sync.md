# Preview panel synchronization

## Markdown preview block
For preview block you can use the following code for scroll event.

`toLine` - float row number (for accurate and smooth synchronization)
```javascript
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

// scroll event handler
ctrl.events.scroll.push(
	toLine => ctrl.events.scroll.push(toLine => containerEl.parentNode.scrollTop = getOffset(toLine))
);
```
				
## Ace editor integration
```javascript
session.on("changeScrollTop", () => {
	ctrl.scroll({ top: editor.renderer.getScrollTop() / editor.renderer.lineHeight })
});
```
