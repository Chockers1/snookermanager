# Long-save corrections and performance — 11 September 2026

Implemented locally. This verification uses isolated copies of the frozen 50-season audit and the 100-season continuation. The live RT browser save and original audit files were not modified. No GitHub push or release was requested.

## Eligibility and selection

**Champion of Champions:** replaced lifetime major/World Champion access with a rolling twelve-month window ending at the published selection cutoff. Eligible professional, major and invitational singles champions receive priority; remaining places use active professional rankings. Qualification events, team trophies and exhibitions cannot supply the title route. Recent eligible champions can qualify without a current card; old prestige alone cannot. CPU draws use the same selection and replace a human who is not participating with the next eligible player.

This is the game's explicit selection policy, not a claim that all future real-world invitation lists are identical. The current organiser also describes selection through a specified qualifying-event schedule: [2026 announcement](https://championofchampionssnooker.co.uk/first-players-confirmed-for-the-2026-champion-of-champions-as-qualifying-schedule-announced/).

Replaying eligibility against the actual long-save title history rejects the eleven unsupported human invitations from 2065/66 through 2075/76. Tests also retain the recent-title route and exclude retired players and duplicate entries.

**World Championship:** the saved ranking revisions establish the cause: the old qualifying selection on 31 March 2051 saw #13; the separate main-draw cutoff on 11 April saw #17. The player could be excluded from both routes. World and UK qualifying/main-draw pairs now share a cutoff before qualifying starts. Later ranking movement cannot change the selected route. Existing mismatched main-draw snapshots are reconciled from the qualifying snapshot or the dated ranking revisions.

The actual 2050/51 snapshot replay now preserves seed #13 and allows main-draw entry. Regression tests cover both #13→#17 and #17→#13. The already missed historical event is not replayed, paid or assigned an invented result.

## Long-term storage and responsiveness

- Indexed published events by season and cached pathway/senior standings, avoiding repeated scans during display-only updates. Caches use weak references with bounded dated-query entries; changed result ledgers, rosters and relevant player details invalidate them.
- Replaced repeated roster searches with set lookups and indexed the tournament archive during recovery.
- Cached the unchanged inbox-overlay fingerprint instead of re-hashing the compressed career on every message click.
- Prepared the active gzip save using browser-native decompression when available, retaining the portable format and older-save fallback. The prepared JSON is consumed once and released.
- Split autosave serialization into bounded pieces between browser tasks, retaining worker compression and the existing transaction/backup ordering. Added a loading status while the career is prepared.
- No removal of old player histories, tournament brackets, trophies or seasonal records to achieve these improvements.

## Measured performance

Production Chromium at 1366×768. Three fresh-browser passes per CPU setting on the same approximately 101 MB raw, 50-season save. Values are medians. 4× is simulated CPU throttling, not certification on a physical low-end laptop. The only fixture adjustment dismisses its pending season-review overlay.

| CPU slowdown | Action | Before | After | Reduction |
| --- | --- | ---: | ---: | ---: |
| 1× | Cold navigation to career ready | 3.972s | 2.214s | 44% |
| 1× | Open inbox | 0.898s | 0.148s | 84% |
| 1× | Open calendar | 1.363s | 0.139s | 90% |
| 1× | Open rankings | 1.106s | 0.170s | 85% |
| 1× | Open player history | 0.762s | 0.176s | 77% |
| 4× | Cold navigation to career ready | 24.467s | 6.310s | 74% |
| 4× | Open inbox | 8.082s | 0.591s | 93% |
| 4× | Open calendar | 7.421s | 0.536s | 93% |
| 4× | Open rankings | 5.842s | 0.650s | 89% |
| 4× | Open player history | 4.317s | 1.268s | 71% |

Normal-speed inbox message selections now have 21–30 ms medians; 4× selections have 92–156 ms medians. The final saved-career browser runs reported no runtime, request, console or save errors. The supplemental launcher-only skill audit also passed; it is not used as evidence of in-career responsiveness.

**Remaining performance limits:** throttled cold loading is still 6.31 seconds median (7.72 seconds worst of three). Throttled player-history opening is 1.268 seconds median. One rankings opening reached 1.004 seconds. Normal-speed tested actions meet the three-second load/one-second interaction targets. The game still parses and hydrates the complete active career when opening it; full historical data is not yet loaded on demand. These are residual performance warnings, not a claim that every old save is now instant. No new 50-year simulation or full weak-CPU 100-year navigation benchmark was run in this fix pass.

## Audit corrections

The audit now uses exact winner/champion finish labels, the game's Major class and the saved decider counters. Stored stale title flags are corrected when summarising old audit rows. Non-ranking invitational prize money is excluded from the no-tour world-ranking prize warning.

The frozen report reconciles to **92 titles**, including **21 majors and 12 World Championships**, rather than 98 titles. The six false titles were exits in “Winners Group” or “Winners Group Semi Final”. The saved decider record is **424 wins from 575**, rather than the harness's 700 matches. Re-evaluating the old report removes its false world-ranking prize warning; the genuinely missed 2050/51 World event remains recorded as a historical warning.

## Verification

- Full existing/regression suite: **733 tests passed in 66 files**. The two additional audit-classification tests also passed. Final focused rerun: 16 tests passed.
- Production TypeScript build and lint passed. Vite retains its existing large-bundle warning; source-hook size also produces a non-failing Babel note.
- Six browser storage tests passed, including the 50-season named-copy/reload, interrupted migration, aborted transactions and recovery database upgrades.
- Separate **100-season named-copy/reload passed** using a 228 MB raw save and approximately 20.7 MB portable compressed payload. This approximately 52-second test includes several saves, copying and multiple reloads; it is not a single-load timing.
- 100-season portable save round-trip was lossless. First and second repairs changed none of the checked cash, financial ledger, career statistics, retained seasonal summaries, contracts, story records, CPU aggregate records or match identities. World and one-year ranking rebuilds matched exactly.
- Chunked serialization was byte-equivalent to ordinary JSON serialization on the actual 50-season state. Original save hashes remained unchanged.

## Reproducible evidence

- `artifacts/long-save-fixes/snapshot-verification.json`: real cutoff replay, invitation checks and audit corrections.
- `artifacts/long-save-fixes/100-season-preservation.json`: century-save preservation and ranking rebuild.
- `artifacts/release-readiness/long-save-verified-final/performance-results.json`: all final timing samples, maxima and errors.
- `artifacts/long-save-tests-final.log`, `artifacts/long-save-focused-final.log`: unit/regression results.
- `artifacts/long-save-storage-50.log`, `artifacts/long-save-storage-100.log`: browser storage verification.
- `scripts/verifyLongSaveCorrections.ts`: read-only snapshot reproduction; `scripts/auditLongSavePerformance.ts`: isolated browser benchmark.
