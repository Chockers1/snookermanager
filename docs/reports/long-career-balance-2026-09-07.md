# Long-career development, promotion and debt recovery audit

## Findings

- **Debt recovery.** 42 of 42 observed debt episodes recovered across all careers and controls. The longest lasted 398 days and the deepest balance was £-3,065. The automated spending policy did not use club work. The separate practical test cleared £500 through five club-work shifts in 29 days, without prizes, sponsors or allowance.
- **Development.** Final overall ranges: Youth: 74.0; Elite amateur: 83.0; Q Tour: 85.0; Rookie professional: 84.0–85.0. Yearly trajectories and attribute differences are tabulated below. The rotating controls are reported separately.
- **Promotion.** Among the non-professional starts: Youth: 0/3 earned a card; Elite amateur: 2/3 earned a card; Q Tour: 0/3 earned a card. 2/3 rookie professionals regained a card after losing one. Exact award dates and sources are below.
- **Interpretation.** These are small samples of identical starting templates using fixed management policies. They justify examining route difficulty and training coverage; they do not establish a precise population promotion rate.
- **Training coverage is a concrete follow-up.** Routine gains target only a subset of attributes. Several other skills require an active development project for session-based gains. That needs attention before adding random growth merely to make the numbers look different.

## Scope and method correction

The core comparison has 12 careers; two extra rotating-training controls add 30 seasons, making 14 careers and 210 career-seasons in total.

Completed **12 careers × 15 seasons = 180 career-seasons**, covering 4022 human matches. Three seeds per starting path; youth starts age 13, elite amateur age 17, Q Tour and rookie professional age 18. The oldest tested human is 33, so this is not a retirement/decline audit.

The earlier two-season report used a legacy harness that added scripted attribute pulses and preparation adjustments outside the game. Those adjustments are disabled here. The same starting templates, seeds and middle management policy are retained, but the outcomes are not an extension of those artificially adjusted careers. The first two years here provide the corrected baseline. No gameplay balance formulas were changed. A second legacy test restriction also required the human to already appear in the target ranking table. That is not a game entry rule and wrongly suppressed eligible events after rollover. This comparison removes it; interim runs using that restriction are excluded.

The manager uses actual equipment purchases, coaching, training, sponsorship, entry, travel, preparation and quick simulation. Its automatic choices are not a careful human spending strategy. It does not book club work in the main career runs; the separate recovery test explicitly uses it. Different world seeds do not create different player templates or training preferences, so this measures divergence under the same starting conditions, not the full range of human playing styles.

```powershell
npm.cmd run simulate:balance-matrix -- --seasons=15 --seeds=104729,130363,155921 --concurrency=3 --paths=start-regional-youth,start-elite-amateur,start-q-tour,start-rookie-pro --progress
npx.cmd tsx scripts/testDebtRecovery.ts
npx.cmd tsx scripts/simulateFiveSeasons.ts --seasons=15 --seed=104729 --starting-level-id=start-regional-youth --start-age=13 --rotate-training --skip-player-snapshots --skip-shared-audits
npx.cmd tsx scripts/simulateFiveSeasons.ts --seasons=15 --seed=304735 --starting-level-id=start-q-tour --start-age=18 --rotate-training --skip-player-snapshots --skip-shared-audits
npx.cmd tsx scripts/summarizeLongCareer.ts
```

`--calibration-adjustments` is now an explicit opt-in for the old synthetic mode. Its files use a different suffix and are excluded from this report. The final corrected matrix runs each unique career once; interim calibration and ranking-membership-restricted results are excluded.

## Debt: duration and recovery, not a failure for crossing £0

Observed **39 debt episodes**, of which **39 recovered** before the run ended. **0 careers** ended with an unresolved episode. Lowest sampled balance: **£-3,065**; longest observed episode: **398 days**.

The audit observes cash before/after recorded actions and at calendar and season checkpoints. It does not capture every internal intermediate mutation inside a composite action. Overlapping observations of the same debt spell are merged; the old harness could observe a pre-advance state twice. Same-day debt and recovery is recorded as zero days. Recovery means reaching a non-negative balance, not just receiving an income payment.

