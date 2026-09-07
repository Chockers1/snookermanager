# Progression and release-readiness audit — 7 September 2026

## Implemented changes

- Training now distributes each drill’s workload across its relevant skills. All 15 attributes have a training route, including safety, resilience, consistency, balance and recovery. Session volume, coaches, facilities and fatigue affect actual fractional development. Gains taper as skills approach mastery. The planner previews the same calculation used when applying the week; protected competition/travel time does not grant training.
- Q Tour playoff reserves are drawn from eligible recorded standings after excluding unavailable entrants. This fixes a reproduced 23/24-player draw failure without adding anonymous entrants, expanding the field or increasing the number of cards.
- Entry and advancement blockers now provide the exact reason and a route to resolve it: commitments, pending decisions, existing entries, qualification, equipment stock, travel/preparation and cash. This is shared by the calendar, hub, dashboard, inbox and continuation controls.
- Save compression runs in a worker. Small cached metadata avoids decoding a freshly encoded career just to label its backup. Saving status and a close warning remain visible until queued work completes; switching careers waits for saving. Protected pre-rollover backups precede publication. Calendar data and player histories are memoized across local filter changes.

## Every starting path: three full season cycles

Twelve careers completed three seasons each through the existing gameplay-action manager. It selects eligible entries, handles travel/equipment, plays matches, receives awards, advances ranking publication and processes season review/rollover. This is 36 completed season cycles, not twelve retirement-length careers. All twelve reports finished with no integrity issues; each exported save was independently reloaded and checked against its ranking receipts.

| Starting path | Seed | Initial → final overall | Final cash | Card after year 3 | Lowest sampled cash |
| --- | ---: | --- | ---: | --- | ---: |
| Bottom Tour / Survival | 804750 | 72 → 82 | £40,265 | No | £136.00 |
| Club Junior | 104729 | 47 → 56 | £1,342 | No | £-76.60 |
| Elite Amateur Circuit | 404738 | 68 → 80 | £4,652 | No | £3.00 |
| Masters Circuit | 1204762 | 68 → 68 | £146,462 | No | £78.00 |
| National Youth Player | 304735 | 63 → 73 | £1,317 | No | £-164.40 |
| Q School Campaigner | 604744 | 70 → 81 | £4,084 | No | £78.00 |
| Q Tour / Global Amateur Pathway | 504741 | 72 → 82 | £5,363 | No | £78.00 |
| Regional Youth Prospect | 204732 | 54 → 64 | £1,262 | No | £-182.00 |
| Rookie Pro / At Risk | 704747 | 72 → 82 | £95,054 | No | £78.00 |
| Top 16 Elite Player | 1104759 | 82 → 87 | £538,871 | Yes | £78.00 |
| Top 32 Professional | 1004756 | 78 → 85 | £202,568 | No | £78.00 |
| Top 64 Professional | 904753 | 74 → 82 | £84,458 | No | £78.00 |

Starting path controls the initial career, not a permanent entitlement to a card. Several professional starts lost their cards through results. The sample manager uses one moderate-support policy and one seed per path, so this does not establish population promotion or survival rates. It also conservatively avoids Q School before age 18.

## Matched Q Tour starts: fifteen seasons each

| Seed | Overall at years 1 / 3 / 5 / 10 / 15 | First card | Final card | Q School entries | Final cash | Lowest sampled cash |
| ---: | --- | --- | --- | ---: | ---: | ---: |
| 304735 | 76 / 82 / 85 / 89 / 92 | Year 7, Q School | No | 21 | £1,006,944 | £78.00 |
| 330369 | 76 / 82 / 85 / 90 / 92 | Year 8, Q School | Yes | 19 | £324,973 | £78.00 |
| 355927 | 76 / 82 / 85 / 89 / 92 | Year 15, Q School | Yes | 29 | £89,966 | £78.00 |

All three completed 15 seasons with no reported integrity issues after the reserve fix. The original seed 330369 run failed in year six because an unavailable playoff entrant left only 23 players. The exact seed was rerun from the start and completed all 15 seasons; a regression test also verifies a full, unique 24-player reserve field.

These careers earned their first cards through Q School; this is not evidence that the Q Tour playoff route now produces a particular human promotion rate. Card loss and requalification occurred. No wins, earnings or promotions were granted by the audit.

The previous matched runs ended around overall 85 without a card. The new runs reach 92, with continued improvement after year five. They still share the same rounded final overall under the same training policy: fixing missing training coverage does not prove sufficient individual variation. Their schedules, attribute fractions, earnings and promotion timing differ. A larger mixed-policy sample remains appropriate before setting difficulty targets.

