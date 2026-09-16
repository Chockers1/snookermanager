# Second Steam preparation pass — v0.1.9

## Overall status

**Offline store-candidate preparation is complete; public/store approval is still pending.** The build is validated locally. Real screenshots, a recorded trailer, provenance/rights decisions, external-PC QA, business fields and Steam onboarding remain manual work. Nothing was published or pushed; Steam was not accessed or authenticated. No AppID or DepotID was invented. Gameplay balance and original artwork were not changed.

The eight first-pass Steam documents were reviewed. Store, screenshot and trailer plans were refined; the other documents now point to this pass rather than losing earlier evidence. Repository policy bumps versions when publishing, not when preparing locally, so package and lockfile remain **0.1.9**.

## Artwork

See [the full per-file review](STEAM_ASSET_FINAL_REVIEW.md) for exact paths, dimensions, formats, transparency, aspect ratios, thumbnail readability, edges, consistency and decisions. All fixed dimensions match the requested slots. Thirteen original candidate file hashes were verified unchanged after the work.

| Decision | Required assets |
| --- | --- |
| APPROVE — technical/visual only | Header capsule, main capsule, transparent library logo, library header |
| REVIEW MANUALLY | Small capsule subtitle at thumbnail size; vertical and library capsule title contrast/figure crops; hero blurred extensions and logo safe area; shortcut and app icon small gold fragment after CM |
| REPLACE / missing | None conclusively identified / none missing |

Optional page background: APPROVE. Optional bundle header and 512 px shortcut: REVIEW MANUALLY. Approval is not rights clearance or evidence of Steam uploader acceptance. Direct full-size icon inspection refined the earlier contact-sheet-only judgment; the icon fragment is explicitly recorded rather than silently approved. No artwork was regenerated.

## Screenshots

Final store order:

1. Match Centre — live tactical match and score.
2. Dashboard — progressed career and next event.
3. Tournament Hub — populated draw and human route.
4. Training — weekly plan and recovery tradeoffs.
5. Player Attributes — real recorded development.
6. Rankings — human position in the wider tour.
7. Staff — actual coaching team and contracts.
8. Sponsorship — active slots, offer and expectations.
9. Finance — income, expenses and season affordability.
10. Legacy Stats — genuine career records across seasons.

[Shot plan](STEAM_SCREENSHOT_PLAN.md) and [capture checklist](STEAM_SCREENSHOT_CAPTURE_CHECKLIST.md) provide the exact screen, navigation, save state, visible/excluded content, resolution, sidebar/modal guidance, filenames and purpose for every image. These are manual captures, not generated mockups.

Developer-only preparation command:

```powershell
npm run capture:prepare -- --save "C:\Captures\career.json" --screen training
```

It opens the packaged application in an isolated temporary profile, imports via the real launcher and opens a whitelisted route. It never manufactures records or changes the source export. The same export gives the same starting state, but subsequent manual play follows ordinary game rules. No cheat control, route or capture code is included in the release payload. No final store images were generated.

Verified: Training opens at 1920 × 1080 from a normal UI-created portable export, without runtime errors, and closes normally. The real 25-season export imports but is waiting at a season review; the helper correctly reports that Dashboard is not ready and leaves the real gate in place. Resolve it manually in the copy or use a mid-season export. Other shot readiness remains a manual check; this pass did not claim all ten screens were populated automatically.

## Store page

[Offline store draft](STEAM_STORE_PAGE.md) contains product name, short description, About text, feature headings/features, tags, genre, Windows/English support, proposed requirements and business placeholders. Its **STORE CLAIM VALIDATION** table links significant claims to actual source paths and limits.

Editorially ready: career management, tactical simulation, calendar/qualifying/rankings, training, coaches, equipment, sponsors/finances, recovery, rivals, records and local saves. No direct cue-control, real-player licence, multiplayer, Steam Cloud/Achievements, controller or Deck claim. Long careers are supported by actual audit saves, but smooth decades-long play on every PC is not promised.

Rob must confirm developer/publisher, support contact, website, price/territories, release model/date, tags, content survey and hardware requirements. Requirements remain proposals until external-PC measurements support them.

## Rights and AI

[Rights audit](STEAM_RIGHTS_AUDIT.md): confirm illustration/logo and any outlined-font provenance, commercial usage of real event/venue/tour names and source data, and the Strachan text reference. Fictional equipment/sponsors are project data, but names still merit review for accidental resemblance. Keep all runtime OSS notices with the Windows folder. No official event-logo pack, real-player photo collection or commercial soundtrack was found in the reviewed content.

