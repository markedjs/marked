# Releasing Marked

## Versioning

We follow [semantic versioning](https://semver.org) where the following sequence is true `[major].[minor].[patch]` (further, while in beta you may see something like this `0.[major|minor].[minor|patch]`). Therefore, consider the following implications of the relase you are preparing:

1. **Major:** There is at least one change that has been made which is not deemed as backward compatible. While in beta, the major will remain at zero; thereby, alterting consumers to the potentially volatile nature of the package.
2. **Minor:** There is at least one new feature added to the release. While in beta, the minor will tend be more analagous to a `major` release. For example, we plan to release `0.4.0` once we have fixed most, if not all, known issues related to the CommonMark and GFM specifications because the architecture changes planned during `0.4.0` will most likely introduce breaking changes.
3. **Patch:** No breaking changes. Should fix a defect found in a feature. While in beta, the patch will tend to be more analagous to a `minor` release.

## Release process

**Master is always shippable:** We try to merge PRs in such a way that `master` is the only branch to really be concerned about *and* `master` can always be released. This allows smoother flow between new fetures, bug fixes, and so on. (Almost a continuous deployment setup, without automation.)

**Version naming:** relatively standard [major].[minor].[patch] where `major` releases represent known breaking changes to the previous release, `minor` represent additions of new funcitonality without breaking changes, and `patch` releases represent changes meant to fix previously released functionality with no new functionality. Note: When the major is a zero, it means the library is still in a beta state wherein the `major` does not get updated; therefore, `minor` releases may introduce breaking changes, and `patch` releases may contain new features.

### Release process

- [ ] Fork `markedjs/marked` -> clone the library locally
- [ ] Make sure you are on the `master` branch
- [ ] Create release branch from `master` (`release-##.##.##`)
- [ ] Run tests using NPM command: `$ npm test`
- [ ] Run NPM command to update `package.json` version: `$ npm version [major|minor|patch]` (updates `package.json` and creates `min` file)
- [ ] Publish pack to NPM: `$ npm publish`
- [ ] Commit changes locally -> Submit PR to `origina/master`
- [ ] Merge PR (only time where submitter should be "allowed" to merge his or her own)
- [ ] Navigate to the "Releases" tab on the project main page -> "Draft new release"
  - Add version number matching the one in the `package.json` file after publishing the release
  - Make sure `master` is the branch from which the release will be made
  - Add notes regarding what users should expect from the release
  - Click "Publish release"