
<!-- 

	If release PR, please add ?template=release.md to the PR url to use the release PR template.

	Otherwise, you are stating the this PR fixes an issue that has been submitted; or,
	describes the issue or proposal under considersation.
-->

## Description

- Fixes #### (if fixing a known issue; otherwise, describe issue using the following format)

<!--

## Expectation

Describe the output you are expecting from marked

## Result

Describe the output you received from marked

## What was attempted

Describe what code combination got you there 

-->	

## Review

### Submitter

- Tests 
  - [ ] Test(s) exist to ensure functionality works (if no new tests added, list which tests cover this functionality).
  - [ ] No tests required for this PR.
- [ ] Is release:
  - [ ] Version in `package.json` has been updated (see [RELEASE.md](https://github.com/markedjs/marked/blob/master/RELEASE.md)).
  - [ ] The `marked.min.js` has been updated; or,
  - [ ] release does not change library.

### Reviewer

- [ ] All tests pass (remove once CI is in place).
- [ ] All lint checks pass (remove once CI is in place).

??