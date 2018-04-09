## Publisher

- [ ] `$ npm version` has been run.
- [ ] Release notes in [draft GitHub release](https://github.com/markedjs/marked/releases) are up to date
- [ ] Release notes include which flavors and versions of Markdown are supported by this release
- [ ] Committer checklist is complete.
- [ ] Merge PR.
- [ ] Publish GitHub release using `master` with correct version number.
- [ ] `$ npm publish` has been run.
- [ ] Create draft GitHub release to prepare next release.

Note: If merges to `master` occur after submitting this PR and before running `$ npm pubish` you should be able to

1. pull from `upstream/master` (`git pull upstream master`) into the branch holding this version,
2. run `$ npm run build` to regenerate the `min` file, and
3. commit and push the updated changes.

## Committer

In most cases, this should be someone different than the publisher.

- [ ] Version in `package.json` has been updated (see [PUBLISHING.md](https://github.com/markedjs/marked/blob/master/docs/PUBLISHING.md)).
- [ ] The `marked.min.js` has been updated; or,
- [ ] release does not change library.
- [ ] CI is green (no forced merge required).
