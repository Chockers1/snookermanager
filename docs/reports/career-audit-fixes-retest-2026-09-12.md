# Career audit fixes and repeat tests — 12 September 2026

**Retested the fixes across a 470-season target matrix and a separate 78-season follow-up.** One initial repeat stopped after 20 of its 30 seasons; that failure, its repair and a fresh 30-season rerun are documented below. The initial matrix uses 15 careers; the follow-up uses eight. The builds and limits are separated below. This is not an all-clear for balance or browser performance.

The original audit is [here](career-age-matrix-2026-09-12.md). The user’s live save was not changed. No GitHub push or release was performed in this task.

## Changes implemented

- **Correct seeded entry:** all formats with seed-dependent entry rounds now use the seed in the selected field, matching the actual draw. This includes Q Tour and World Seniors byes. Entered matches cannot start against a fallback opponent missing from the draw. Unplayed legacy entries can align their round without generating a new draw or charging money.
- **Correct team scoring statistics:** individual points count scoring, while foul penalties remain credited to the opposing frame score. No negative scoring totals are created.
- **Consistent late-age decline:** future human ageing stops at the CPU model’s underlying weighted floor of 35. Onset ages 35–40 and individual rates remain. Personality/style bonuses can make the displayed rating about 38. This is not a floor of 35 on every individual attribute, and it does not raise existing saves.
- **Correct sponsor access:** fresh careers receive the seasonal market’s offers, without also inheriting the legacy catalogue. Refreshed unaccepted legacy offers are capped by current exposure; off-tour ranking positions no longer use World-number-one multipliers. Signed payments are preserved.
- **Limit passive reputation:** publicity adds up to one point per four weeks, capped at 60. Higher earned reputation remains intact.
- **Faster field assembly:** duplicate removal uses a set and reuses the resolved format. The field and seed order remained identical in the comparison.
- **Correct the audit manager:** World Championship selection uses actual dated eligibility, including qualifying, rather than lifetime World Champion status. A former champion at #24 now selects qualifying.

## Test sequence and provenance

1. The initial fixes passed 858 tests in 81 files, TypeScript, lint and production build. An initial over-concurrent test run had five timeouts; the two-worker repeat passed all 858.
2. The same 15 age/path/seed combinations from the baseline ran again: 14 × 30 seasons plus one age-12 × 50-season career, **460 completed seasons**; the Q Tour seed 130363 stopped in its 21st season, ten short of its 30-season target. This matrix stayed on its frozen initial patch.
3. Additional investigation found the legacy-description bye path and fresh-career legacy sponsor offers. A bye-only intermediate probe passed 66 field comparisons and three senior seasons; these three seasons are supplementary, excluded from 470 and 78.
4. A separately bundled final candidate ran **78 seasons**: two age-50 careers for 30 seasons, plus three seasons for each other starting path. Those changes were combined with the saved-entry repair described below and applied to the workspace. Final regression/build and browser results are listed below.

Both matrices use Standard difficulty, middle support, balanced automated management, rotating training, the live visit engine for human singles/doubles and normal CPU event simulation. No forced wins or synthetic attribute boosts. Each starts with £8,000. The manager handles decisions conservatively and limits entries; it is not a careful human’s spending strategy. Corrected choices fork random histories, so differences in wins and money are not isolated causal estimates.

## Initial repeat: 460 completed seasons and one stopped career

47,840 event ledgers; 3,873,660 scored bracket matches; 347,930 CPU player-season records cross-checked.

| Check | Result |
|---|---:|
| Human record/bracket mismatches | 0 |
| CPU record/bracket mismatches | 0 |
| Missing completed finals | 0 |
| Invalid team-stat rows | 0 |
| Earned cards missing at next season | 0 |
| Invalid recorded break values | 0 |
| CPU major-title counters missing wins | 0 |
| Early coach departures | 0 |
| Final-save invariant flags | 0 |
| Completed pairs events | 912 |
| Recorded doubles matches | 1,372 |
| Final ranking rows independently checked | 3,872 |

The stopped save was also checked for ranking and record integrity. Its unfinished-season totals are excluded from the completed-season sum assertion.

## 78-season final-candidate follow-up

8,112 event ledgers; 656,838 scored bracket matches; 59,178 CPU player-season records cross-checked.

