# Branding integration and release-readiness audit

Date: 13 September 2026. Project: Snooker Career Manager. Status: integrated locally; not committed, pushed, uploaded to Steamworks or published by this task.

## Completed integration

The supplied pack was already extracted inside `public/assetts/public/assetts`. Its nine payload directories now sit directly under **`public/assetts`**, with their supplied names and internal structure preserved. The spelling `assetts` is unchanged.

All **45 payload files** match their original SHA256 hashes after installation. No supplied graphic was resized, recompressed or edited. Five existing pack wrapper/source files were also retained, giving **50 files** in the inventory. The payload is approximately 36 MiB.

[Complete file inventory, dimensions, sizes, hashes and runtime classifications](branding-assets-2026-09-13.csv)

### Files added

- All supplied files under `public/assetts/`, individually listed in the inventory.
- `public/manifest.webmanifest`: product metadata and supplied browser icons; display mode remains browser.
- `src/styles/branding.css`: responsive menu/loading artwork, readable overlays and proportionate logo sizing.
- `src/components/game/BrandLoadingScreen.tsx`: presentation-only loading component.
- `e2e/branding.spec.ts`: seven focused browser checks.
- This report and the asset inventory CSV.

### Existing source files changed

| File | Change |
| --- | --- |
| `index.html` | Official browser title, favicon/Apple/manifest metadata, branding stylesheet and initial loading markup. |
| `src/main.tsx` | Keeps branded initial HTML visible during the existing save preparation instead of replacing it with plain text. |
| `src/App.tsx` | Uses the branded fallback during existing launcher, creation and route loading. |
| `src/routes/CareerLauncherPage.tsx` | Supplied logo and background replace the text wordmark and decorative gradient. Existing menu controls and handlers retained. |
| `src/components/layout/Sidebar.tsx` | Supplied SVG wordmark replaces the text-only sidebar heading. Navigation retained. |

No gameplay, save schema, tournament, finance or achievement logic was changed. Save loading/recovery continues through its existing implementation.

### Assets referenced by the application

Paths below are relative to `public/assetts/`.

| Asset | Use |
| --- | --- |
| `ingame/in-game-logo.svg` | Menu, loading screens and sidebar. SVG viewBox 821 × 313; outlined artwork, no external font dependency. |
| `ingame/main-menu-background-3840x2160.png` | Title/menu background, cover sizing with a dark readability overlay. |
| `ingame/loading-screen-background-3840x2160.png` | Initial and route-loading backgrounds. |
| `icons/favicon.svg` | Primary browser favicon. |
| `icons/favicon.ico` | Browser fallback favicon. |
| `icons/apple-touch-icon-180x180.png` | Apple touch metadata. |
| `icons/web-app-icon-192x192.png` | Manifest icon. |
| `icons/web-app-icon-512x512.png` | Manifest icon. |

The supplied transparent 2000 × 763 PNG logo remains available as an alternative. SVG is used for crisp scaling without stretching. Menu backgrounds intentionally crop with cover sizing rather than distort to each aspect ratio. On smaller screens, existing controls can scroll vertically; no horizontal overflow was detected.

### Replaced and retained artwork

Replaced: default purple favicon reference, internal browser title `snooker_career`, text-only menu/sidebar branding, decorative menu background and plain loading presentation.

`public/favicon.svg` is the old, now-unreferenced default icon. It can be deleted in a later cleanup. It was not deleted during this integration. Functional interface icons are still the existing icon system; they are not old product logos.

The following remain stored and are not referenced by application HTML/CSS/JS: `brand`, `master`, `steam/store`, `steam/library`, `marketing`, `achievements`, `screenshots`, `trailer`, pack documentation/previews, alternative logo exports and unused platform icons. Browser checks recorded no requests for publishing/source folders.

**Storage versus runtime:** Vite copies the contents of `public` into `dist`, so these retained publishing files are present in the build output. They are not downloaded by ordinary game navigation. A future installer can exclude publishing-only files from its package while preserving them in the repository.