[AI audit](STEAM_AI_CONTENT_AUDIT.md): the ChatGPT-named source illustration and derivative artwork need explicit provenance confirmation. Some derivatives are shipped menu/loading backgrounds; Steam artwork is separate store content even though excluded from the EXE payload. Rob must confirm whether visible writing/logo work was AI-generated. No live-generative AI service or authored audio system was identified. Code assistance alone is not treated as generated user-facing content. Neither audit is a legal clearance.

## Windows QA and signing

[External-PC checklist](STEAM_EXTERNAL_PC_TEST.md) supplies a 20–30 minute PASS/FAIL process for clean-folder launch, careers, saves/reload, keyboard/mouse, window behavior, resource loading, permissions, 100/125/150% scaling and security warnings. Hardware minima, actual consumer-download reputation and Steam-client installation are not established by the local smoke test.

[Signing decision](WINDOWS_CODE_SIGNING_DECISION.md): EXE is unsigned; local launch worked without a security dialog interrupting automation. That is not a SmartScreen test on an internet-origin download. Signing may improve publisher identity/integrity but does not guarantee warnings disappear. No certificate was bought/configured. Offline packaging has no signing dependency; current platform acceptance must be confirmed manually later.

## Trailer and assembly

[72-second recording script](STEAM_TRAILER_PLAN.md) gives every timestamp, duration, screen/action, takeaway and optional caption. Actual Match Centre gameplay occupies the opening five seconds. The end card is “Snooker Career Manager / Coming Soon on Steam / Wishlist Now”; the wishlist call belongs on a published trailer only after a public store page exists. No video was created or edited; future music/voice rights remain separate.

[`release/steam/`](../release/steam/README.md) has artwork, screenshots, trailer, store-copy and build-info folders. Lightweight manifests/pointers preserve source locations, screenshot order and verified EXE/ASAR hashes without duplicating the 397 MB package. Final manual media are deliberately absent. These pointers are not a self-contained delivery ZIP.

## Validation performed this pass

| Check | Result / evidence |
| --- | --- |
| Version | 0.1.9 in package, lockfile and native runtime |
| Lint | PASS; final log `artifacts/steam-pass2/lint-final.log` |
| TypeScript | PASS; `typecheck.log` |
| Unit tests | **933 passed** in 89 files; `tests.log` |
| Desktop tests | **2 passed**; local asset/deep-link routing and escaped-path rejection |
| Capture command tests | **2 passed**; requires explicit export, preserves Windows paths, rejects unknown options/routes |
| Production build | PASS; `build.log`. Existing >500 kB bundle-size advisory remains |
| Windows package | PASS; `package.log`; 396,979,735 physical bytes |
| Native packaged smoke | PASS; normal create/save/main-menu/exit/restart, portable import/export, images, deep links, no HTTP requests or install-directory changes |
| Real 25-season save | PASS import and restart; schema 13, season 2051/52 |
| Capture preparation | PASS isolated real import; correct season-review gate; separate Training route check at 1920 × 1080, unchanged source export |
| Package inspection | PASS; **155 physical/archived entries**, no prohibited files or recognised credential patterns; capture tooling absent |
| Offline Steam safeguards | PASS; configuration/template checks only, no Steam command executed |
| Artwork integrity | 13 audited candidate SHA-256 hashes unchanged |
| Browser suite | **Not rerun this pass.** Previous clean first-pass run: 389 passed, zero skipped. This pass changed development tooling/docs only; packaged UI checks cover import/navigation. No new claim of full browser revalidation |

Initial development issues were corrected: lint rejected a throw in `finally`; an early helper attempt treated a pending season review as a navigation failure; that failure left its disposable native process locking the EXE, causing an initial web-build EPERM. Cleanup now exits the owned Electron app itself. Only the confirmed disposable process was stopped. Subsequent build/package/smoke and helper checks passed, with no capture processes left running. Initial failed-build evidence remains in `artifacts/steam-pass2/build-initial-lock-failure.log`.

The current build is a modified local candidate, not a tagged release. Existing unrelated working-tree changes were preserved. Live browser saves and the running local dev server were not changed by this pass. Small-format/physical-PC visual quality still requires the manual checks above.

## Exactly five next manual actions

1. Confirm artwork/logo/writing provenance and rights, then fill developer/publisher, support, website, pricing and release-model placeholders in the store draft.
2. Sign off the six required artwork review items and any optional artwork you intend to use, inspecting originals and thumbnails; request specific edits only where necessary.
3. Run the external-PC checklist, record hardware/scaling/security results, and decide signing and defensible minimum/recommended requirements.
4. Use real career exports to capture the ten named screenshots and record the 72-second trailer, then review readability, factual continuity and any audio rights.
5. Complete manual Steam identity onboarding, obtain the real IDs, and resume the prepared private-QA/store configuration workflow when ready; review the exact candidate before any upload or publication.