| Check | Result |
|---|---:|
| Human record/bracket mismatches | 0 |
| CPU record/bracket mismatches | 0 |
| Missing completed finals | 0 |
| Invalid team-stat rows | 0 |
| Earned cards missing at next season | 0 |
| Invalid recorded break values | 0 |
| CPU major-title counters missing wins | 0 |
| Early coach departures | 0 |
| Final-save invariant flags | 0 |
| Completed pairs events | 148 |
| Recorded doubles matches | 228 |
| Final ranking rows independently checked | 2,048 |

The initial repeat entered debt three times; all three episodes recovered, with a lowest observed balance of −£332.75. No final follow-up career ended with unresolved debt. These observations reflect the automated policy and sampled transactions, not guaranteed affordability for every spending strategy.

## Every final-candidate career

The six short runs check fresh starting finances and entry. Only the two senior runs cover 30 years on the final sponsor/entry candidate. The longer initial matrix is shown separately below.

| Start / path | Seed | Seasons | W–L–D | End age / OVR | Singles titles | Final cash | Minimum cash | Unresolved debt |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 12 · Club youth | 130363 | 3 | 1–69–0 | 15 / 56 | 0 | £7,170 | £6.00 | No |
| 15 · National youth | 130363 | 3 | 10–59–0 | 18 / 73 | 0 | £1,193 | £0.10 | No |
| 18 · Elite amateur | 130363 | 3 | 41–55–3 | 21 / 79 | 0 | £114,778 | £78.00 | No |
| 21 · Q Tour | 130363 | 3 | 54–27–0 | 24 / 82 | 0 | £77,062 | £78.00 | No |
| 30 · Rookie professional | 130363 | 3 | 41–26–2 | 33 / 82 | 0 | £231,022 | £78.00 | No |
| 40 · Top-64 professional | 130363 | 3 | 34–25–0 | 43 / 74 | 0 | £243,771 | £78.00 | No |
| 50 · Seniors | 104729 | 30 | 18–161–0 | 80 / 38 | 0 | £812,093 | £78.00 | No |
| 50 · Seniors | 130363 | 30 | 21–173–0 | 80 / 38 | 0 | £834,070 | £78.00 | No |

The final three-season follow-up earned a professional card for the elite-amateur start by age 20 and the Q Tour start by age 24. The rookie professional lost its card by age 33, while the top-64 professional still held a card at age 43. These are individual tested careers, not estimated promotion probabilities.

## Senior comparison with the original audit

| Seed | Original → final OVR | Original → final cash | Original → final sponsor income | Original → final wins / matches |
|---:|---:|---:|---:|---:|
| 104729 | 10 → 38 | £856,822 → £812,093 | £661,934 → £613,522 | 17/171 → 18/179 |
| 130363 | 10 → 38 | £830,209 → £834,070 | £625,716 → £627,614 | 20/196 → 21/194 |

The matches and event choices diverge after fixes. The entry and ageing corrections can also change winnings. A different ending balance alone does not prove financial balance. Existing signed terms were not cut.

## Every career in the initial repeat (470 seasons requested)

**Incomplete row:** age-21 Q Tour seed 130363 completed 20 seasons and stalled on 6 May 2047 at World Seniors. Its actual draw gave a last-16 bye, while progress expected Round One. A completed old live match prevented entry repair. No phantom match was allowed; the fixture guard correctly stopped play, exposing the remaining entry defect. Match and cash totals in that row include its unfinished 21st season. The final fix and fresh rerun are below.