Steam dimensions were preserved, including header 920 × 430, small 462 × 174, main 1232 × 706, vertical 748 × 896, library capsule 600 × 900 and library hero 3840 × 1240. The inventory records the other library/logo/background exports.

## Platform branding limits

This is currently a React/Vite web application. No Electron, Tauri, PyInstaller or other executable packaging configuration was found. `icons/windows-executable-icon.ico` is retained, but there is no executable, installer or native application window configuration to wire it into or verify.

No existing service worker or offline PWA implementation was found. The new manifest uses `display: browser`; it does not add an offline/install promise or remove existing functionality. Browser metadata and icon URLs passed checks; native OS icon presentation remains untested because a native package does not exist.

## Achievement artwork audit

There is **no Steamworks achievement integration** in the repository. There are four in-game career achievement definitions in `src/game/careerAchievements.ts`:

| Internal ID | Name | Current artwork | Outstanding |
| --- | --- | --- | --- |
| `televised-win` | First televised win | Text/checkmark only | Unique unlocked and locked design |
| `century` | First century | Text/checkmark only | Unique unlocked and locked design |
| `final` | First final | Text/checkmark only | Unique unlocked and locked design |
| `tour-card` | Secure a tour card | Text/checkmark only | Unique unlocked and locked design |

These are internal IDs, not registered Steam API identifiers. If these four goals become Steam achievements, they need four distinct designs with locked variants, plus the Steamworks definitions and integration. The four supplied generic 256/64-pixel locked/unlocked templates are retained as templates; they were not applied repeatedly as final artwork. Dynamic trophy, qualification and team records are separate from these four goal definitions.

## Screenshot and trailer readiness

All ten requested feature areas exist. Twelve actual rendered game views were captured because Sponsors/Finance and Health/Mental State have separate pages. Captures used isolated copies of existing RT snapshots. Live Match used a separate QA career advanced through ordinary entry, travel, preparation and match-start engine actions. No scores, results or promotional gameplay images were fabricated, and the user's active browser save was not changed.

The originals are 1920 × 1080 PNGs under `artifacts/branding/`. Smaller JPEG copies were made only for reviewing these QA screenshots, not for replacing any supplied artwork.

| Feature area | Exists | Capture readiness / observed limitation |
| --- | --- | --- |
| Career Dashboard | Yes | Good overview; small secondary labels and generous empty card space are less effective when reduced for store previews. |
| Live Match | Yes | Layout available; current QA capture is the start of frame one with zero statistics. Capture a real ongoing match with shots, frame history and a meaningful score. |
| Tournament Hub | Yes | Bracket fits and event identity is clear. An advanced draw would demonstrate progression better than mostly TBD slots. |
| Calendar / Qualification | Yes | Calendar and entry criteria available. Use month view or a relevant tour filter for the final capture; the inspected list shows all tours and several collapsed advice rows. |
| World Rankings | Yes | Table and form markers fit. Use a career with a richer ranking-history chart; this migrated snapshot has a sparse current chart. |
| Training / Development | Yes | Timetable and development estimates fit. Small helper labels merit a readability pass for promotional captures. |
| Sponsors / Finance | Yes, both | Both populated and functional. Finance screenshot includes migration correction transactions, so choose a normal later gameplay moment for publication. |
| Health / Mental State | Yes, both | Treatment and recovery choices visible. The captured treatment history is empty and the saved update message is migration-related; select a more informative real moment. |
| Career Records | Yes | Statistics and goals populated. The first viewport does not show the lower trophy/history sections; choose a genuine trophy-winning career and suitable scroll position. |
| End of Season Review | Yes | Summary, winners and ranking sections exist. The old test snapshot explicitly lacks one champion record. Final capture should use a complete current-version season. |

These are QA captures, not an approved final Steam screenshot set. Dense secondary text is a general readability concern when screenshots are reduced; no new horizontal overflow or missing branding appeared on the checked routes. The screenshot/trailer folders still contain plans rather than finished gameplay captures or footage. No trailer was generated.

### Updated title and loading screenshots

