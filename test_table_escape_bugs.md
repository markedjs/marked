# Table Escape Bug Tests

## Test 1: Cell with backticks and escaped pipe
| Header 1 | Header 2 |
| -------- | -------- |
| `code \| with pipe` | Cell 2 |
| Cell 3 | `more \| code` |

## Test 2: Cell with multiple escaped pipes in backticks
| Header |
| ------ |
| `code \| with \| multiple \| pipes` |

## Test 3: Mixed content with backticks and escaped pipes
| Header 1 | Header 2 |
| -------- | -------- |
| Normal text | `code \| with pipe` |
| `more \| code` | Normal text |
