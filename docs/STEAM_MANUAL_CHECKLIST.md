# Steam manual release checklist

## Before Steam App ID

- [ ] Rob completes identity verification (fee already paid); finish bank/tax onboarding if requested.
- [ ] Review readiness audit, offline store copy and feature claims.
- [ ] Confirm developer/publisher identity, support contact, asset provenance, fonts, tournament-name rights and AI disclosure.
- [ ] Run `npm run build:windows` from a clean source checkout on Windows/Node 24; inspect local reports.
- [ ] Test unsigned package as an ordinary user on a separate Windows PC; decide signing plan.
- [ ] Export important browser careers to portable JSON; retain backup originals.

## After Steam App ID

1. Record the assigned **AppID** and separate **Windows DepotID** from Steamworks.
2. Replace `<STEAM_APP_ID>` in the app VDF and `<STEAM_WINDOWS_DEPOT_ID>` in both app and depot VDFs. Replace `<APP_VERSION>` and `<GIT_COMMIT>` with tested build metadata. Do not invent numbers or derive the depot by addition. Use ignored copies and paths described in `steam/README.md`.
3. Configure Windows x64 launch: `Snooker Career Manager.exe`, install-root working directory, no arguments. Configure depot ownership in testing/store packages.
4. Create a password-protected `qa` branch and dedicated minimally privileged build account.
5. Configure GitHub variables `STEAM_APP_ID`, `STEAM_WINDOWS_DEPOT_ID`; create protected `steam-qa` environment and its dedicated-account secrets. Leave `STEAM_QA_ENABLED` unset until reviewed.

## Before Coming Soon page

- [ ] Approve short/full description, tags, language/platform declarations and realistic system requirements.
- [ ] Review all ten required artwork candidates, legal rights and upscaled image quality; confirm the hero safe area and small-logo legibility.
- [ ] Capture at least five real 1920 × 1080 gameplay screenshots; select 8–12 per plan if worthwhile.
- [ ] Complete actual content/AI surveys, pricing/regional settings, support/privacy information and required store fields.
- [ ] Submit for Valve store review and resolve feedback. Publish Coming Soon manually when approved; no date was invented here.

## Before first Steam QA build

- [ ] Use the dedicated build account, complete Steam Guard locally; no main-account password in CI.
- [ ] Review the pinned deploy action and protect its GitHub environment before enabling.
- [ ] Validate VDF mapping with Preview 1; content is only `dist/windows/`.
- [ ] Confirm package inventory, version/commit and no credentials, dev files or user saves.
- [ ] Enable QA dispatch only after IDs/secrets are present; approve the full reviewed SHA. Record BuildID.
- [ ] Install **through Steam** using QA access and check launch/executable/depot mapping.
- [ ] Verify normal close, saving on close, restart, offline mode, import/export/recovery and non-ASCII Windows usernames.
- [ ] Test actual protected Program Files installation, read-only install directory, spaces and non-admin user. Local smoke uses an equivalent spaced temporary path, not Program Files ACLs.
- [ ] Check Task Manager for no lingering child processes; no unwanted console or DevTools windows. Check Defender/SmartScreen without disabling protection.

## Before playtest

- [ ] Verify 1366 × 768, 1080p, 1440p, 4K and actual Windows 125/150/200% scaling on real machines; test Alt-Tab/fullscreen behaviour if advertised.
- [ ] Test older exported careers and long histories; keep backups before upgrades. Cloud sync is not enabled.
- [ ] Confirm Steam overlay expectations manually; no integration guarantee is made.
- [ ] Measure CPU/RAM/load times on minimum and recommended target hardware. Finalise requirements from results.
- [ ] Review remaining UI scroll cases and all failed/optional automated checks in the validation report.
- [ ] Give testers QA access and a bug-report route; collect user-consented exports only.

## Before release

- [ ] Resolve playtest blockers and Valve store/build review; confirm final legal/asset/AI/content answers.
- [ ] Prepare final clean, versioned, optionally signed build; re-run tests after any signing/packaging changes.
- [ ] Test the exact approved QA BuildID; retain a known-good rollback BuildID and save backups.
- [ ] Verify current Steam Direct waiting/review and Coming Soon timing requirements in Steamworks; no launch date is promised by this checklist.
- [ ] Rob deliberately promotes the approved BuildID to default and completes any mobile/SMS confirmation and Release App actions.
- [ ] Check customer install/update/offline launch and support links. Monitor reports after release.

Only Rob/authorised Steamworks administrators can complete identity, legal declarations, account permissions, pricing/store approval, Steam Guard, branch access and release promotion. Codex has prepared local files, not performed these account actions. See [deployment guide](STEAM_DEPLOYMENT.md).
# Store-candidate follow-up

Before submitting store material, complete [artwork review](STEAM_ASSET_FINAL_REVIEW.md), [manual captures](STEAM_SCREENSHOT_CAPTURE_CHECKLIST.md), [AI provenance](STEAM_AI_CONTENT_AUDIT.md), [rights checks](STEAM_RIGHTS_AUDIT.md), and [external-PC QA](STEAM_EXTERNAL_PC_TEST.md). The [store-ready report](STEAM_STORE_READY_REPORT.md) lists the next five manual actions. No Steam access occurred in this second pass.