| Start / path | Seed | Seasons | W–L–D | Titles | World wins / finals | OVR start → peak → end | Final cash |
|---|---:|---:|---:|---:|---:|---:|---:|
| 12 · Club youth | 104729 | 30 | 491–445–26 | 11 | 1/1 | 47 → 91 → 90 | £8,969,441 |
| 12 · Club youth | 130363 | 30 | 510–438–17 | 8 | 0/2 | 47 → 90 → 89 | £8,971,243 |
| 12 · Club youth | 155921 | 50 | 472–538–22 | 7 | 1/1 | 47 → 91 → 49 | £7,052,301 |
| 15 · National youth | 104729 | 30 | 597–372–39 | 10 | 0/1 | 63 → 93 → 90 | £7,615,938 |
| 15 · National youth | 130363 | 30 | 735–440–36 | 28 | 1/1 | 63 → 93 → 89 | £15,853,117 |
| 18 · Elite amateur | 104729 | 30 | 662–372–27 | 13 | 1/2 | 68 → 93 → 86 | £12,253,814 |
| 18 · Elite amateur | 130363 | 30 | 661–387–30 | 12 | 1/2 | 68 → 92 → 85 | £10,723,212 |
| 21 · Q Tour | 104729 | 30 | 707–392–35 | 20 | 2/3 | 72 → 92 → 81 | £16,857,772 |
| 21 · Q Tour | 130363 | 20 | 392–192–29 | 3 | 0/0 | 72 → 92 → 92 | £2,730,738 |
| 30 · Rookie professional | 104729 | 30 | 398–287–20 | 6 | 0/1 | 72 → 89 → 60 | £7,010,103 |
| 30 · Rookie professional | 130363 | 30 | 381–239–26 | 9 | 1/1 | 72 → 89 → 58 | £6,893,500 |
| 40 · Top-64 professional | 104729 | 30 | 78–190–1 | 0 | 0/0 | 74 → 75 → 38 | £1,236,525 |
| 40 · Top-64 professional | 130363 | 30 | 68–196–1 | 0 | 0/0 | 74 → 74 → 38 | £1,193,721 |
| 50 · Seniors | 104729 | 30 | 18–161–0 | 0 | 0/0 | 68 → 68 → 38 | £812,093 |
| 50 · Seniors | 130363 | 30 | 21–173–0 | 0 | 0/0 | 68 → 68 → 38 | £834,070 |

CPU World champions averaged **30.9 years** (range 19–41). Human World finals: **8 wins from 15 appearances**.

## Match fairness probe

18,000 synthetic equal-ability matches: ratings 47, 60 and 85, best-of-three and best-of-seven, 3,000 seeds per combination. Equal attributes, confidence, fatigue, equipment and plans; starting side alternated. Actual win rates were **49.97%–50.63%**. This supports basic side parity. It does not validate unequal-opponent forecasts, career opponent construction, session recovery or youth scheduling.

## Final correction: stopped-career recovery and fresh 30-season rerun

The final source also repairs an unplayed entry when the retained live match is already completed. Active matches and any scored human draw fixture are protected. The actual stopped save moved from Round One to Last 16 and started that match with the same draw and cash. Repeating the repair made no further change.

The fresh age-21 Q Tour seed 130363 rerun completed **30/30 seasons**, ending at age 51, overall 80, with 560 wins, 287 losses, 37 draws and £5,819,904. It produced 3,120 event ledgers and 252,630 scored bracket matches.

Record-check flags: {}; invalid team rows: 0; missing earned cards: 0; unfinished published finals: 0; final-save flags: 0. The original failure is retained in the initial matrix, not relabelled as a pass.

## Regression and storage verification

- **872/872 tests passed in 81 files**, using two workers. TypeScript project build, changed-file lint, production build and whitespace checks passed. The initial final-suite run exposed two test-fixture assumptions: a synthetic legacy market retained a new-market email, and a forced Q School win could leave an unanswered decision. The fixtures now represent a legacy inbox and respond through the normal decision action; the next complete run passed.
- **Six browser storage tests passed**, including named-copy reload on the newly simulated 50-season save, failed-write preservation and transactional deletion.
- Full and archived versions of existing 25- and 50-season saves produced identical gameplay fields, 104 entry decisions per save, seeded season rollover, CPU development/cards, finances and next-season opening.
- The new 50-season save archived and materialized without data loss or browser errors: 220.90 MB raw JSON became 29.11 MB active JSON plus 2,456 archive entries. The compressed active payload was 3.687 million characters. First conversion took 13.32 seconds during concurrent simulation load; this is a one-time migration measurement, not an idle load benchmark.
- Four initial-matrix jobs were interrupted by a Windows progress-manifest file-lock error. Their logs were preserved and those cases restarted on the frozen initial game module. Progress writing now uses a temporary file, replacement and retry. This infrastructure interruption is distinct from the reproduced World Seniors game bug.

## Browser performance

