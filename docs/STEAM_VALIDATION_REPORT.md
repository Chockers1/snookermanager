# Steam preparation validation report

Status: **PARTIALLY READY**. Local Windows packaging is implemented. Steam onboarding, real IDs, client installation, hardware validation and store/legal approvals remain outside this offline task. Nothing has been authenticated, uploaded, pushed or published.

## Candidate identity

- Product version: **0.1.9**, from package.json. No version bump.
- Source baseline: `dbb0ac3` plus the proposed working-tree changes.
- Windows output: `C:\dev\snooker_career\dist\windows\`.
- Executable: `Snooker Career Manager.exe`; ship the complete directory.
- Windows x64; Electron 44.4.0; ordinary-user `asInvoker` manifest; unsigned.
- Current root package: 396,979,735 bytes (378.59 MiB), including runtime and notices; 155 physical/archived inventory entries.
- Stable save origin: `scm://game/`; profile/logs: `%APPDATA%\Snooker Career Manager`.

## Verification

| Check | Final outcome |
| --- | --- |
| Clean dependency install | Passed: 390 packages installed from lockfile; npm reported zero known vulnerabilities |
| Lint | Passed |
| Typecheck | Passed |
| Unit suite | **89 files / 933 tests passed**, 166.34 seconds |
| Desktop path tests | **2 passed** |
| Browser suite | **389 passed**, 26.0 minutes; no skips or failures; real 25-season fixture enabled |
| Production web build | Passed, 2.23 seconds; existing large-chunk warning remains |
| Windows packaging | Passed; EXE and bundled runtime produced from clean checkout |
| Native packaged smoke | Passed in root package and clean-checkout package, including 25-season import and restart |
| Package inventory | Passed: 155 physical/archived entries; zero prohibited files or recognised credential patterns |
| Source sanity | Zero recognised credential patterns in tracked/nonignored source text; scan limitations below |
| Workflow / Steam config | YAML parses; dispatch-only QA, explicit opt-in, protected environment, pinned upload action, QA-only destination and placeholder VDF safeguards passed |
| Documentation | All local links in the eight Steam documents and Steam README resolve |

**The single `npm run build:windows` command completed with exit code 0 from the clean local snapshot.** The checkout remained clean after the command. The optional old-save test used a real schema-13 export for season 2051/52, approximately 48.3 MB. Native smoke exercised a relocated path containing spaces, no HTTP/dev-server requests, durable IndexedDB, portable export/import, old-save reopening, deep routes, loaded images, visible version and normal close. Installation hashes were unchanged, with no observed page errors or failed resource requests.

Clean-checkout reports are copied to `artifacts/steam/clean-build/`. The root output at the path above was separately packaged and smoke-tested using the same runtime code. Its build identifies the actual root baseline plus `-modified`; the clean test package identifies its local validation snapshot. Only the deployment guide and this final report differ between the working tree and validated snapshot. Normal CI does not include private saves: its one optional real-save browser test is skipped unless `LONG_CAREER_SAVE` is supplied; it still runs the synthetic migration tests and generated-career native smoke.

Earlier focused runs also verified the corrected selectors and the real long-save test. No failed test was hidden by the final full run. No claim is made that GitHub-hosted CI or Steam deployment has run.

The clean build uses a local temporary Git snapshot of all proposed source changes, with a clean working tree. Snapshot commit: `7f033859c78eb70d12682396c5ae6cb3718745ac`. It is a validation commit in a disposable local checkout, not a published release or a change to the main repository's Git history. Its build revision differs from the root working-tree artifact (`dbb0ac3…-modified`). Locked inputs provide repeatable build steps, not a byte-identical-build guarantee.

Evidence remains outside the depot in `artifacts/`: `steam-clean-build-final.log`, `steam-unit-tests-bounded.log`, `steam-browser-tests-bounded.log`, `steam-browser-retest.log`, `steam-focused-browser.log`, `steam-storage-victory-tests.log`, `steam/clean-checkout.json`, `steam/packaged-smoke.json`, `steam/package-inventory.json`, `steam/source-sanity.json`, and `steam/asset-inventory.json`.