| Start | Seed | Episodes | Recovered | Lowest cash | Longest days | End balance | Unresolved |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Youth | 104729 | 11 | 11 | £-248 | 28 | £5,238 | No |
| Youth | 130363 | 15 | 15 | £-275 | 9 | £5,490 | No |
| Youth | 155921 | 4 | 4 | £-84 | 7 | £7,434 | No |
| Elite amateur | 204732 | 3 | 3 | £-3,065 | 398 | £25,106 | No |
| Elite amateur | 230366 | 4 | 4 | £-3,064 | 356 | £27,615 | No |
| Elite amateur | 255924 | 2 | 2 | £-2,984 | 342 | £125,544 | No |
| Q Tour | 304735 | 0 | 0 | £78 | 0 | £118,032 | No |
| Q Tour | 330369 | 0 | 0 | £78 | 0 | £136,799 | No |
| Q Tour | 355927 | 0 | 0 | £78 | 0 | £64,667 | No |
| Rookie professional | 404738 | 0 | 0 | £78 | 0 | £642,702 | No |
| Rookie professional | 430372 | 0 | 0 | £78 | 0 | £563,539 | No |
| Rookie professional | 455930 | 0 | 0 | £78 | 0 | £733,248 | No |

### Verified way out without winning

Synthetic £500 debt; no baseline income, sponsors, staff or match prizes; reserve paid club work and advance through real calendar actions.

All four starts booked club work while £500 in debt, paid nothing upfront, completed five shifts and reached **+£100 in 29 days**. That is £600 earned with zero match winnings, sponsors or baseline allowance. The test uses the real commitment and calendar actions, not a direct cash grant.

In the game: **Finance → Book club work**. It pays £120 for one reserved day, at most once per seven days, and uses time that otherwise could be spent training. Existing event and planning commitments can restrict dates. Recurring costs still need to be reduced if they exceed the available income; the test deliberately removes staff and other spending to isolate the recovery route.

## Yearly overall development

Each cell is the range across three seeds at that season rollover. Values at year 0 are the identical starting templates.

| Year | Youth | Elite amateur | Q Tour | Rookie professional |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 54.0 | 68.0 | 72.0 | 72.0 |
| 1 | 59.0 | 73.0 | 77.0 | 78.0 |
| 2 | 63.0 | 79.0 | 82.0 | 81.0 |
| 3 | 67.0 | 81.0 | 84.0 | 82.0–83.0 |
| 4 | 71.0 | 82.0–83.0 | 84.0–85.0 | 83.0–84.0 |
| 5 | 73.0 | 82.0–83.0 | 84.0–85.0 | 83.0–84.0 |
| 6 | 73.0–74.0 | 82.0–83.0 | 84.0–85.0 | 83.0–84.0 |
| 7 | 73.0–74.0 | 82.0–83.0 | 84.0–85.0 | 83.0–84.0 |
| 8 | 73.0–74.0 | 82.0–83.0 | 84.0–85.0 | 84.0 |
| 9 | 73.0–74.0 | 82.0–83.0 | 84.0–85.0 | 84.0 |
| 10 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |
| 11 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |
| 12 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |
| 13 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |
| 14 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |
| 15 | 74.0 | 83.0 | 85.0 | 84.0–85.0 |

### Attribute differences hidden by an overall rating

The mean attribute spread is the average, across all 15 attributes, of the maximum minus minimum rating among the three seeds. A shared rounded overall can still hide different strengths. Distinct profiles compares all 15 attributes rounded to two decimals, not only overall.

