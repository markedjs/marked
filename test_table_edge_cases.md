# Table Edge Cases Test

## Test 1: Different backtick counts with escaped pipes
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| `code \| with pipe` | `` `code \| with pipe` `` | ```code \| with pipe``` |

## Test 2: Escaped backticks with escaped pipes
| Header |
| ------ |
| `code \` with \| pipe` |
| `` code \`\` with \| pipe `` |

## Test 3: Mixed escaped and unescaped pipes
| Header 1 | Header 2 |
| -------- | -------- |
| Normal | `code \| with pipe` |
| `more \| code` | Another |

## Test 4: Complex nested structures
| Header |
| ------ |
| `code with ``inline \| code`` and \| normal pipe` |
