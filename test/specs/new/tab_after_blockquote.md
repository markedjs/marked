---
renderExact: true
# The two leading spaces are the content indentation left over once the block
# quote marker has taken one column of the expanded tab. CommonMark renders
# "<p>test</p>" here because it strips leading whitespace from paragraph
# lines; marked keeps it everywhere, with or without a block quote, so this
# records marked's behaviour rather than the spec's. Fixing the paragraph
# side is a separate change.
---
>	test
