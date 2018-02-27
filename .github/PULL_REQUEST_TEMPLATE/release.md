## Publisher

- [ ] `$ npm version` has been run.
- [ ] Release notes in [draft GitHub release](https://github.com/markedjs/marked/releases) are up to date
- [ ] Reviewer checklist is complete.
- [ ] Merge PR.
- [ ] Publish GitHub release using `master` with correct version number.
- [ ] `$ npm publish` has been run.
- [ ] Create draft GitHub release to prepare next release.

Note: If merges to `master` occur after submitting this PR and before running `$ npm pubish` you should be able to

1. pull from `upstream/master` into the branch holding this version,
2. run `$ npm run build` to regenerate the `min` file, and
3. commit and push the updated changes.

## Committer

- [ ] Version in `package.json` has been updated (see [RELEASE.md](https://github.com/markedjs/marked/blob/master/RELEASE.md)).
- [ ] The `marked.min.js` has been updated; or,
- [ ] release does not change library.
- [ ] cm_autolinks is only failing test (remove once CI is in place and all tests pass).
- [ ] All lint checks pass (remove once CI is in place).
