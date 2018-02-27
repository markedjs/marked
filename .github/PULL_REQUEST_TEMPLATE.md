
<!-- 

	If release PR, add ?template=release.md to the PR url to use the release PR template.

	Otherwise, you are stating the this PR fixes an issue that has been submitted; or,
	describes the issue or proposal under considersation.

-->

**Marked version:**

<!-- The NPM version or commit hash having the issue --> 

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

## Contributor

- [ ] Test(s) exist to ensure functionality and minimize regresstion (if no tests added, list tests covering this PR); or,
- [ ] no tests required for this PR.
- [ ] If submitting new feature, it has been documented in the appropriate places.
  
## Committer

- [ ] Draft GitHub release notes have been updated.
- [ ] case_insensitive_refs is only failing test (remove once CI is in place and all tests pass).
- [ ] All lint checks pass (remove once CI is in place).
- [ ] Merge PR