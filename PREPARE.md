# Evaluation Setup

This file is outside the editable surface. It defines how results are judged. Agents cannot modify the evaluator or the scoring logic — the evaluation is the trust boundary.

Consider defining more than one evaluation criterion. Optimizing for a single number makes it easy to overfit and silently break other things. A secondary metric or sanity check helps keep the process honest.

eval_cores: 1
eval_memory_gb: 1.0
prereq_command: npm run build

## Setup

Install dependencies and prepare the evaluation environment.

```bash
npm install
```

The `prereq_command` is set to `npm run build` which compiles TypeScript source files in `src/` to JavaScript in `lib/` using esbuild, generates type definitions, and builds the man page. This ensures the benchmark measures the compiled output rather than stale artifacts.

## Run command

```bash
node test/bench.js 2>&1 | grep -oP 'marked completed in \K[0-9]+' | awk '{printf "METRIC=%.2f\n", 1000000/$1}'
```

This command runs the benchmark harness which parses 652 CommonMark test specs 1000 times each using marked, commonmark, and markdown-it. The metric extracts marked's completion time in milliseconds and converts it to operations per second (higher is better). The benchmark also validates correctness by comparing output against expected HTML.

## Output format

The benchmark command outputs `METRIC=<number>` where the number represents operations per second (652 specs × 1000 iterations / time in seconds). Higher values indicate better performance.

## Metric parsing

The CLI looks for `METRIC=<number>` or `ops_per_sec=<number>` in the output.

## Ground truth

Baseline metric represents the throughput of the marked markdown parser on the CommonMark test suite. As of version 18.0.2, marked completes the benchmark in approximately 3290ms (METRIC ≈ 304 ops/sec) with a 97.70% pass rate on CommonMark specs. The benchmark is measured by running 652 CommonMark test specifications through marked's parser 1000 times each, measuring total elapsed time using `process.hrtime.bigint()`. The test suite includes various markdown features: headings, lists, code blocks, links, emphasis, blockquotes, etc.

Performance can be improved through optimizations like:
- Reducing unnecessary string allocations and copies
- Optimizing regular expressions in the lexer/tokenizer
- Improving parsing algorithms to reduce backtracking
- Caching or precomputing frequently accessed values
- Streamlining the token generation pipeline
