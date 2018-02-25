The marked library tends to favor following the SOLID set of software design and development principles.

## Priorities

We think we have our priorities straight.


1. If the code in a pull request can have a test written for it, it should have it. (If the test already exists, please reference the test which should pass.)
2. Do not merge your own. Mainly for collaborators and owners, please do not review and merge your own PRs.

### Tests

The marked test suite is set up slightly strangely: `test/new` is for all tests
that are not part of the original markdown.pl test suite (this is where your
test should go if you make one). `test/original` is only for the original
markdown.pl tests.

In other words, if you have a test to add, add it to `test/new/`. If your test
uses a certain feature, for example, maybe it assumes GFM is *not* enabled, you
can add [front-matter](https://www.npmjs.com/package/front-matter) to the top of
your `.md` file

``` yml
---
gfm: false
---
```

To run the tests:

``` bash
npm run test
```

<h2 id="releasing">Releasing</h2>

**Master is always shippable:** We try to merge PRs in such a way that `master` is the only branch to really be concerned about *and* `master` can always be released. This allows smoother flow between new fetures, bug fixes, and so on. (Almost a continuous deployment setup, without automation.)

**Version naming:** relatively standard [major].[minor].[patch] where `major` releases represent known breaking changes to the previous release, `minor` represent additions of new funcitonality without breaking changes, and `patch` releases represent changes meant to fix previously released functionality with no new functionality. Note: When the major is a zero, it means the library is still in a beta state wherein the `major` does not get updated; therefore, `minor` releases may introduce breaking changes, and `patch` releases may contain new features.

**Release process:**

1. Check out library
2. Make sure you are on the `master` branch
3. Create release branch from `master`
4. `$ npm run build` (builds minified version and whatnot)
5. `$ npm version [major|minor|patch]` (updates `package.json`)
6. `$ npm publish` (publishes package to NPM)
7. Submit PR
8. Merge PR (only time where submitter should be "allowed" to merge his or her own)
9. Navigate to the "Releases" tab on the project main page -> "Draft new release"
10. Add version number matching the one in the `package.json` file after publishing the release
11. Make sure `master` is the branch from which the release will be made
12. Add notes regarding what users should expect from the release
13. Click "Publish release"