| Start | Year | Overall range | Mean attribute spread | Largest attribute spread | Distinct profiles |
| --- | ---: | ---: | ---: | --- | ---: |
| Youth | 2 | 63.0 | 0.1 | Cue Ball Control 1.0 | 3/3 |
| Youth | 5 | 73.0 | 1.1 | Shoulder Health 9.0 | 2/3 |
| Youth | 10 | 74.0 | 0.9 | Recovery Rate 10.0 | 3/3 |
| Youth | 15 | 74.0 | 0.5 | Recovery Rate 8.0 | 3/3 |
| Elite amateur | 2 | 79.0 | 1.0 | Shoulder Health 9.0 | 3/3 |
| Elite amateur | 5 | 82.0–83.0 | 1.1 | Recovery Rate 16.0 | 3/3 |
| Elite amateur | 10 | 83.0 | 0.5 | Recovery Rate 8.0 | 3/3 |
| Elite amateur | 15 | 83.0 | 0.4 | Recovery Rate 6.0 | 3/3 |
| Q Tour | 2 | 82.0 | 0.7 | Shoulder Health 6.0 | 2/3 |
| Q Tour | 5 | 84.0–85.0 | 1.2 | Recovery Rate 17.0 | 3/3 |
| Q Tour | 10 | 85.0 | 0.6 | Recovery Rate 9.0 | 3/3 |
| Q Tour | 15 | 85.0 | 0.5 | Recovery Rate 7.0 | 3/3 |
| Rookie professional | 2 | 81.0 | 0.5 | Shoulder Health 3.0 | 3/3 |
| Rookie professional | 5 | 83.0–84.0 | 2.0 | Shoulder Health 18.0 | 3/3 |
| Rookie professional | 10 | 84.0–85.0 | 0.9 | Recovery Rate 8.0 | 3/3 |
| Rookie professional | 15 | 84.0–85.0 | 0.9 | Recovery Rate 10.0 | 3/3 |

## Promotion and tour-card survival

Card awards/losses below use observed changes in the actual tour-card flag. Rookie professionals already start with a card; their initial place is not counted as a promotion. A renewal while the flag remains true is not counted as a fresh entry to the tour. Sources and observation dates are preserved in the JSON.

| Start | Seed | First earned card observed | Times gained | Times lost | Card after year 15 | Titles | Match W–L–D |
| --- | ---: | --- | ---: | ---: | --- | ---: | --- |
| Youth | 104729 | None observed | 0 | 0 | No | 0 | 98–218–0 |
| Youth | 130363 | None observed | 0 | 0 | No | 0 | 101–225–0 |
| Youth | 155921 | None observed | 0 | 0 | No | 0 | 96–236–0 |
| Elite amateur | 204732 | 2040-06-30 · age 31 · Q School | 1 | 0 | Yes | 0 | 128–200–0 |
| Elite amateur | 230366 | None observed | 0 | 0 | No | 1 | 139–202–0 |
| Elite amateur | 255924 | 2034-06-30 · age 25 · Q School | 1 | 1 | No | 0 | 152–188–3 |
| Q Tour | 304735 | None observed | 0 | 0 | No | 1 | 158–196–0 |
| Q Tour | 330369 | None observed | 0 | 0 | No | 2 | 159–190–0 |
| Q Tour | 355927 | None observed | 0 | 0 | No | 0 | 169–202–0 |
| Rookie professional | 404738 | 2029-06-30 · age 21 · Q School | 2 | 2 | Yes | 1 | 162–170–9 |
| Rookie professional | 430372 | Started professional; no re-entry | 0 | 1 | No | 2 | 116–165–8 |
| Rookie professional | 455930 | 2030-06-30 · age 22 · Q School | 2 | 3 | No | 1 | 161–161–10 |

### Annual evidence for pathway starts

Q School campaigns/match wins and Q Tour results show whether a lack of promotion reflects failure in attempted qualifiers or lack of exposure. These are the season counters from the harness; card-state transitions above are the primary evidence that the player actually reached the tour.