## Failures found and addressed

- The first full browser run had **347 passes, 41 failures and one optional long-save skip**. Several assertions referred to removed panels/old labels, or navigated before Continue Career finished. Tests now use current tabs, controls and actual loaded-page headings. Finance/save/result assertions were retained. The optional real-save test was subsequently run explicitly.
- The existing victory-inbox test expected an icon on a legacy message without a stored victory report. Its current champion label, prize summary, announcement, result, hotel costs and trophy navigation are now checked; this task does not retrofit that decorative icon.
- A real packaged-startup defect appeared with the old 25-season save: a late home navigation could overwrite the pending season-review redirect and leave the main area blank. The launcher now chooses its route before activating the loaded career. Native restart and browser old-save tests check actual page content, not just an empty main container. No gameplay or save schema was changed.
- An unbounded initial unit run overloaded this machine. Unit/browser workers are limited to two for stable validation; the bounded full unit run passed. One clean-build attempt was deliberately stopped before tests to refresh its snapshot; it is not counted as a successful clean build.
- Packaging checks found the npm Victory vendor dependency missing its root licence. The exact matching upstream licence and nested vendor licences now accompany production dependency notices; missing notices fail packaging.

## Remaining checks and limits

- No Steam client installation or SteamPipe upload is possible yet: identity verification, assigned AppID/Windows DepotID, branch/package setup and credentials are missing. Templates use labelled placeholders; no fabricated IDs.
- Actual protected Program Files ACLs, non-admin account, non-ASCII username, Windows 10, physical display scaling, weak CPU/RAM/GPU, Defender/SmartScreen and signing must be checked manually. A spaced temporary installation and unchanged installation hashes cover path handling, not all those environments.
- Current production build emits the existing large-chunk warning (about 746 kB before compression). This is not a build failure and was not addressed by gameplay/code splitting changes here.
- No Steam Cloud, Steam achievements, Steam DRM, multiplayer, controller certification, overlay guarantee or auto-updater is claimed. Browser saves transfer via exported JSON, not automatic browser-profile access.
- Workflow YAML and local safeguards were checked; GitHub runners and Steam credentials have not been exercised remotely. Required environment reviewers and a private QA branch must be configured before enabling the manual workflow.
- Secret checks cover prohibited filenames and known credential formats. Zero findings does not certify unknown formats or establish legal ownership of assets.
- Ten required artwork types have dimensionally valid candidates. Rights/AI provenance, small-size sharpness, hero cropping and Valve acceptance need review. Real store screenshots are missing; trailer and store text are plans/drafts only.

## Created files

- `.github/workflows/steam-qa.yml`
- `desktop/licenses/README.md`
- `desktop/licenses/victory-vendor-37.3.6.txt`
- `desktop/main.cjs`
- `desktop/paths.cjs`
- `desktop/paths.test.cjs`
- `docs/STEAM_ASSET_AUDIT.md`
- `docs/STEAM_DEPLOYMENT.md`
- `docs/STEAM_MANUAL_CHECKLIST.md`
- `docs/STEAM_READINESS_AUDIT.md`
- `docs/STEAM_SCREENSHOT_PLAN.md`
- `docs/STEAM_STORE_PAGE.md`
- `docs/STEAM_TRAILER_PLAN.md`
- `e2e/screen-matrix.spec.ts` — earlier responsive/main-menu task; preserved
- `playwright.screens.config.ts` — earlier responsive/main-menu task; preserved
- `scripts/build-windows.ps1`
- `scripts/package-windows.mjs`
- `scripts/smoke-windows.mjs`
- `scripts/verify-steam-config.mjs`
- `scripts/verify-windows-package.mjs`
- `steam/README.md`
- `steam/app_build_TEMPLATE.vdf`
- `steam/depot_build_WINDOWS_TEMPLATE.vdf`

