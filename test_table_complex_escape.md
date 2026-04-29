# Complex Table Escape Tests

## Test 1: Complex backticks with escaped pipes
| Header 1 | Header 2 |
| -------- | -------- |
| `` `code \| with pipe` `` | Cell 2 |
| Cell 3 | ```code \| with \| multiple \| pipes``` |

## Test 2: Mixed escaped pipes inside and outside backticks
| Header 1 | Header 2 |
| -------- | -------- |
| Normal \| pipe | `code \| with pipe` |
| `more \| code` | Another \| normal pipe |

## Test 3: Nested backticks with escaped pipes
| Header |
| ------ |
| `code with ``inline \| code`` blocks` |
