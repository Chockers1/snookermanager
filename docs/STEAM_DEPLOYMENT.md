# Steam build and deployment guide

Prepared 16 September 2026. **No Steam upload or authentication has been performed.** AppID and Windows DepotID are not available. The fee is paid; Rob must finish identity verification.

## What Codex has prepared

- Existing React/Vite game retained, with a small Electron Windows x64 shell.
- `npm run build:windows`: locked dependency install, lint, type check, unit/desktop tests, Chromium browser regression suite, production web build, portable Windows package, native smoke test and payload inventory. Run on Windows with Node 24 LTS, npm and PowerShell. The build machine needs internet to download dependencies and browser/runtime binaries; the game does not need a dev server.
- Output: `dist/windows/Snooker Career Manager.exe`, accompanied by the runtime DLL/PAK/DAT files, locales, licences and `resources/app.asar`. **Ship the entire windows directory.** Copying just the EXE will not work.
- No installer, updater, elevation or Steam SDK login. Steam handles installation and updates. This preparation does not implement Steam Cloud, Steam achievements, DRM, overlay integration or controller support.
- SteamPipe templates in `steam/`, with obvious placeholder IDs and Preview enabled.
- Existing quality workflow extended; main pushes build an artifact, never upload to Steam.
- Separate manual `steam-qa.yml`, initially inactive because `STEAM_QA_ENABLED` is absent. It has no push/PR/schedule trigger, accepts a full immutable SHA merged to main, validates and packages, then uses a protected `steam-qa` environment and uploads only to `qa`.

## Version and build identity

`package.json` is the version authority. The lockfile, Windows file/product version and packaged application version derive from it. Existing Settings footer exposes version and Git revision; exported bug reports also include build date. Local dirty builds include `-modified`. Do not call this 1.0.0 or promise a release date. Publishing uses the repository's normal numbered-release process.

Builds are reproducible from locked inputs in the operational sense, not promised byte-identical: build timestamps and PE/archive metadata can vary. Record Git SHA, package inventory hashes and Steam BuildID with each candidate. Source archives without Git metadata show `unknown`; CI checks out the exact commit.

## Saves and logs

Production uses `%APPDATA%\Snooker Career Manager\`. Chromium manages IndexedDB, localStorage and caches beneath that directory. The game origin is permanently `scm://game/`. Keep both name and origin stable across releases. Recovery saves and archived history use the existing databases and schema.

Existing web-browser saves are **not automatically shared** with the desktop profile. In the browser, use Save Manager → Import & export → Export Career. In the packaged game, use Import Save or Save Manager → Import Career. Portable JSON retains historical seasons; import creates a separate career. Do not copy individual browser database files between profiles.

Native logs: `%APPDATA%\Snooker Career Manager\logs\desktop.log`, rotated at 512 KiB to one previous file. UI bug reports remain voluntary exports; no telemetry upload. Logs report launch/version and native failures, not save payloads. User-selected exports use the normal download/save dialog, outside the installation by default. `--scm-data-dir=<absolute folder outside installation>` supports isolated QA profiles; never set it to the installation or a folder inside `resources`.

Do not configure Steam Auto-Cloud to sync live Chromium databases. A dedicated, consistent export-based cloud format would need separate work. Manual portable backups work now.

## Branches and release control

| Branch | Audience | Policy |
| --- | --- | --- |
| `default` | Customers | Rob manually selects/promotes the approved BuildID in Steamworks. Never a workflow destination. |
| `qa` | Authorised testers | Create with a password before making content live. Only explicit manual dispatch may upload to it. |
| `previous` (optional) | Rollback verification | Preserve a known-good build and test save compatibility before reverting. |