Two additional managed youth careers completed 15 seasons: Club Junior seed 104729 (age 12 → 27, final overall 84) and Regional Youth seed 204732 (age 13 → 28, final overall 87). Both completed without reported integrity issues. Together with the Q Tour runs, this adds 75 long-run season cycles.

The short runs recorded seven debt episodes across the three youth paths, all recovered. The longer Club Junior run recovered all six episodes but one lasted 462 days. The longer Regional Youth seed 204732 finished at −£2,215.36 after an unresolved 2,142-day debt episode: it remained overseas paying £245/week, and the ordinary return fare required positive cash. That is a balance problem despite the mechanical integrity checks passing.

An initial recovery attempt using 45 paid club shifts while remaining abroad ended at −£3,107.36 after 308 days. Paid work alone did not solve those ongoing costs. The game now offers an explicit emergency return fare on credit when the cash balance cannot cover the fare. It subtracts the full fare from cash; it grants no money or debt forgiveness, preserves travel time and fatigue, and prevents duplicate booking. Lodging stops when the return journey arrives. Finance and travel explain this option.

Replaying the exact final Regional Youth save through normal actions with that return booking and nine legal club shifts recovered from −£2,215.36 on 30 June 2041 to +£119.64 on 27 August 2041: **58 days**. No source save, contracts or expenses were edited. The audit pauses optional entries and training during recovery.

Debt is treated as a recoverable state, not an automatic test failure. The audit records cash transitions at public game actions and calendar checkpoints; it cannot observe every internal transient transaction within a composite action. The tables report sampled minima rather than claiming debt is impossible.

## Older saves and independent consistency checks

Four older RT copies were checked without touching the live browser save: April 2027, July 2027, February 2028 and August 2028. Checks cover repeatable migration, save encode/decode round trips, publication idempotence, ranking sums from dated receipts, table ordering, duplicate identities and title totals where surviving history covers a complete season. Source hashes must remain unchanged.

Three older copies received the already-existing payout repair on first migration: £188,247 → £182,797; £199,015 → £162,565; £413,677 → £399,327. The August 2028 copy remained £986,239.44. A second migration did not apply those adjustments again. This is receipt consistency, not reconstruction of records that were never saved.

## Performance method and limits

Production Chromium at 1366 × 768, three passes at normal CPU and three with Chrome’s 4× CPU slowdown. This approximates constrained CPU responsiveness; it is not certification on a physical ordinary laptop. The page is throttled; worker scheduling and host load can differ. Existing RT, a genuine managed 15-season career and a 25-season fixture were tested in isolated browser storage.

The 25-season fixture contains 15 managed career seasons plus 10 CPU-world seasons advanced using calendar jumps. It holds 2,600 recorded events. Those extra ten years are a performance workload, not ten valid human balance-test seasons. Human season summary retention is capped at twelve; the event ledger and CPU history provide the decades-long workload.

Before the save changes, a throttled existing-save Continue action exceeded 60 seconds once. That interrupted run did not produce a valid before/after median. Do not infer a numerical speedup ratio from it.
| Save | Action | Normal median | 4× CPU median |
| --- | --- | ---: | ---: |
| Existing RT | Continue saved career | 1.715 s | 6.647 s |
| Existing RT | Open calendar | 0.264 s | 2.068 s |
| Existing RT | Calendar next month | 0.026 s | 0.076 s |
| Existing RT | Open rankings | 0.385 s | 2.501 s |
| Existing RT | One-Year Ranking tab | 0.232 s | 1.111 s |
| Existing RT | Open player history | 0.132 s | 0.831 s |
| Existing RT | Select oldest player season | 0.046 s | 0.131 s |
| 15 seasons | Continue saved career | 3.758 s | 16.031 s |
| 15 seasons | Open calendar | 1.385 s | 5.892 s |
| 15 seasons | Calendar next month | 0.133 s | 0.727 s |
| 15 seasons | Open rankings | 0.557 s | 3.868 s |
| 15 seasons | One-Year Ranking tab | 0.327 s | 1.609 s |
| 15 seasons | Open player history | 0.583 s | 2.133 s |
| 15 seasons | Select oldest player season | 0.043 s | 0.139 s |
| 25-season fixture | Continue saved career | 3.724 s | 20.513 s |
| 25-season fixture | Open calendar | 1.199 s | 4.374 s |
| 25-season fixture | Calendar next month | 0.153 s | 0.635 s |
| 25-season fixture | Open rankings | 0.578 s | 2.458 s |
| 25-season fixture | One-Year Ranking tab | 0.299 s | 1.186 s |
| 25-season fixture | Open player history | 0.339 s | 1.960 s |
| 25-season fixture | Select oldest player season | 0.041 s | 0.083 s |

