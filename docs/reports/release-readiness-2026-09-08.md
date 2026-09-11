# Release-readiness testing — 8–11 September 2026

This pass covers save recovery, promotion routes, debt recovery, management strategies, first-match onboarding, responsive controls and long-save performance. Automated coverage does not replace an independent new player or a physical low-powered laptop test.

## Reproduced defects and changes

- **Damaged active saves:** loading previously fell back silently to a starter career. Continuing could then replace the unreadable save. Loading now preserves the payload, reports the failure and exposes recovery controls.
- **Failed named-save loads and imports:** validation now happens before activation. Import and activation storage writes roll back together when storage fails, preserving the existing active career and named-save index.
- **Earned cards in older saves:** a published Q School or Q Tour playoff win was insufficient when the separate career summary was absent. Season rollover now honours the published award for the human player as well as CPU players.
- **Inherited EBSA cards:** a runner-up awarded an already-qualified champion’s card could still enter Q School. Eligibility now reads the same dated award record as rollover, including runner-up awards. The European automatic place locks when Event 7 finishes; a later EBSA win does not overwrite that earlier award and can pass its card to the runner-up.
- **Repeated startup work:** Continue reuses the already-repaired launcher snapshot if the persisted payload and inbox overlay are unchanged. The temporary snapshot is released after entering the career.
- **Closed panels:** Calendar’s season-planning recommendations and Rankings’ qualification forecasts are computed when their panels are opened. Unsaved planning selections remain in the panel state when it is closed.

## Recovery and storage

Tests cover interrupted compression, a cancelled refresh, forced window closure, changes arriving during compression, switching-career guards, storage failures during import, corrupt active/named saves, corrupted backup checksums, backup rotation and season-rollover backup failure.

A forced close preserves the last completed save. It cannot guarantee preservation of progress still marked **Saving…**. A normal refresh during that interval triggers the browser’s unsaved-progress warning.

Twenty-one existing saves and all twelve final strategy saves passed repair, compressed round-trip, repeat-repair and repeat-publication checks: **33 saves, covering 160 archived season summaries**. The audit verifies cash is not paid twice, ranking receipt sums and order, unique identities, retained title totals where a complete season history exists, and unchanged source files. Evidence: `artifacts/release-readiness-2026-09-08/save-integrity.json` and `strategy-save-integrity.json`.

## Promotion coverage

The deterministic full-calendar fixture checks European automatic qualification, three Global Play-Off section winners, eight UK/Europe Q School places across two events, four Asia-Oceania places across two events, regional standings and federation awards. Awarded players retain two-year cards through allocation without duplicate identities or exceeding the field limit.

Separate older-save cases exercise human automatic, playoff, Q School and federation awards when summary records are missing. These are targeted outcome fixtures, not estimates of a normal player’s promotion probability.

The preceding [7 September audit](release-readiness-2026-09-07.md) covered all 12 starting paths for three cycles each and longer 15-season careers. Those are prior results, not extra completed runs in this pass. This pass adds the targeted award cases and the policy comparison below.

## Debt edge cases

Each scenario starts from an isolated copy of the previously insolvent 15-season career, dated 30 June 2041, with **−£2,215.36**. Fixture variations remove sponsors, expire their contracts, add an existing £200/week staff contract or reserve 21 calendar days. During recovery there are no cash edits or new sponsorships. The manager books the full-priced emergency return, pauses optional competition/training, releases staff after two advancement steps and searches for legal club-work dates.

| Scenario | Days to positive cash | Closing cash | Shifts booked |
| --- | ---: | ---: | ---: |
| No sponsors | 86 | £71.64 | 13 |
| Expiring sponsorships | 79 | £22.64 | 12 |
| Staff costs, then release | 93 | £76.64 | 14 |
| Initially blocked work dates | 99 | £121.64 | 12 |

Existing normal weekly income and expenses continue to settle. These results demonstrate a recovery route, not a guarantee under continued expensive spending. Original save hashes were unchanged. Evidence: `artifacts/release-readiness-2026-09-08/debt-edges.json`.

## New-player and accessibility coverage

Unboosted club-junior and rookie-professional starts completed all six guide steps using visible controls: training, basic equipment purchases, entry, travel, preparation and a recorded match. Completion survived reload. Existing tests cover visible career creation and every round of a tournament separately.

Responsive checks include long names, 130% in-game text, high contrast, keyboard navigation, phones and a half-width CSS viewport approximating 200% browser-zoom reflow. The latter is a viewport approximation, not physical browser or operating-system zoom certification. Screenshots were inspected in addition to overflow assertions. Results retain explicit win/loss characters rather than relying only on colour.

## Final strategy comparison

All **12 careers completed five season cycles: 60 cycles, 2,318 matches and 973 entered events**, with no integrity failures. Every career began on the Q Tour pathway at age 18 and overall 72. There were no calibration boosts or forced wins. Three fixed seeds were reused for each policy; different actions change subsequent simulated results, so these are exploratory comparisons, not controlled estimates of promotion probabilities.