Development → PR → validation → merge → Windows artifact → optional authorised QA dispatch → install through Steam → manual acceptance → manual promotion to default. A merge alone never delivers a customer update. Valve documents additional authorisation for released-app default changes. [Build management](https://partner.steamgames.com/doc/store/application/builds?l=english).

## What Rob must do manually in Steamworks

1. Complete identity, bank/tax and account onboarding. Confirm the paid application slot.
2. Create/configure the application and Windows depot. Record assigned **AppID** and **DepotID separately**; neither should be guessed.
3. Configure a Windows 64-bit launch option: executable `Snooker Career Manager.exe`, working directory left at the game install root, no launch arguments. Set Windows depot OS restrictions and include the depot in appropriate testing/store packages.
4. Create `qa` with a password **before** putting a build there. Grant intended testers access; never publish its password in repository files or workflow logs.
5. Create a dedicated Steam build account, grant only required application access and the Valve-documented `Edit App Metadata` / `Publish App Changes To Steam` permissions. Do not use Rob's main Steam password in GitHub. Review permissions after initial setup.
6. Authenticate that account locally using official SteamCMD and complete Steam Guard yourself. The prepared pinned deploy action supports a base64-encoded `config/config.vdf` session secret; treat it like a password. Check the pinned action's instructions before creating it, store it only as an environment secret, and rotate it if exposed/revoked. No password or MFA secret is present in this repo.
7. Arrange Authenticode signing and confirm the developer/publisher legal identity if desired before wider testing. Current package is unsigned. Signing reduces some warnings but does not guarantee reputation or antivirus acceptance.

Sources: [Valve upload/build-account guide](https://partner.steamgames.com/doc/sdk/uploading?l=english), [pinned deploy-action inputs](https://github.com/game-ci/steam-deploy/blob/50f6b29fc64922e19a16d202a88fe199d394b536/action.yml). The action is pinned to v3's implementation; newer main-branch credential requirements may differ.

## GitHub configuration (Rob/repository administrator)

Create repository variables, **only after Valve assigns the real values**:

| Variable | Value |
| --- | --- |
| `STEAM_APP_ID` | Assigned AppID |
| `STEAM_WINDOWS_DEPOT_ID` | Assigned Windows DepotID |
| `STEAM_QA_ENABLED` | Leave unset/false until all configuration and permissions are reviewed; then `true` |

Create environment **`steam-qa`** with required reviewers and deployment-branch restriction to main. Put only these future secrets in it:

- `STEAM_BUILD_USERNAME`: dedicated build account username.
- `STEAM_BUILD_CONFIG_VDF`: base64 session configuration generated after Rob's local Steam Guard authentication.

No GitHub/Steam secrets are created by this task. Never commit config.vdf, SSFN files, passwords, session tokens, `.env` files or signing keys. Do not upload SteamCMD's working directory/logs as artifacts. Re-review the pinned action and its container dependencies before first enablement. An expired session must fail; do not work around it by disabling Steam Guard.

## Template replacements and first QA build

1. Replace `<STEAM_APP_ID>` in the app template and `<STEAM_WINDOWS_DEPOT_ID>` in **both** templates with the assigned values. Replace `<APP_VERSION>` from package.json and `<GIT_COMMIT>` from the tested SHA. Prefer ignored copies in `steam/generated/`; adjust relative paths as explained in `steam/README.md`.
2. Build and inspect `dist/windows`. Retain `artifacts/steam/package-inventory.json` outside the depot. Run the initial SteamPipe mapping preview with Preview 1. This still needs Steam credentials; do it only after onboarding, not as part of offline preparation.
3. For GitHub QA deployment, enable the variables/environment above and dispatch the workflow from main with the full reviewed SHA and the explicit upload checkbox. Credentials are available only to the upload job; building never requires Steam credentials.
4. Record the resulting BuildID. Confirm the assigned depot, launch option and QA branch in Steamworks. Install through Steam into a path containing spaces and test as a standard Windows user.
5. Complete manual checks before deliberately promoting the same verified BuildID to default. Do not rebuild different bytes between approval and promotion. Keep a known-good rollback BuildID and save backups.

The workflow does not perform store review, package/access configuration, default promotion or the final Release App action. Those remain manual.

## Local validation and older exports

The native smoke test uses a disposable profile and a relocated installation copy; it never opens the normal desktop or browser save directory. To include an older portable export:

```powershell
$env:SCM_LEGACY_SAVE = 'C:\path\to\portable-career.json'
npm run test:packaged
Remove-Item Env:SCM_LEGACY_SAVE
```

The optional export is not included in source or the depot. Reports are written to `artifacts/steam/`; retain them with the candidate. Test snapshots, screenshots, temporary profiles and logs must stay outside SteamPipe content. The proposed requirements and native smoke do not replace a real Steam-client install test.

For the full build, also set `LONG_CAREER_SAVE` to the same portable JSON before `npm run build:windows`. This enables the optional real long-career browser storage test. Without that local fixture, CI reports that one test as skipped; synthetic migration/storage tests and the generated-career native smoke still run. Never commit a personal save merely to enable CI.
# Offline store-candidate materials

`release/steam/` now indexes artwork, manual screenshots/trailer, store copy and build hashes. It is separate from the runtime depot and is not an upload-ready replacement for `dist/windows`. The developer-only `npm run capture:prepare` helper is excluded from the packaged game. See [STEAM_STORE_READY_REPORT.md](STEAM_STORE_READY_REPORT.md); deployment credentials and real IDs are still unresolved.