The 25-season checks explicitly waited for Saving to finish and found no runtime, network or visible save errors in six passes. The earlier RT/15-season timings did not include a final wait for worker completion, so they do not independently establish that every queued backup had finished. Separate recovery browser tests cover save correctness.

The 25-season engine rollover was repeated three times after settling preceding CPU results. Closing the boundary took 2.466 / 2.298 / 1.718 seconds (median 2.298). Acknowledging the review and starting the next season took 1.483 / 1.434 / 0.997 seconds (median 1.434). These are Node timings on this host, excluding compression, browser rendering and CPU emulation.

Remaining performance concerns: the throttled 25-season career takes a median 20.513 seconds to continue; calendar opening takes 4.374 seconds. World and one-year ranking tab changes exceed the one-second target. These are not release-ready laptop timings. Further work should move load/decompression/migration off the rendering thread and reduce repeated calendar/ranking calculations, followed by tests on physical target hardware.

A generic production route smoke audit also checked route responses; its direct navigations return to the career launcher, so it is not used as evidence for gameplay interaction speed. The custom audit explicitly continues a career and measures real game routes and filters.

## Reproduce and inspect

- Run all starting paths: `node node_modules/tsx/dist/cli.mjs scripts/runCareerBalanceMatrix.ts --seasons=3 --seeds=104729 --concurrency=2 --export-final-save --label=readiness`.
- Repeat a long Q Tour seed: `node node_modules/tsx/dist/cli.mjs scripts/simulateFiveSeasons.ts --seasons=15 --seed=330369 --starting-level-id=start-q-tour --start-age=18 --skip-player-snapshots --skip-shared-audits --export-final-save --progress`.
- Check saved receipts and migrations: `node node_modules/tsx/dist/cli.mjs scripts/auditCareerIntegrity.ts <save.json> [more saves]`.
- Build the performance fixture after the required managed 15-season source exists: `node node_modules/tsx/dist/cli.mjs scripts/buildLongSaveFixture.ts`.
- Build and serve production on port 4175, then run `node node_modules/tsx/dist/cli.mjs scripts/auditLongSavePerformance.ts <save.json> <label>`.
- Repeat closing-boundary engine timing with `scripts/auditRolloverPerformance.ts`; reproduce the stranded-career recovery using `scripts/auditDebtRecovery.ts` with tsx.

Raw synthetic simulation reports and exported saves are in ignored `artifacts/simulations`. Private RT source copies are in ignored `artifacts/private-save-backups`. Performance samples, integrity results and recovery evidence are in ignored `artifacts/release-readiness`. This report contains aggregates; it does not publish the user's save.

The initial Q Tour matrix artifact records the discovered failure; the completed individual seed 330369 report is the successful post-fix rerun. The figures above use that rerun, not the failed matrix entry.

## Final validation

- **644/644 unit tests**, 61 files, using `npx vitest run --maxWorkers=2` after all gameplay changes.
- **11 unique browser regressions passed**: five actionable-blocker/training/debt controls, two regional pathway states, one youth/amateur ranking presentation, and three save recovery/rollover/concurrent-edit tests.
- **21 saved careers passed** independent receipt, migration, round-trip and source-integrity checks: four older RT copies, twelve three-season careers and five fifteen-season careers.
- `npm run build`, `npm run lint` and `git diff --check` passed. Build still reports the existing large main bundle warning; that is consistent with the remaining startup concern.
- Production long-save interactions: 18 passes across three save workloads, including six 25-season passes. No recorded console/resource errors; the 25-season runs also waited for saving and checked visible save warnings.
- Rollover engine check: three successful closing/start cycles. Stranded-career recovery: full fare charged and positive cash after 58 days, with source hash unchanged.

The final suite used two workers after an oversubscribed run produced timing failures. Two save-slot tests were updated to wait for asynchronous saving before switching careers. A new return-travel assertion was corrected to include the prior overseas journey and to check the two remaining nights until arrival; the browser test was corrected to use the disclosure's actual button. No failing assertions remain.

Changes are local and uncommitted. No GitHub push or release was performed by this task. The live user save was not replaced by any audit fixture.