- **Aggressive:** earliest affordable eligible event in the manager’s selection window; default training and moderate support.
- **Training:** enter only on every fourth career week; rotate potting, safety, mental and fitness focuses, with moderate support.
- **Recovery:** skip entry above 35 fatigue and use recovery training from 20 fatigue; otherwise rotate focuses, with moderate support.
- **Frugal:** cheapest affordable eligible event and lowest-cost support/equipment policy. This changes both scheduling and support, so differences cannot be attributed to event selection alone.

| Policy | Seed | Overall after each cycle | Matches | Events | Final cash | Lowest sampled cash | Ever earned card / active at end |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| Aggressive | 104729 | 76 → 80 → 82 → 84 → 85 | 280 | 131 | £38,145 | £78.00 | No / No |
| Aggressive | 130363 | 76 → 79 → 82 → 84 → 85 | 293 | 130 | £154,033 | £78.00 | No / No |
| Aggressive | 155921 | 75 → 79 → 82 → 84 → 85 | 268 | 132 | £117,332 | £78.00 | Yes / No |
| Training | 104729 | 77 → 80 → 82 → 83 → 85 | 147 | 46 | £46,485 | £78.00 | No / No |
| Training | 130363 | 76 → 80 → 82 → 83 → 85 | 147 | 46 | £28,361 | £78.00 | No / No |
| Training | 155921 | 76 → 80 → 82 → 84 → 85 | 132 | 46 | £8,795 | £78.00 | No / No |
| Recovery | 104729 | 75 → 79 → 81 → 82 → 84 | 164 | 60 | £8,149 | £78.00 | No / No |
| Recovery | 130363 | 75 → 79 → 81 → 82 → 84 | 188 | 59 | £64,429 | £78.00 | Yes / Yes |
| Recovery | 155921 | 75 → 79 → 81 → 82 → 84 | 171 | 59 | £24,046 | £78.00 | Yes / Yes |
| Frugal | 104729 | 76 → 79 → 82 → 83 → 85 | 169 | 88 | £91,912 | £7,643.20 | No / No |
| Frugal | 130363 | 76 → 79 → 81 → 83 → 84 | 181 | 88 | £105,615 | £7,609.00 | No / No |
| Frugal | 155921 | 76 → 80 → 81 → 83 → 84 | 178 | 88 | £77,824 | £7,609.00 | No / No |

**Promotion:** three of twelve careers earned a card, all through Q School. Aggressive seed 155921 earned it after cycle three and lost it after cycle five. Recovery seeds 130363 and 155921 earned cards at the final rollover; their subsequent professional seasons have not been observed in this comparison. No human automatic European or Global Play-Off promotion occurred in this sample; those routes are verified by the targeted fixtures above. This is insufficient evidence to tune their qualification rates.

**Development:** final overall still converges to 84–85, but the individual builds differ. The weakest final attribute was 65.19–65.65 for aggressive scheduling, 71.67–71.71 for protected training, 70.63–70.96 for recovery and 66.28–66.50 for frugal management. Within-policy growth remains similar across seeds. These five-cycle runs demonstrate scheduling effects, not enough variation across an entire lifetime.

**Finances:** none of these twelve careers entered sampled debt. Moderate-support managers repeatedly spent down to £78; the frugal managers kept more than £7,600 at their lowest sampled point. The separate debt scenarios above test recovery when cash is already negative. Sampling covers actions and calendar checkpoints, not every internal mutation inside a composite action.

One heuristic warning flagged recovery seed 130363’s strong pathway record but 0% professional win rate. The player earned the card at the final boundary; this run contains no subsequent professional season to evaluate. It is not an observed failed professional transition. The audit script now requires at least ten professional matches before emitting that warning in future runs.

Evidence: `artifacts/release-readiness-2026-09-08/strategy-comparison.json`, the four `balance-matrix-strategy-final-*-2026-09-08.json` files and their per-career reports/saves under `artifacts/simulations`.

## Long-save performance

Completed in production Chromium at 1366×768, with **three normal passes and three passes at simulated 4× CPU slowdown for each save**. Host: Dell Precision 7760, Intel i9-11950H, eight cores / sixteen threads, approximately 63 GB reported RAM. Own simulations and unit runs were stopped during browser measurement. CPU emulation is not certification on a low-powered laptop and does not faithfully reproduce its memory, storage or worker-thread performance.

The RT snapshot is dated **12 August 2028**, with 177 published events across three season labels and 9.67 MB of uncompressed JSON. The long-career fixture is dated **30 June 2051**, with 2,600 published events across 25 season labels and 48.33 MB of JSON. Browser setup uses compressed saves. The isolated fixture dismisses a pending season-review overlay; original files are preserved.

Medians below are seconds. Cold opening waits for the dashboard’s results section, including loading before the launcher and after Continue. Other rows measure navigation or interaction through the next rendered frames.