- `docs/STEAM_VALIDATION_REPORT.md` — this final evidence record.

## Modified files

- `.github/workflows/quality.yml`
- `.gitignore`
- `README.md`
- `e2e/action-blockers.spec.ts`
- `e2e/career-journeys.spec.ts` — includes earlier responsive/main-menu work; preserved
- `e2e/career-storage.spec.ts`
- `e2e/chalk-restock.spec.ts`
- `e2e/development-precision.spec.ts`
- `e2e/equipment-expansion.spec.ts`
- `e2e/event-results-inbox.spec.ts`
- `e2e/group-playoff-layout.spec.ts` — includes earlier responsive/main-menu work; preserved
- `e2e/health-treatment.spec.ts`
- `e2e/match-insights.spec.ts`
- `e2e/pathway-standings.spec.ts`
- `e2e/percentage-formatting.spec.ts`
- `e2e/player-links-everywhere.spec.ts`
- `e2e/post-event-report.spec.ts`
- `e2e/realism.spec.ts`
- `e2e/release-experience.spec.ts`
- `e2e/responsive-layouts.spec.ts`
- `e2e/route-progress.spec.ts` — includes earlier responsive/main-menu work; preserved
- `e2e/season-email.spec.ts`
- `e2e/season-entry-recovery.spec.ts`
- `e2e/season-expansion.spec.ts`
- `e2e/seasonal-sponsors.spec.ts`
- `e2e/sponsor-performance.spec.ts`
- `e2e/tour-briefing.spec.ts`
- `e2e/tournament-career-history.spec.ts`
- `e2e/victory-inbox.spec.ts`
- `eslint.config.js`
- `package-lock.json`
- `package.json`
- `playwright.config.ts`
- `src/components/layout/TopStatusBar.tsx` — includes earlier responsive/main-menu work; preserved
- `src/game/requiredDecision.test.ts` — includes earlier responsive/main-menu work; preserved
- `src/game/requiredDecision.ts` — includes earlier responsive/main-menu work; preserved
- `src/hooks/useGameState.saves.test.tsx` — includes earlier responsive/main-menu work; preserved
- `src/hooks/useGameState.ts` — includes earlier responsive/main-menu work; preserved
- `src/routes/CareerLauncherPage.tsx`
- `src/routes/LiveMatchPage.tsx` — includes earlier responsive/main-menu work; preserved
- `src/routes/OpponentProfilePage.tsx` — includes earlier responsive/main-menu work; preserved
- `src/routes/TournamentDrawPage.tsx` — includes earlier responsive/main-menu work; preserved
- `src/styles/globals.css` — includes earlier responsive/main-menu work; preserved
- `vite.config.ts`

No artwork, live browser saves, Steam account state or GitHub repository state was changed. The existing local development server was left running.

## Next actions

Follow [STEAM_MANUAL_CHECKLIST.md](STEAM_MANUAL_CHECKLIST.md) and [STEAM_DEPLOYMENT.md](STEAM_DEPLOYMENT.md): finish onboarding; obtain separate real IDs; replace template placeholders; configure Windows launch/depot/testing access and private `qa`; set up a dedicated build account and protected GitHub environment; validate mapping; authorise an exact reviewed commit for QA only; install through Steam; finish store/hardware/legal checks; deliberately promote the tested BuildID to default when approved.
## Second-pass validation addendum

See [STEAM_STORE_READY_REPORT.md](STEAM_STORE_READY_REPORT.md) for the later local v0.1.9 rerun: lint, TypeScript, 933 unit + 2 desktop + 2 capture tests, production build, Windows package, native smoke with the real 25-season export and 155-entry package inspection all passed. Browser-suite results below belong to the first pass and were not rerun for documentation/development-tool-only changes. No Steam access or publication occurred. Candidate hashes are in `release/steam/build-info/candidate.json`.
