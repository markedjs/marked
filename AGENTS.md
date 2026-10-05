# AGENTS.md

Instructions and guidelines for AI agents and LLMs writing code in `marked`.

---

## 1. Project Overview & Core Architecture

`marked` is a high-speed, lightweight Markdown compiler for Node.js, browsers, and CLI. Its defining characteristic is **uncompromising speed**, **zero runtime dependencies**, and **standards compliance** (CommonMark & GitHub Flavored Markdown / GFM).

### Code Pipeline

All core source code lives in `src/` (written in TypeScript):

1. **Pre-processing**: `Hooks.preprocess(markdown)` allows pre-transformation of markdown source.
2. **Block Tokenization**: `Lexer.lex(src)` processes block-level rules using regular expressions defined in `rules.ts` and token methods in `Tokenizer.ts`.
3. **Inline Tokenization**: `Lexer.inlineTokens(src)` breaks text into inline tokens (emphasis, links, codespans, etc.).
4. **Token Walking**: `marked.walkTokens(tokens, callback)` allows extensions to inspect or modify the AST before rendering.
5. **Compilation (Parsing)**: `Parser.parse(tokens)` calls `Renderer.ts` (or `TextRenderer.ts` for plain-text extraction) to generate HTML strings.
6. **Post-processing**: `Hooks.postprocess(html)` processes final output.

### Important Directory Conventions

- **`src/`**: ONLY edit TypeScript source files here.
- **`lib/`**: Generated build output (`marked.esm.js`, `marked.umd.js`, `marked.d.ts`). **NEVER manually edit files in `lib/`**.
- **`test/specs/`**: Spec fixture files organized by spec type (`commonmark/`, `gfm/`, `new/`, `original/`, `redos/`).
- **`test/unit/`**: Node.js test runner unit test files (`*.test.js`).
- **`docs/`**: Documentation pages and doc build scripts.

---

## 2. Core Priorities & Philosophy

When proposing changes, fixing bugs, or implementing features, strictly adhere to the following maintainer priorities:

### 1. Speed is #1 Priority

- **Parsing speed takes precedence over strict edge-case spec compliance**: Marked must remain the fastest Markdown parser. If a CommonMark or GFM spec edge-case requires complex regexes, quadratic parsing, or heavy state tracking that hurts benchmark performance, prioritize speed. Minor edge-case spec divergences can be tolerated or delegated to extensions.
- **Zero Runtime Dependencies**: The core library MUST NOT add any runtime `dependencies` in `package.json`. Everything must run natively and efficiently.
- **No Hot-Path Waste**: Avoid unnecessary object allocations, deep closures, regex recreation, and superfluous string allocations inside hot parsing loops (`Lexer.ts`, `Tokenizer.ts`).

### 2. Extension-First Architecture (Keep Core Lean)

- **Do NOT add non-spec features to core**: Any feature, syntax, or option that is not part of the CommonMark or GFM specifications should NOT be merged into core or added behind new configuration options.
- **Direct users and enhancements to extensions**: Use `marked.use({ extensions, renderer, tokenizer, walkTokens, hooks })`. Marked follows the Open/Closed Principle: provide extension hooks rather than bloating core with endless configuration toggles.

### 3. Security & Scope Boundaries

- **No Sanitization in Core**: Marked's single responsibility is translating Markdown into HTML. Marked deliberately does NOT sanitize HTML output. Do not attempt to add sanitization logic into core; users must use sanitizers like DOMPurify on the output.
- **ReDoS Awareness**: Avoid nested quantifiers `(a+)+` or overlapping alternations that can lead to catastrophic regex backtracking. If introducing or heavily modifying complex regex patterns in `src/rules.ts`, check for backtracking risks.
- **Graceful Failure**: Marked must never throw unhandled exceptions or crash on malformed Markdown input. Treat unexpected syntax as plain text according to spec.

### Priority Label Hierarchy

1. **L0 - Security**: ReDoS vulnerabilities, prototype pollution, memory exhaustion crashes.
2. **L1 - Broken / Performance**: Major bugs causing crashes or severe regressions, or performance bottlenecks.
3. **L2 - Annoying**: Minor bugs where a workaround exists.
4. **RR - Refactor & Re-engineer**: Optimizing execution speed, reducing memory footprint, improving maintainability.
5. **NFS - New Feature (Spec)**: Capabilities required by CommonMark/GFM that do not compromise speed.
6. **NFU / NFE - Non-Spec Requests**: Direct to extensions (`marked.use(...)`).

---

## 3. Build & Test Workflow for Agents

### Critical: Build Before Testing

Tests execute against the compiled bundle in `lib/marked.esm.js`. Therefore, **you MUST compile after editing `src/` before running tests**:

