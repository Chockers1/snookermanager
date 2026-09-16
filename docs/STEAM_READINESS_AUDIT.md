# Steam readiness audit

Audit started 16 September 2026. Baseline: v0.1.9, commit `dbb0ac3`, plus the existing uncommitted screen-layout and main-menu changes. No Steam authentication or publication is authorised. Steam Direct is paid; identity verification, AppID and Windows DepotID remain outstanding.

## Initial repository findings (before desktop work)

| Check | Finding |
| --- | --- |
| 1. Application | Client-only React 19, TypeScript 6, Vite 8, React Router, Tailwind 3, Recharts. No backend. |
| 2. Desktop packaging | None. No Electron/Tauri/native wrapper or existing packaging architecture to preserve. |
| 3. Windows build | `npm ci`, `npm run build` produce a website, not an executable. |
| 4. Executable | None at baseline. |
| 5. Version | `package.json` is authoritative: 0.1.9; lockfile matches. Keep this version for preparation, not an invented 1.0 release. |
| 6. Outputs | Vite writes `dist/`; test screenshots/traces to `test-results/`, reports to `artifacts/`. |
| 7. Clean checkout | Lockfile exists; clean-checkout desktop verification pending below. Node and npm required on build machine. |
| 8. Runtime dependencies | Browser engine plus bundled React/router, charts/icons, compression and class-name utilities. No online service is required to play. |
| 9. Development dependencies | TypeScript, Vite/Rolldown, ESLint, Vitest/jsdom, Playwright, Tailwind/PostCSS, tsx and type packages. These are not game runtime files. |
| 10. CI | `.github/workflows/quality.yml`: all-branch push/PR, Ubuntu, Node 22, lint, unit tests, Chromium journeys, web build, production dependency audit. |
| 11. Releases | Numbered GitHub releases; AGENTS.md requires the release-push workflow on push requests. Latest Git history v0.1.9. This task does not push or publish. |
| 12. Updates | No self-updater/service worker. Steam should own future desktop updates. |
| 13. Installer | None. Steam can install a portable application directory without a second installer. |
| 14. Steam code | Marketing assets only. No Steamworks SDK integration, achievements API, Cloud, DRM or deployment config. |
| 15. Saves | Origin-scoped IndexedDB `snooker-career-saves-v1` and recovery database `snooker-career-recovery-v1`; localStorage preferences/legacy migration/read overlays. JSON portable exports retain history. Browser profile owns the physical path. |
| 16. Steam launch risks | No executable; BrowserRouter needs route fallback; root-relative assets cannot simply be opened as file://. Browser save origin differs from packaged origin. |
| 17. Program Files | No browser code writes to installation folder. Desktop wrapper must place Chromium profile/logs in user data, and resolve resources relative to its application directory. |
| 18. Hardcoded paths | Development paths appear in documentation/scripts, not as a required gameplay resource path. Build/test artifacts must not ship. |
| 19. Localhost | Development/testing uses 5173/4174. Packaged game must use local resources without an HTTP server or port. |
| 20. Secrets | No credential requirement found in game runtime. Filename/pattern scanning and final payload scan pending; never print matched values. |
| 21. Debug files | Default Vite public copying includes marketing originals, README files and `public/assetts/install-assets.ps1`. Use a runtime allowlist for desktop packaging. |
| 22. Errors/logs | Existing UI error boundaries, startup retry and opt-in bug export; no native startup/crash logging. Add bounded local native logs, no telemetry. |
| 23. Administrator | No game requirement; desktop manifest must use ordinary user privileges. Signing is separate from elevation. |
| 24. Install writes | No intended install writes. Verify using before/after package inventory and relocated smoke test. |
| 25. Defender/signing | New unsigned native executable may prompt or attract reputation warnings. Authenticode identity is not available; never claim Defender certification or bypass protection. |

## Implementation decision

Add a minimal Electron shell and Electron Packager around the existing production output. Use a stable privileged local `scm://game/` origin, a sandboxed renderer without Node access, no exposed general-purpose IPC, disabled production DevTools, and a per-user Chromium profile. Preserve browser save formats; browser users transfer portable exports rather than silently reading their browser profile. No Steam SDK is required merely to distribute this offline game.

## Implemented release preparation

- A Windows x64 Electron 44.4.0 portable package now exists at `dist/windows/Snooker Career Manager.exe`. The complete directory is required. No installer or SDK was introduced.
- Node 24 and locked dependencies build the existing React application. `scripts/build-windows.ps1` fails on lint, type, unit, browser, package, native smoke or payload-inventory failure; it does not conceal failures or upload anything.
- Assets are copied through a runtime allowlist. Marketing sources, source maps, tests, user saves, credentials, CI files and development packages are excluded from the distributable.
- Bundled Chromium/Node eliminate a separate Node/browser prerequisite on the player's machine. Renderer Node access, DevTools, popups, webviews and permission requests are disabled. A local `scm://game/` protocol resolves resources without a server and supports browser-history routing.
- `%APPDATA%\Snooker Career Manager` holds the application profile, IndexedDB and bounded native logs. The EXE manifest was inspected and requests `asInvoker`, not elevation. A spaced-path smoke compares installation hashes before and after use.
- Version remains **0.1.9**, derived from package.json. Settings shows version and Git revision; bug exports include build date. No arbitrary release bump was made.
- Steam templates contain only labelled ID placeholders, Preview 1 and no SetLive destination. Normal PR/main workflows cannot upload. The separate manual upload workflow is disabled until configuration exists, builds an immutable merged commit and targets only `qa`.
- Electron/Chromium licence files and generated `THIRD_PARTY_NOTICES.txt` ship with the game. Victory vendor 37.3.6 omits its top-level licence in npm; the matching upstream version's licence is retained in `desktop/licenses/`, alongside bundled vendor notices. This is attribution preparation, not a legal-rights certification.

## Remaining limits and deliberate omissions

The EXE is **unsigned** (confirmed with `Get-AuthenticodeSignature`). SmartScreen/Defender reputation, actual Program Files ACLs, Windows 10, non-ASCII usernames, display scaling and target-hardware performance still need manual testing. The local smoke uses a temporary spaced install path and isolated profile, not an actual Steam client installation.

No Steam Cloud, Steam achievements, overlay guarantee, controller certification, Steam DRM wrapper or self-updater is implemented. Browser saves transfer through portable JSON; browser and desktop profiles are deliberately separate. Never rename the desktop origin/profile after release without a migration.

Production has no automatic DevTools or console window. Electron's command-line debugging capability is retained so Playwright can exercise the final executable; it is activated only by explicit QA launch flags, not normal launch. The RunAsNode and NODE_OPTIONS fuses are disabled and ASAR-only loading is enabled. Do not describe ASAR/fuses as copy protection.

The scan checks known secret formats and prohibited filenames; it cannot prove the absence of every possible secret. Steam account permissions, IDs, branch protection and store/legal declarations remain unconfigured and untested remotely. The manual checklist records these actions.

See **[STEAM_VALIDATION_REPORT.md](STEAM_VALIDATION_REPORT.md)** for exact final check outcomes, remaining failures, paths and changed-file inventory. Nothing was authenticated, pushed or published.

# Second-pass store preparation

The later [store-ready report](STEAM_STORE_READY_REPORT.md) adds artwork sign-off, manual screenshot/trailer preparation, AI/rights audits, external Windows QA and the isolated capture helper. Technical packaging readiness does not mean the store materials or rights are approved.