| Start | Seed | Year | Age | OVR | Matches | Q School campaigns | Q School match wins | Q Tour titles | Card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Youth | 104729 | 1 | 14 | 59 | 24 | 0 | 0 | 0 | No |
| Youth | 104729 | 2 | 15 | 63 | 21 | 0 | 0 | 0 | No |
| Youth | 104729 | 3 | 16 | 67 | 25 | 0 | 0 | 0 | No |
| Youth | 104729 | 4 | 17 | 71 | 27 | 0 | 0 | 0 | No |
| Youth | 104729 | 5 | 18 | 73 | 23 | 0 | 0 | 0 | No |
| Youth | 104729 | 6 | 19 | 73 | 27 | 0 | 0 | 0 | No |
| Youth | 104729 | 7 | 20 | 73 | 25 | 0 | 0 | 0 | No |
| Youth | 104729 | 8 | 21 | 73 | 25 | 0 | 0 | 0 | No |
| Youth | 104729 | 9 | 22 | 73 | 9 | 0 | 0 | 0 | No |
| Youth | 104729 | 10 | 23 | 74 | 18 | 1 | 2 | 0 | No |
| Youth | 104729 | 11 | 24 | 74 | 17 | 1 | 0 | 0 | No |
| Youth | 104729 | 12 | 25 | 74 | 19 | 1 | 1 | 0 | No |
| Youth | 104729 | 13 | 26 | 74 | 17 | 1 | 0 | 0 | No |
| Youth | 104729 | 14 | 27 | 74 | 18 | 1 | 0 | 0 | No |
| Youth | 104729 | 15 | 28 | 74 | 21 | 1 | 1 | 0 | No |
| Youth | 130363 | 1 | 14 | 59 | 22 | 0 | 0 | 0 | No |
| Youth | 130363 | 2 | 15 | 63 | 25 | 0 | 0 | 0 | No |
| Youth | 130363 | 3 | 16 | 67 | 27 | 0 | 0 | 0 | No |
| Youth | 130363 | 4 | 17 | 71 | 31 | 0 | 0 | 0 | No |
| Youth | 130363 | 5 | 18 | 73 | 25 | 0 | 0 | 0 | No |
| Youth | 130363 | 6 | 19 | 73 | 29 | 0 | 0 | 0 | No |
| Youth | 130363 | 7 | 20 | 73 | 23 | 0 | 0 | 0 | No |
| Youth | 130363 | 8 | 21 | 73 | 23 | 0 | 0 | 0 | No |
| Youth | 130363 | 9 | 22 | 74 | 16 | 1 | 2 | 0 | No |
| Youth | 130363 | 10 | 23 | 74 | 14 | 0 | 0 | 0 | No |
| Youth | 130363 | 11 | 24 | 74 | 16 | 1 | 1 | 0 | No |
| Youth | 130363 | 12 | 25 | 74 | 17 | 1 | 0 | 0 | No |
| Youth | 130363 | 13 | 26 | 74 | 20 | 1 | 2 | 0 | No |
| Youth | 130363 | 14 | 27 | 74 | 19 | 1 | 1 | 0 | No |
| Youth | 130363 | 15 | 28 | 74 | 19 | 1 | 2 | 0 | No |
| Youth | 155921 | 1 | 14 | 59 | 26 | 0 | 0 | 0 | No |
| Youth | 155921 | 2 | 15 | 63 | 24 | 0 | 0 | 0 | No |
| Youth | 155921 | 3 | 16 | 67 | 25 | 0 | 0 | 0 | No |
| Youth | 155921 | 4 | 17 | 71 | 29 | 0 | 0 | 0 | No |
| Youth | 155921 | 5 | 18 | 73 | 28 | 0 | 0 | 0 | No |
| Youth | 155921 | 6 | 19 | 74 | 26 | 0 | 0 | 0 | No |
| Youth | 155921 | 7 | 20 | 74 | 28 | 0 | 0 | 0 | No |
| Youth | 155921 | 8 | 21 | 74 | 25 | 0 | 0 | 0 | No |
| Youth | 155921 | 9 | 22 | 74 | 12 | 0 | 0 | 0 | No |
| Youth | 155921 | 10 | 23 | 74 | 14 | 1 | 0 | 0 | No |
| Youth | 155921 | 11 | 24 | 74 | 23 | 1 | 1 | 0 | No |
| Youth | 155921 | 12 | 25 | 74 | 21 | 1 | 1 | 0 | No |
| Youth | 155921 | 13 | 26 | 74 | 21 | 1 | 2 | 0 | No |
| Youth | 155921 | 14 | 27 | 74 | 13 | 1 | 0 | 0 | No |
| Youth | 155921 | 15 | 28 | 74 | 17 | 1 | 0 | 0 | No |
| Elite amateur | 204732 | 1 | 18 | 73 | 20 | 0 | 0 | 0 | No |
| Elite amateur | 204732 | 2 | 19 | 79 | 17 | 1 | 0 | 0 | No |
| Elite amateur | 204732 | 3 | 20 | 81 | 33 | 1 | 1 | 0 | No |
| Elite amateur | 204732 | 4 | 21 | 82 | 32 | 1 | 2 | 0 | No |
| Elite amateur | 204732 | 5 | 22 | 82 | 21 | 1 | 2 | 0 | No |
| Elite amateur | 204732 | 6 | 23 | 82 | 18 | 1 | 0 | 0 | No |
| Elite amateur | 204732 | 7 | 24 | 82 | 28 | 1 | 5 | 0 | No |
| Elite amateur | 204732 | 8 | 25 | 82 | 21 | 1 | 1 | 0 | No |
| Elite amateur | 204732 | 9 | 26 | 82 | 28 | 1 | 3 | 0 | No |
| Elite amateur | 204732 | 10 | 27 | 83 | 15 | 1 | 1 | 0 | No |
| Elite amateur | 204732 | 11 | 28 | 83 | 18 | 1 | 0 | 0 | No |
| Elite amateur | 204732 | 12 | 29 | 83 | 19 | 1 | 2 | 0 | No |
| Elite amateur | 204732 | 13 | 30 | 83 | 16 | 1 | 0 | 0 | No |
| Elite amateur | 204732 | 14 | 31 | 83 | 21 | 1 | 5 | 0 | Yes |
| Elite amateur | 204732 | 15 | 32 | 83 | 21 | 0 | 0 | 0 | Yes |
| Elite amateur | 230366 | 1 | 18 | 73 | 20 | 0 | 0 | 0 | No |
| Elite amateur | 230366 | 2 | 19 | 79 | 24 | 1 | 1 | 0 | No |
| Elite amateur | 230366 | 3 | 20 | 81 | 43 | 1 | 4 | 0 | No |
| Elite amateur | 230366 | 4 | 21 | 83 | 37 | 1 | 4 | 0 | No |
| Elite amateur | 230366 | 5 | 22 | 83 | 20 | 1 | 0 | 0 | No |
| Elite amateur | 230366 | 6 | 23 | 83 | 20 | 1 | 2 | 0 | No |
| Elite amateur | 230366 | 7 | 24 | 83 | 20 | 1 | 3 | 0 | No |
| Elite amateur | 230366 | 8 | 25 | 83 | 22 | 1 | 0 | 0 | No |
| Elite amateur | 230366 | 9 | 26 | 83 | 20 | 1 | 1 | 0 | No |
| Elite amateur | 230366 | 10 | 27 | 83 | 26 | 1 | 3 | 0 | No |
| Elite amateur | 230366 | 11 | 28 | 83 | 16 | 1 | 1 | 0 | No |
| Elite amateur | 230366 | 12 | 29 | 83 | 18 | 1 | 3 | 0 | No |
| Elite amateur | 230366 | 13 | 30 | 83 | 23 | 1 | 2 | 0 | No |
| Elite amateur | 230366 | 14 | 31 | 83 | 22 | 1 | 1 | 0 | No |
| Elite amateur | 230366 | 15 | 32 | 83 | 10 | 1 | 0 | 0 | No |
| Elite amateur | 255924 | 1 | 18 | 73 | 21 | 0 | 0 | 0 | No |
| Elite amateur | 255924 | 2 | 19 | 79 | 21 | 1 | 2 | 0 | No |
| Elite amateur | 255924 | 3 | 20 | 81 | 38 | 1 | 1 | 0 | No |
| Elite amateur | 255924 | 4 | 21 | 82 | 40 | 1 | 3 | 0 | No |
| Elite amateur | 255924 | 5 | 22 | 82 | 25 | 1 | 5 | 0 | No |
| Elite amateur | 255924 | 6 | 23 | 82 | 19 | 1 | 2 | 0 | No |
| Elite amateur | 255924 | 7 | 24 | 82 | 21 | 1 | 3 | 0 | No |
| Elite amateur | 255924 | 8 | 25 | 83 | 29 | 1 | 5 | 0 | Yes |
| Elite amateur | 255924 | 9 | 26 | 83 | 16 | 0 | 0 | 0 | Yes |
| Elite amateur | 255924 | 10 | 27 | 83 | 15 | 0 | 0 | 0 | No |
| Elite amateur | 255924 | 11 | 28 | 83 | 25 | 1 | 4 | 0 | No |
| Elite amateur | 255924 | 12 | 29 | 83 | 20 | 1 | 1 | 0 | No |
| Elite amateur | 255924 | 13 | 30 | 83 | 21 | 1 | 0 | 0 | No |
| Elite amateur | 255924 | 14 | 31 | 83 | 22 | 1 | 1 | 0 | No |
| Elite amateur | 255924 | 15 | 32 | 83 | 10 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 1 | 19 | 77 | 36 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 2 | 20 | 82 | 41 | 1 | 4 | 0 | No |
| Q Tour | 304735 | 3 | 21 | 84 | 32 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 4 | 22 | 84 | 22 | 1 | 3 | 0 | No |
| Q Tour | 304735 | 5 | 23 | 84 | 25 | 1 | 2 | 0 | No |
| Q Tour | 304735 | 6 | 24 | 84 | 21 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 7 | 25 | 84 | 24 | 1 | 2 | 0 | No |
| Q Tour | 304735 | 8 | 26 | 84 | 20 | 1 | 2 | 0 | No |
| Q Tour | 304735 | 9 | 27 | 84 | 18 | 1 | 4 | 0 | No |
| Q Tour | 304735 | 10 | 28 | 85 | 30 | 1 | 3 | 0 | No |
| Q Tour | 304735 | 11 | 29 | 85 | 28 | 1 | 2 | 0 | No |
| Q Tour | 304735 | 12 | 30 | 85 | 19 | 1 | 0 | 0 | No |
| Q Tour | 304735 | 13 | 31 | 85 | 16 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 14 | 32 | 85 | 10 | 1 | 1 | 0 | No |
| Q Tour | 304735 | 15 | 33 | 85 | 12 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 1 | 19 | 77 | 35 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 2 | 20 | 82 | 38 | 1 | 3 | 0 | No |
| Q Tour | 330369 | 3 | 21 | 84 | 43 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 4 | 22 | 85 | 21 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 5 | 23 | 85 | 19 | 1 | 0 | 0 | No |
| Q Tour | 330369 | 6 | 24 | 85 | 17 | 1 | 0 | 0 | No |
| Q Tour | 330369 | 7 | 25 | 85 | 20 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 8 | 26 | 85 | 20 | 1 | 4 | 0 | No |
| Q Tour | 330369 | 9 | 27 | 85 | 20 | 1 | 2 | 0 | No |
| Q Tour | 330369 | 10 | 28 | 85 | 20 | 1 | 2 | 0 | No |
| Q Tour | 330369 | 11 | 29 | 85 | 27 | 1 | 3 | 0 | No |
| Q Tour | 330369 | 12 | 30 | 85 | 26 | 1 | 0 | 0 | No |
| Q Tour | 330369 | 13 | 31 | 85 | 21 | 1 | 0 | 0 | No |
| Q Tour | 330369 | 14 | 32 | 85 | 12 | 1 | 1 | 0 | No |
| Q Tour | 330369 | 15 | 33 | 85 | 10 | 1 | 2 | 0 | No |
| Q Tour | 355927 | 1 | 19 | 77 | 34 | 1 | 4 | 0 | No |
| Q Tour | 355927 | 2 | 20 | 82 | 44 | 1 | 3 | 0 | No |
| Q Tour | 355927 | 3 | 21 | 84 | 45 | 1 | 0 | 0 | No |
| Q Tour | 355927 | 4 | 22 | 84 | 28 | 1 | 2 | 0 | No |
| Q Tour | 355927 | 5 | 23 | 85 | 27 | 1 | 3 | 0 | No |
| Q Tour | 355927 | 6 | 24 | 85 | 23 | 1 | 2 | 0 | No |
| Q Tour | 355927 | 7 | 25 | 85 | 24 | 1 | 2 | 0 | No |
| Q Tour | 355927 | 8 | 26 | 85 | 16 | 1 | 0 | 0 | No |
| Q Tour | 355927 | 9 | 27 | 85 | 25 | 1 | 1 | 0 | No |
| Q Tour | 355927 | 10 | 28 | 85 | 22 | 1 | 0 | 0 | No |
| Q Tour | 355927 | 11 | 29 | 85 | 23 | 1 | 4 | 0 | No |
| Q Tour | 355927 | 12 | 30 | 85 | 22 | 1 | 5 | 0 | No |
| Q Tour | 355927 | 13 | 31 | 85 | 19 | 1 | 2 | 0 | No |
| Q Tour | 355927 | 14 | 32 | 85 | 10 | 1 | 0 | 0 | No |
| Q Tour | 355927 | 15 | 33 | 85 | 9 | 1 | 0 | 0 | No |