| Action | RT normal | RT 4× | 25 seasons normal | 25 seasons 4× |
| --- | ---: | ---: | ---: | ---: |
| Cold opening to usable dashboard | 1.338 | 3.459 | 2.509 | 12.742 |
| Continue after launcher is ready | 0.470 | 1.014 | 0.809 | 5.268 |
| Open inbox | 0.066 | 0.299 | 0.482 | 2.066 |
| Open Calendar | 0.079 | 0.296 | 0.680 | 3.717 |
| Change month | 0.025 | 0.031 | 0.024 | 0.043 |
| Open season-planning editor | 0.028 | 0.185 | 0.041 | 0.275 |
| All tours + season priorities | 0.156 | 1.102 | 0.362 | 2.617 |
| Open Rankings | 0.171 | 0.930 | 0.621 | 3.871 |
| One-year ranking tab | 0.084 | 0.497 | 0.213 | 1.384 |
| World ranking tab | 0.093 | 0.559 | 0.218 | 1.381 |
| Open qualification races | 0.093 | 0.605 | 0.101 | 0.629 |
| Open player history | 0.130 | 0.531 | 0.646 | 2.041 |
| Oldest-season history filter | 0.042 | 0.073 | 0.043 | 0.084 |

Inbox-selection median ranges across the four sampled messages:

- RT snapshot, 1×: 0.014–0.023 seconds.
- RT snapshot, 4×: 0.030–0.031 seconds.
- 25-season fixture, 1×: 0.121–0.144 seconds.
- 25-season fixture, 4×: 0.769–0.902 seconds.

**No browser exceptions, failed requests or save warnings occurred in the twelve completed passes.** The earlier stopped attempt used an invalid selector for the calendar’s Month view; it is excluded. The final script switches to List view before opening planning and records each completed action immediately.

**Performance gaps remain:** the 25-season cold opening exceeds the three-second target under slowdown (12.742-second median; 13.403-second maximum), as do Calendar and Rankings navigation. Several ranking tabs exceed the one-second interaction target; the all-tours planning change has a 2.617-second median. Player-history opening has a 2.041-second median and a 5.289-second outlier. Loading and deriving views from decades of data remains the next performance priority. The smaller RT snapshot is considerably faster, although its cold opening under slowdown still slightly exceeds three seconds.

These are absolute measurements of the final build. The previous benchmark timed Continue with a different readiness condition, so these figures are not a controlled before/after speed-up claim.

**Season rollover:** three engine passes completed successfully. Median closing-boundary processing was 1.706 seconds; starting the next season took 1.099 seconds. Prior CPU event results were settled before timing. This excludes an entire unsimulated season, browser rendering and save compression, so it is not the total user-visible wait for every possible year-end state.

Evidence: artifacts/release-readiness/existing-rt-verified-20260911/ and twenty-five-season-verified-20260911/ contain all samples and per-action medians/maxima. Rollover samples: artifacts/release-readiness-2026-09-08/rollover-performance.json.

## Validation status

**Browser suite: 215 passed. Unit suite: 655 unique tests passed across the full run and isolated rerun.** The full unit run passed 654/655 while simulations were running; one season-completion test exceeded its 30-second limit. The same three-test file subsequently passed without that load in 20.37 seconds total. No timeout was relaxed. Production TypeScript/Vite build and ESLint passed. Vite still reports the existing large main-bundle warning (691 kB before gzip). Initial browser failures included stale UI assertions and reading storage before asynchronous saves completed; those checks now wait for durable writes and open expandable panels before asserting their contents. Interrupted-save tests inspect raw storage deliberately while saving remains pending.

Remaining external checks: an independent new player’s comprehension of the first season; physical low-powered laptop performance; actual browser/OS zoom. No private save was pushed or published by this testing pass.


## Reproducing the checks

Run performance separately from CPU-heavy tests and simulations. Build the production app, start a preview on port 4175, then run the audit against an isolated save copy. Replace the angle-bracket placeholders below.

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
npx tsx scripts/auditLongSavePerformance.ts <save-copy.json> <unique-report-label>
npx tsx scripts/auditCareerIntegrity.ts <save-copy.json>
npx vitest run --maxWorkers=1 --testTimeout=30000 --hookTimeout=60000
npx playwright test
```

Run the strategy matrix for each of aggressive, training, recovery and frugal; use worst support for frugal and middle for the others. Give each run a unique label:

```powershell
npx tsx scripts/runCareerBalanceMatrix.ts --paths=start-q-tour --seasons=5 --seeds=104729,130363,155921 --concurrency=3 --manager-policy=aggressive --support-profile=middle --audit-label=my-audit --label=my-aggressive-audit --export-final-save --progress
```

The debt script uses the retained insolvent 15-season fixture. Promotion outcomes are covered in src/game/promotionRoutes.test.ts and dated card inheritance in src/game/pathwayRules.test.ts.
