# Releasing Marked

Marked uses [semantic-release](https://github.com/semantic-release/semantic-release) to release new versions. All PRs should use the "Squash and merge" strategy and the commit message should follow the [conventional commit guidelines](https://www.conventionalcommits.org/).

## Overall strategy

**Master is always shippable:** We try to merge PRs in such a way that `master` is the only branch to really be concerned about *and* `master` can always be released. This allows smoother flow between new features, bug fixes, and so on.

## Versioning

We follow [semantic versioning](https://semver.org) where the following sequence is true `[major].[minor].[patch]`:

1. **Major:** There is at least one change to the public API or a break from the [CommonMark](https://spec.commonmark.org/current/) or [GFM](https://github.github.com/gfm/) spec. Only [current and LTS](https://nodejs.org/en/about/releases/) Node.js versions are supported at any point in time.  A drop in support for a Node.js version may not result in a semver major bump to Marked.
2. **Minor:** There is at least one new feature added to the public API.
3. **Patch:** Changes that move Marked closer to spec compliance or change a public API that does not break backwards compatibility.