## Matched rotating-training controls

Two additional careers use the same initial seed and management policy but rotate the existing Potting, Safety, Mental and Fitness presets in four-week blocks, using Recovery when fatigue reaches 65. All effects go through the normal Apply Plan action and tournament/session protections. No attributes or match outcomes are assigned directly. These are two examples, not a statistically powered comparison; changing decisions also changes subsequent simulated opponents and random outcomes.

| Control | Seed | Year-2 OVR | Year-5 OVR | Year-10 OVR | Year-15 OVR | First card | Card at end | W–L–D |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Youth rotating | 104729 | 62 | 73 | 74 | 74 | None | No | 102–226–0 |
| Q Tour rotating | 304735 | 82 | 84 | 84 | 84 | None | No | 166–191–0 |

To reproduce these controls, run the simulator directly with --seasons=15 --seed=104729 --starting-level-id=start-regional-youth --start-age=13 --rotate-training --skip-player-snapshots --skip-shared-audits, then repeat with seed 304735, start-q-tour and age 18. Their filenames end in -gameplay-rotating-entry-v2.json.

## Training behavior found in the code

The normal training action routinely applies gains to Long Potting, Cue Ball Control, Break Building, Focus and Stamina. Safety Play, Consistency, Composure and Recovery Rate receive the additional session-based gains only while the corresponding development project is active. The generic session-category calculation does not give each drill its own attribute progression. That means repeatedly choosing Safety sessions is not, by itself, equivalent to directly improving Safety Play.