- [Main menu, 1920 × 1080 viewport](../../artifacts/branding/main-menu-1920x1080.png)
- [Loading screen, 1920 × 1080](../../artifacts/branding/loading-1920x1080.png)
- [4K viewport menu](../../artifacts/branding/main-menu-3840x2160.png)
- [Small desktop menu](../../artifacts/branding/main-menu-1280x720.png)

Menu captures use full-page screenshots, so image height can exceed viewport height where the page scrolls. Additional captures and the structured route audit are under `artifacts/branding/`; these local QA artifacts are not included in runtime assets.

## Verification

| Check | Result |
| --- | --- |
| Production build, `npm run build` | Passed; TypeScript and Vite completed. |
| `npm run lint` | Passed. Babel notes the existing large state module; no lint errors. |
| `git diff --check` | Passed. |
| Asset byte integrity | All 45 payload hashes match the originals. |
| `src/hooks/useGameState.saves.test.tsx` | 6 tests passed. |
| `e2e/branding.spec.ts` | 7 tests passed. |
| Existing damaged-save recovery browser test | 1 passed on isolated rerun; original damaged bytes preserved. |
| Local running application | Inspected at `http://127.0.0.1:5173/`. |
| Title/menu responsive coverage | 1280 × 720, 1366 × 768, 1920 × 1080, 2560 × 1440, 3840 × 2160, plus 390 × 844. |
| Branding browser checks | Correct title/aspect ratio, working New/Load/Restore controls, no page errors, no failed asset requests, no publishing-art requests, no horizontal overflow. |
| Saved-career route checks | Eleven existing-career pages recorded no page errors, failed responses or horizontal overflow; Live Match was also captured separately. |

The existing damaged-save browser test initially timed out during page navigation while the heavier visual audit was also running. It passed when run separately with a longer test timeout. An initial CSS assertion expected a single background-size value, but the gradient/image combination correctly returns `auto, cover`; the assertion was corrected. These results are focused branding/startup regression coverage, not a rerun of the complete gameplay or multi-decade career suite. No native executable or Steamworks upload validation is claimed.

## Follow-up branding audit — recommendations only

Source searches covered product-name references, image/icon files and platform metadata across the application. Visual inspection covered the title/loading screens and the twelve feature views above. This is not a claim that every dialog and rare career state has been exercised. The following additional changes have **not** been implemented.

### Must fix before Steam page

1. Produce and select actual gameplay screenshots and a real gameplay trailer from the supplied plans. Avoid publishing the empty-start Live Match capture or old-save migration messages as representative gameplay.
2. Review and approve the supplied capsule/key-art quality at its intended display sizes. The pack README identifies a **1672 × 941 source**; larger 4K/6K files are resampled working exports, not native-resolution originals. Whether to commission a higher-resolution master is a branding decision, not a technical change made here.

### Must fix before Early Access/release

1. Correct the finance export title in `src/routes/FinancePage.tsx:185`: it currently says **Snooker Manager Finance Report**, omitting Career. Use the official product name in that exported document.
2. For a Windows executable release, choose/configure its packager and verify the supplied ICO in the executable, installer, taskbar and application window. The current browser build cannot provide that verification.
3. If Steam achievements are part of the launch promise, finish the individual artwork and Steamworks integration described above. Do not advertise them as integrated today.

### Polish only

1. Decide whether the cream/gold supplied branding should influence more UI styling. Existing green/blue functional surfaces and gold major-event accents remain unchanged; no global palette redesign was assumed.
2. Review small, low-contrast helper text and chart labels on dense management screens, using the existing text-size controls when preparing captures. This is a wider readability pass, not a newly introduced artwork defect.
3. Delete the unused default `public/favicon.svg` after confirming no external tooling depends on it.
4. Consider branding the existing startup-error fallback, which remains a plain recovery message rather than the illustrated loading screen.
5. The fallback named-save label is `Snooker Career`, and the npm package is internally named `snooker_career`. These are not additional product logos. Decide whether to change the human-visible fallback label; retain storage identifiers for compatibility.

No old generic snooker image files were found elsewhere in application assets. Existing initials, trophy/checkmark/navigation symbols are functional UI, not missing product logos. Source masters, publishing graphics and achievement templates should remain preserved during later optimization.