Production build, isolated browser storage, 1366×768 viewport; three passes at normal CPU and three at 4× CPU throttling. The same archived 25- and 50-season fixtures were used before and after. Final timings were measured after career simulations stopped. CPU throttling approximates reduced CPU capacity; this is not a test on a physical low-end laptop.

| Save / CPU | Cold career ready, before → after | Open rankings, before → after | Inbox selection after, median / maximum |
|---|---:|---:|---:|
| 25 seasons / 1× | 1.70s → 1.66s | 0.26s → 0.20s | 22 / 26 ms |
| 25 seasons / 4× | 4.45s → 4.04s | 1.66s → 1.09s | 62 / 101 ms |
| 50 seasons / 1× | 1.85s → 1.76s | 0.28s → 0.23s | 22 / 32 ms |
| 50 seasons / 4× | 5.96s → 4.58s | 1.51s → 1.08s | 78 / 115 ms |

All measured routes and interactions are in the raw performance JSON: inbox, calendar views and month navigation, season planning, every ranking tab, qualification dialog, player history and oldest saved season. Both fixtures completed all six passes with zero browser errors.

The field-building microbenchmark kept all entrants and seed order identical across 700 builds. Median time fell from 15.71 ms to 4.45 ms per 192-player field. That focused improvement does not eliminate JSON parsing or whole-save repair costs. A separate under-load browser run was excluded from the before/after table.

## Remaining issues and limits

1. **Youth career balance is still poor under this manager.** In the final three-season age-12 run, the player won 1 of 70 singles matches; the age-15 run won 10 of 69. They improved in ability but the manager entered difficult mixed fields and spent aggressively. Equal-ability engine parity does not clear unequal-opponent forecasts, actual equipment effects or age-appropriate scheduling. This needs a dedicated controlled comparison, not an arbitrary human win bonus.
2. **The economy still becomes forgiving in long careers.** Final senior saves held about £812,093 and £834,070 despite very few singles wins and little prize money. New sponsor access and passive publicity are corrected, but accumulated support, signed contracts and limited spending remain. Sponsorship can continue after retirement until existing contracts end; those terms were deliberately preserved.
3. **Long-save cold loading is still a performance target.** History is preserved and retrieved from archives, but roughly 29 MB of active JSON remains in the 50-season fixture. Parsing, current ledgers, roster data and state repair need further separation. The draw-builder optimization is not a complete loading fix.
4. **Final-build coverage is not uniform.** The initial broad matrix used an earlier frozen patch. The later sponsor/complete-bye candidate has two 30-season senior runs and six three-season starts; the final stopped-entry repair has a fresh 30-season Q Tour run and direct old-save/regression tests. Not all 15 original careers were rerun again on the final exact source.
5. **These are automated policies and two seeds per starting path, not a population study.** The one 50-season run started at age 12. Starts covered ages 12, 15, 18, 21, 30, 40 and 50—not every integer age. Browser storage tests do not measure maximum capacity on every device, and performance figures do not establish responsiveness on all ordinary laptops.

## Files and reproducibility

- [Original baseline report](career-age-matrix-2026-09-12.md)
- [Initial repeat careers CSV](career-age-matrix-retest-2026-09-12-careers.csv), [season records](career-age-matrix-retest-2026-09-12-seasons.csv), [attribute development](career-age-matrix-retest-2026-09-12-development.csv)
- [Final sponsor/entry follow-up careers](career-final-fixes-followup-2026-09-12-careers.csv), [seasons](career-final-fixes-followup-2026-09-12-seasons.csv), [development](career-final-fixes-followup-2026-09-12-development.csv)
- [Fresh stopped-case rerun](career-stall-retest-2026-09-12-careers.csv), [seasons](career-stall-retest-2026-09-12-seasons.csv), [development](career-stall-retest-2026-09-12-development.csv)

Raw manifests, exact tested patches/modules, progress logs and invariant reports are retained locally under `artifacts/age-matrix-fixed-20260912`, `artifacts/age-matrix-final-followup-20260912`, and `artifacts/age-matrix-stall-retest-20260912`. Full save snapshots and annual ledgers are in `artifacts/simulations`; browser results are in `artifacts/release-readiness/age-matrix-final-25` and `age-matrix-final-50`. These large raw artifacts are ignored by Git. Base revision: `a105d7ec11e3960297acfcab2f60e332ac78540e`; version 0.1.2, with the uncommitted fixes described above.
