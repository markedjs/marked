# Table Bug Tests

## Test 1: Table followed by indented code block
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
    Indented code block line 1
    Indented code block line 2

## Test 2: Table followed by fenced code block
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
```
Fenced code block line 1
Fenced code block line 2
```

## Test 3: Table with backticks in cells
| Header 1 | Header 2 |
| -------- | -------- |
| `code | with pipe` | Cell 2 |
| Cell 3 | `more | code` |

## Test 4: Table with escaped pipes
| Header 1 | Header 2 |
| -------- | -------- |
| Cell \| with escaped pipe | Cell 2 |
| Cell 3 | Cell \| another escaped |

## Test 5: Invalid table (missing delimiter row)
| Header 1 | Header 2 |
Cell 1 | Cell 2 |
Cell 3 | Cell 4 |

## Test 6: Invalid table (mismatched columns)
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 | Cell 5 |

## Test 7: Code block followed by table
    Indented code block line 1
    Indented code block line 2
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |

## Test 8: Fenced code block followed by table
```
Fenced code block line 1
Fenced code block line 2
```
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