This explains why an unchanged automated plan can max out a few attributes and then plateau while other skills remain near their starting values. A stronger coaching/equipment profile does not remove that mapping issue. This is a concrete training-system follow-up, not evidence that adding random growth alone would solve the problem. No training formulas were modified during this audit.

## Other automatic flags

These are preserved for review and do not make recovered debt a failure. The compact matrix pass/review label only reflects its existing checks; it is not an overall verdict that the game is balanced.

### Youth — seed 104729
- No automatic issue flags.

### Youth — seed 130363
- No automatic issue flags.

### Youth — seed 155921
- No automatic issue flags.

### Elite amateur — seed 204732
- No automatic issue flags.

### Elite amateur — seed 230366
- No automatic issue flags.

### Elite amateur — seed 255924
- No automatic issue flags.
- Balance warning: Pathway top-four ranking with losing/no-title season: 2035/36 rank 2 (3-11).

### Q Tour — seed 304735
- No automatic issue flags.

### Q Tour — seed 330369
- No automatic issue flags.

### Q Tour — seed 355927
- No automatic issue flags.

### Rookie professional — seed 404738
- No automatic issue flags.
- Balance warning: Pathway top-four ranking with losing/no-title season: 2030/31 rank 3 (8-10).

### Rookie professional — seed 430372
- No automatic issue flags.

### Rookie professional — seed 455930
- No automatic issue flags.

## Limits

- Three seeds per path do not estimate rare-event promotion chances precisely.
- All careers use the same creation template for their path and the same manager. Similar development is partly expected; the data does not establish how different human training choices compare.
- Fifteen seasons covers early and middle career, not retirement or every start type.
- Match results come from quick simulation, not live-shot decision testing.
- Debt recovery is available but takes calendar time and may require cancelling or avoiding optional costs. Club-work availability is not a guarantee that every possible negative cash flow can be sustained.
- Some older report ranking fields apply conservative history-based reporting floors. This report uses actual tour-card flags to establish promotion/survival, rather than treating those displayed rank estimates as proof.