```bash
# Fast build (transpiles TS to ESM and UMD bundles with esbuild)
npm run build:esbuild

# Full build (transpiles code, bundles type definitions, and generates man pages)
npm run build
```

### Essential NPM Scripts

- `npm run build:esbuild`: Fast build using esbuild. Use this during iterative development and test runs.
- `npm run test:only`: Builds and runs spec tests and unit tests with Node's `--test-only` flag.
- `npm run test:unit`: Runs all unit tests (`test/unit/*.test.js`).
- `npm run test:specs`: Runs the spec test suite (CommonMark, GFM, new, original, redos).
- `npm run test:lint` / `npm run lint`: Runs ESLint / auto-fixes formatting.
- `npm run test:types`: Validates TypeScript types (`tsc` + `attw`).
- `npm run test:redos`: Runs `recheck` to scan regex patterns for exponential or polynomial backtracking (run when backtracking concerns are noted).
- `npm run test`: Full test suite (cleans build, builds docs, runs spec, unit, umd, cjs, types, lint).
- `npm run bench`: Runs performance benchmark comparisons against CommonMark and Markdown-it.
- `npm run rules`: Outputs the compiled regex rules from `src/rules.ts` (e.g. `npm run rules -- block.gfm.item`).
- `npm run build:reset`: Cleans up `./lib` and `./public` build artifacts.

### Writing Parsing Spec Tests (Preferred for Parsing)

When writing tests for parsing behavior or Markdown-to-HTML output, **prefer adding spec tests in `test/specs/new/`** instead of unit tests:

1. Create a pair of files:
   - `test/specs/new/<test_name>.md`: The input Markdown.
   - `test/specs/new/<test_name>.html`: The expected HTML output.
2. **Exact Output / Whitespace Comparison (`renderExact: true`)**:
   By default, the spec test runner uses an HTML differ that normalizes whitespace and ignores minor structural spacing. If your test requires exact output verification that the HTML differ does not catch (such as whitespace preservation, indentation, or trailing newline changes), add `renderExact: true` in the YAML front-matter of the `.md` file:

   ```markdown
   ---
   renderExact: true
   ---
   ```

3. **Spec Options**: You can configure Marked options in front-matter as needed (e.g. `gfm: false`, `pedantic: true`, `breaks: true`).
4. **Running a Single Spec Test (`only: true`)**:
   To run only a specific spec test during development, add `only: true` to the YAML front-matter of the `.md` file:

   ```markdown
   ---
   only: true
   ---
   ```

   Then run `npm run test:only` (or `npm run test:specs:only`).

### Writing & Running Unit Tests

Reserve unit tests (`test/unit/*.test.js`) for JavaScript API behavior, option handling, AST token inspection, extensions (`marked.use`), and hooks. Unit tests use the built-in Node.js test runner (`node:test`) and `node:assert`:

```javascript
import { marked } from '../../lib/marked.esm.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('parseInline', () => {
  it('should parse inline markdown without paragraph tags', () => {
    assert.strictEqual(marked.parseInline('**Hello** _world_'), '<strong>Hello</strong> <em>world</em>');
  });
});
```

To run a single test during development:

1. Mark the target test or suite with `it.only(...)` or `describe.only(...)`.
2. Run `npm run test:only` (which runs `npm run build` and tests with `--test-only`).

> [!IMPORTANT]
> **Never commit `only: true` or `.only`**: Always remove `only: true` from spec test front-matter and `.only(...)` from unit tests before committing changes to ensure the full test suite runs.

---

## 4. Coding Conventions & Best Practices

1. **Working with Regular Expressions (`src/rules.ts`)**:
   - Use the `edit()` helper in `src/rules.ts` for constructing composed regular expressions.
   - Use fast lookaheads / delimiter checks before executing heavier regular expressions to fail fast on non-matching text.
2. **TypeScript & Types**:
   - Maintain strict typing in `src/Tokens.ts` and `src/MarkedOptions.ts`.
   - Avoid `any` where possible.
   - Ensure changes pass `npm run test:types`.
3. **Commit Messages**:
   - Strictly follow [Conventional Commits](https://www.conventionalcommits.org/):
     - `fix: <description>` (patch release)
     - `feat: <description>` (minor release)
     - `fix!: <description>` or `feat!: <description>` (breaking change / major release)
     - `chore: <description>`, `docs: <description>`, `refactor: <description>`
4. **Git Hygiene**:
   - Do NOT commit generated build artifacts in `lib/` or `man/marked.1`.
   - Do NOT commit tests with `only: true` or `.only(...)`.
   - Run `npm run build:reset` before pushing or staging git changes if compiled files appear dirty in git status.
