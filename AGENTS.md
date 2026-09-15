# Repository workflow

## GitHub publishing

The user wants every request to push this repository to Git or GitHub to include a new numbered GitHub Release, unless they explicitly ask for a push without a release.

Use the `release-push` skill for these requests. Follow its version discovery, validation, commit, push, release creation and readback workflow. The default is the next unused patch version on the existing origin/main destination. A request to prepare a release still authorizes preparation only.
