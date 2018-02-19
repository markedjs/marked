# Releasing Marked

**Master is always shippable:** We try to merge PRs in such a way that `master` is the only branch to really be concerned about *and* `master` can always be released. This allows smoother flow between new fetures, bug fixes, and so on. (Almost a continuous deployment setup, without automation.)

## Versioning

We follow [semantic versioning](https://semver.org) where the following sequence is true `[major].[minor].[patch]` (further, while in beta, you may see this `0.[major|minor].[minor|patch]`); therefore, consider the following implications of the release you are preparing:

1. **Major:** There is at least one change not deemed backward compatible. While in beta, the major will remain at zero; thereby, alerting consumers to the potentially volatile nature of the package.
2. **Minor:** There is at least one new feature added to the release. While in beta, the minor will tend to be more analagous to a `major` release. For example, we plan to release `0.4.0` once we have fixed most, if not all, known issues related to the CommonMark and GFM specifications because the architecture changes planned during `0.4.0` will most likely introduce breaking changes.
3. **Patch:** No breaking changes. Should fix a defect found in a feature. While in beta, the patch will tend to be more analagous to a `minor` release.

## Release process

- [ ] Fork `markedjs/marked` -> clone the library locally -> Make sure you are on the `master` branch
- [ ] Create release branch from `master` (`release-##.##.##`)
  - `$ npm test` (run tests)
  - `$ npm version [major|minor|patch]` (updates `package.json` and creates `min` file)
  - `$ npm publish` (publish to NPM)
- [ ] Commit changes locally -> Submit PR to `origin/master` -> Merge PR
  - `package.json` should, at minimum, have an updated version number.
  - If the release contains changes to the library (most likely) you should also see a new `marked.min.js` file.
- [ ] Navigate to the "Releases" tab on the project main page -> "Draft new release"
  - Add version number matching the one in the `package.json` file after publishing the release
  - Make sure `master` is the branch from which the release will be made
  - Add notes regarding what users should expect from the release
  - Click "Publish release"