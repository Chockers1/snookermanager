# In-season systems implementation and verification

All five planned systems are implemented locally: evidence-based form recovery, staff ambitions and movement, fictional pairs events with playable doubles, contextual interviews, and persistent connected stories. See [the player and implementation guide](../in-season-life.md) for locations and mechanics.

## Delivered behaviour

- Form assessment in Training and Match Review uses bounded modelled evidence and an earlier personal baseline. Four recovery routes, passive expiry, an eight-week episode cooldown and a three-point situational cap preserve permanent attributes. Aggregate Quick Sim outcomes are not invented shot evidence; active issues use the visit engine in Quick Sim.
- Staff notices show binding dates, explicit extension costs, dated promises and defaults. Named CPU employment prevents recruitment until the contract ends. Junior coaches use real slots and develop through completed work, with a responsibility review.
- The calendar links to optional Youth Club Pairs, Amateur Club Pairs and Nations Pairs. Four named teams play two singles and, when needed, doubles. Individual order, breaks, fouls, condition and statistics persist through reload. Awards, trophies and team results are isolated from singles rankings and titles.
- Significant optional interviews expire without penalty. Small recorded relationship effects and repeated relevant commercial expectations are explained. Five factual story arcs use stored updates; resolved conclusions and older team trophies survive detailed-record archiving.
- Neutral save migration preserves existing contracts, projects and money. No new feature adds a permanent banner stack to the Tournament Hub. Inbox navigation displays stored records.

## Automated verification

Build (including TypeScript) and lint pass. The final clean full run passed **707 tests across 63 files**, including 52 new season-life tests. No timeout settings were relaxed. Earlier fixture failures were corrected and their regression cases remain in the suite. Tests exercise insufficient form evidence and isolated bad luck, all recovery choices, penalty caps, repeat loading, staff promises and expiry, recruitment exclusion, junior mentoring, doubles order and foul replay, team accounting and eligibility, interview deadlines and deduplication, and old-save migration.

The browser regression set covers 49 distinct scenarios across the new features and existing career controls, responsive layouts, save recovery and Match Centre behaviour. A large-text doubles view was visually inspected at 1024×768 with 20px root text. The final team-page Resume match link is covered by the interrupted doubles browser test. The existing inbox presentation is reused.

## Career runs

Four managed paths ran for two seasons each with normal game actions and the new decision policy. The final completed matrix produced 14 team events, 99 rubbers and 15 deciding doubles, with zero integrity flags and no changes to singles records from team settlement. Staff departures to named CPU players, junior development and rollover were exercised. The earlier matrix before the partner-availability correction also passed (14 events, 97 rubbers, 13 doubles).

| Start | Seed | End age | End overall | Closing cash in final matrix |
| --- | ---: | ---: | ---: | ---: |
| National youth | 104729 | 17 | 69 | £1,340 |
| Elite amateur | 204732 | 19 | 76 | −£2,623 |
| Q Tour | 304735 | 20 | 79 | £8,183 |
| Top-16 professional | 404738 | 23 | 85 | £558,501 |

| Path | Invitations | Completed team events | Rubbers | Doubles | Team trophies | Junior experience |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Youth | 4 | 4 | 28 | 4 | 4 | 4 |
| Amateur | 4 | 2 | 15 | 3 | 0 | 2 |
| Q Tour | 4 | 4 | 27 | 3 | 3 | 5 |
| Professional | 4 | 4 | 29 | 5 | 2 | 24 |

The amateur policy declined the later optional invitations when money was unavailable. This did not block normal advancement.

The amateur debt is a real management-policy outcome, not hidden or reset. A copied career cleared £2,623 in 53 days using lower costs and eight legal paid club shifts, finishing at £51. Cash was not edited and no new sponsors were injected. The source file was unchanged. The balance briefly fell further before the first work payment. Evidence: `artifacts/season-life-debt-recovery.json`.

No natural human promotion occurred in this small eight-season matrix. Dedicated promotion-route tests separately verify human and CPU qualification awards and next-season card retention. The matrix does not establish a population promotion rate.

## Performance methodology

Production Chromium at 1366×768, normal CPU and simulated 4× slowdown. Fixtures are isolated copies of RT (177 event records, about 9.7 MB) and the 25-season snapshot (2,600 events, about 48.3 MB). Existing careers were not overwritten.

The first 25-season benchmark developed substantial slowdown across reused browser contexts. Its partial samples remain in `artifacts/release-readiness/season-life-25-final`. A separate fresh-browser profile recovered to earlier baseline timings. The final harness detaches CDP sessions and uses a new browser for each pass; three passes per rate are compared below. This is repeatable local emulation, not certification on a physical ordinary laptop.

## Final performance results

Three fresh-browser passes per fixture and CPU rate; medians in milliseconds. Both reports contain zero console errors, failed requests or save warnings.

| Save | Action | Earlier 4× median | Final 4× median | Final normal CPU median |
| --- | --- | ---: | ---: | ---: |
| RT | Cold navigation to career ready | 3,459 | 3,010 | 1,242 |
| RT | Select inbox message 1 | 31 | 34 | 14 |
| RT | Open calendar | 296 | 274 | 80 |
| RT | Open rankings | 930 | 830 | 156 |
| RT | Open player history | 531 | 647 | 92 |
| 25-season | Cold navigation to career ready | 12,742 | 9,901 | 2,396 |
| 25-season | Select inbox message 1 | 769 | 545 | 97 |
| 25-season | Open calendar | 3,717 | 2,553 | 430 |
| 25-season | Open rankings | 3,871 | 3,150 | 557 |
| 25-season | Open player history | 2,041 | 2,116 | 464 |

RT inbox-click medians are 26–34 ms at 4× CPU slowdown; the 25-season medians are 538–608 ms. The detailed form/staff dialogs remain cheap to open (RT 69/71 ms; 25-season 74/80 ms). No new whole-career calculation runs on message selection.

These measurements do not establish that every screen became faster. Player-history navigation varied upward (RT 531→647 ms; 25-season 2,041→2,116 ms). The 25-season cold start remains about 9.9 seconds under throttling, rankings about 3.15 seconds, and training had a 3.97-second maximum. Long-save loading still offers room for improvement.

The earlier severe repeated-context slowdown was not reproduced in the three final isolated passes. Its samples and the additional CPU profile are retained; this is an observation, not proof of a single root cause.

The skill-provided route crawler also passed a production launcher smoke test (HTTP 200, 695 ms, no errors). It did not enter a saved career; the custom benchmark provides the actual career-tab coverage.

## Evidence locations

- `artifacts/season-life-all-unit-clean.log` (707/707), `season-life-final-focused-verified.log` (52/52), and the build/lint logs.
- `artifacts/season-life-browser-regression.log`, `season-life-browser-recheck.log`, `season-life-browser-final.log`.
- `artifacts/season-life-doubles-large-text.png`.
- `artifacts/season-life-careers-verified.log`, exported `season-life-verified-20260911` simulation reports and copied saves.
- `artifacts/season-life-debt-recovery.json`.
- `artifacts/release-readiness/season-life-rt-final` and final fresh-browser reports.

The final timing fixtures have no active team matches. The final resume-link-only UI correction is covered by the subsequent browser run. No release or Git push was performed for this implementation request.
