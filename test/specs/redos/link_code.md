INDEX(string, pattern[, start)` : searches for the first occurrence of pattern in string, starting from start: `INDEX("123123", "23", 3)` == `5`
`INSERT(new, old[, start][, length][, pad])` : inserts the new string into the old string after the specified position (default is 0), new string is truncated or padded (default is " ") to the specified length, if start is beyond the end of old old will be padded
`LASTPOS(pattern, string[, start])` : searches backwards for the last occurrence of pattern in string, starting from start: `LASTPOS("123123", "23", 4)` == `2`
`LINES(file)` : returns the number of lines typed ahead at the interactive stream: `push("a line"); push("second line"); lines(STDIN); /* == 2 */`
`MAX(number, number[, number,...])` : obvious
`MIN(number, number[, number,...])` : obvious
`OPEN(filehandle, filename[, "APPEND"|"READ"|"WRITE"])` : opens file, returns boolean for success: `OPEN("MyCon", "CON:160/50/320/100/MyCon/CDS")` == `1`
`OVERLAY(new, old[, start][, length][, pad])` : overlays new string onto old one at start for length chars padding with pad if necessary: `OVERLAY("4", "123", 5, 5)` == `"123-4----"`
`POS(pattern, string[, start])` : same as index
