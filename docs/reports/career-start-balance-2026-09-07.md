# Career start balance comparison — 7 September 2026

**Method correction from the longer audit:** this earlier run used legacy test-only attribute pulses and preparation adjustments. Its development and promotion figures are not clean measurements of normal gameplay. The longer follow-up disables these adjustments. Brief negative cash is now recorded as a recoverable condition, not automatically classified as a failure.

Tested 12 new careers across four starting paths, three independent seeds each, through two season rollovers (111 simulated weeks per career; 24 career-seasons). All 12 completed. Nine had no automated issue flags; three recorded brief negative cash balances. This is an early-career balance sample, not a claim that the entire game is balanced.

## Method

Each start uses the path’s minimum age and £8,000 starting funds. The existing middle support manager chooses equipment, hires and releases coaches, accepts affordable sponsor offers, plans training, selects events and quick-simulates matches. It withdraws when it cannot service equipment or loses eligibility. Story decisions use conservative choices. No active user save was used.

The seeds differ between paths, so these are independent samples rather than paired comparisons against identical opponents. All figures below come from saved simulation reports, without altering match probabilities or development rules to force a pass.

```powershell
npm.cmd run simulate:balance-matrix -- --seasons=2 --seeds=104729,130363,155921 --concurrency=2 --paths=start-regional-youth,start-elite-amateur,start-q-tour,start-rookie-pro
```

The command deliberately exits with code 1 when a scenario needs review. In this run that means the cash flags below, not a crashed simulation. Full regenerated reports are written to `artifacts/simulations/`; the accompanying JSON here preserves the comparison and season-level outcomes.

## Progression and results

Overall and cash show start → first rollover → second rollover. W–L–D explicitly includes group-stage draws. Final world rank can remain in the two-year list after a player loses their card.

| Start (age) | Seed | W–L–D | Win % | Overall | Cash | Final position |
| --- | ---: | --- | ---: | --- | --- | --- |
| Elite Amateur Circuit (17) | 204732 | 20–20–0 | 50.0% | 68 → 75 → 80 | £8,000 → £1,450 → £7,273 | Amateur |
| Elite Amateur Circuit (17) | 230366 | 17–19–0 | 47.2% | 68 → 75 → 80 | £8,000 → £1,401 → £5,519 | Amateur |
| Elite Amateur Circuit (17) | 255924 | 22–21–0 | 51.2% | 68 → 75 → 80 | £8,000 → £1,351 → £7,764 | Amateur |
| Q Tour / Global Amateur Pathway (18) | 304735 | 12–13–0 | 48.0% | 72 → 78 → 83 | £8,000 → £10,243 → £19,173 | Amateur |
| Q Tour / Global Amateur Pathway (18) | 330369 | 13–14–0 | 48.1% | 72 → 78 → 82 | £8,000 → £11,373 → £19,501 | Amateur |
| Q Tour / Global Amateur Pathway (18) | 355927 | 9–15–0 | 37.5% | 72 → 78 → 83 | £8,000 → £10,294 → £17,524 | Amateur |
| Regional Youth Prospect (13) | 104729 | 21–38–0 | 35.6% | 54 → 59 → 65 | £8,000 → £1,292 → £1,250 | Youth |
| Regional Youth Prospect (13) | 130363 | 19–35–0 | 35.2% | 54 → 59 → 65 | £8,000 → £1,274 → £1,224 | Youth |
| Regional Youth Prospect (13) | 155921 | 19–37–0 | 33.9% | 54 → 59 → 65 | £8,000 → £1,318 → £1,301 | Youth |
| Rookie Pro / At Risk (18) | 404738 | 20–21–3 | 45.5% | 72 → 78 → 82 | £8,000 → £23,726 → £61,637 | Amateur · world #93 |
| Rookie Pro / At Risk (18) | 430372 | 12–22–2 | 33.3% | 72 → 78 → 82 | £8,000 → £23,242 → £64,669 | Amateur · world #98 |
| Rookie Pro / At Risk (18) | 455930 | 20–21–3 | 45.5% | 72 → 78 → 82 | £8,000 → £15,136 → £85,864 | Established · world #47 |

No human player won a trophy or a new tour card in these twelve samples. One rookie professional retained a place by reaching the top 64; the other two finished outside it and returned to amateur status. This shows real survival pressure, but the short sample cannot establish whether Q Tour promotion rates are appropriate.

## Opponent difficulty

Strength is the simulation’s effective match-strength estimate, including context; it is not the displayed overall rating. Averages are weighted by the recorded matches in each tournament. Expected win rate is the match engine’s own estimate, not an external benchmark.

| Start | Seed | Player strength | Opponent strength | Expected win % | Actual win % | Difference (points) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Elite Amateur Circuit | 204732 | 72.2 | 71.6 | 50.4 | 50.0 | -0.4 |
| Elite Amateur Circuit | 230366 | 72.9 | 73.1 | 49.7 | 47.2 | -2.4 |
| Elite Amateur Circuit | 255924 | 69.4 | 69.2 | 50.0 | 51.2 | 1.2 |
| Q Tour / Global Amateur Pathway | 304735 | 73.3 | 73.7 | 49.4 | 48.0 | -1.4 |
| Q Tour / Global Amateur Pathway | 330369 | 69.8 | 75.2 | 44.8 | 48.1 | 3.4 |
| Q Tour / Global Amateur Pathway | 355927 | 75.9 | 79.8 | 45.8 | 37.5 | -8.3 |
| Regional Youth Prospect | 104729 | 45.5 | 63.1 | 34.0 | 35.6 | 1.5 |
| Regional Youth Prospect | 130363 | 46.0 | 61.2 | 36.1 | 35.2 | -0.9 |
| Regional Youth Prospect | 155921 | 45.3 | 61.5 | 35.5 | 33.9 | -1.5 |
| Rookie Pro / At Risk | 404738 | 79.1 | 89.6 | 36.1 | 45.5 | 9.3 |
| Rookie Pro / At Risk | 430372 | 82.3 | 87.8 | 40.7 | 33.3 | -7.4 |
| Rookie Pro / At Risk | 455930 | 83.2 | 89.3 | 40.8 | 45.5 | 4.6 |

Youth opponents averaged about 61–63 effective strength, compared with 69–73 for the amateur sample, 74–80 for Q Tour and 88–90 for rookie professional opponents. The difficulty ladder is visible. Results vary around the engine’s predictions, with the largest deviations in the smaller professional samples; none of the runs triggered the harness’s existing win-rate warnings.

## Costs and income across both seasons

The category figures are the harness’s cash-delta classifications. Coach and sponsor figures use weekly settlement estimates; travel covers recorded booking transactions. Concurrent hotel extensions, allowances, rollover adjustments and other residual movements may sit in Other net. Other net below is reconciled from actual opening/closing balances, so these columns sum to the cash change. This is a cash comparison, not a verified transaction-by-transaction accounting audit.

| Start | Seed | Prize | Sponsors | Coaches | Equipment | Entry fees | Travel bookings | Other net | Cash change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Elite Amateur Circuit | 204732 | £1,365 | £22,808 | £-20,011 | £-8,669 | £-3,210 | £-6,813 | £13,803 | £-727 |
| Elite Amateur Circuit | 230366 | £1,200 | £18,448 | £-17,472 | £-9,139 | £-3,225 | £-6,528 | £14,235 | £-2,481 |
| Elite Amateur Circuit | 255924 | £2,006 | £23,120 | £-20,004 | £-8,825 | £-3,335 | £-7,003 | £13,805 | £-236 |
| Q Tour / Global Amateur Pathway | 304735 | £259 | £47,409 | £-43,139 | £-8,302 | £-2,710 | £-3,477 | £21,133 | £11,173 |
| Q Tour / Global Amateur Pathway | 330369 | £1,100 | £47,139 | £-42,483 | £-8,302 | £-2,710 | £-3,878 | £20,634 | £11,501 |
| Q Tour / Global Amateur Pathway | 355927 | £0 | £44,292 | £-41,347 | £-8,302 | £-2,710 | £-3,579 | £21,171 | £9,524 |
| Regional Youth Prospect | 104729 | £269 | £6,135 | £-4,774 | £-10,683 | £-1,720 | £-4,856 | £8,880 | £-6,750 |
| Regional Youth Prospect | 130363 | £21 | £5,784 | £-7,084 | £-8,629 | £-520 | £-5,062 | £8,714 | £-6,776 |
| Regional Youth Prospect | 155921 | £135 | £6,160 | £-1,540 | £-14,543 | £-370 | £-4,735 | £8,194 | £-6,699 |
| Rookie Pro / At Risk | 404738 | £1,000 | £82,621 | £-39,236 | £-8,782 | £0 | £-12,551 | £30,585 | £53,637 |
| Rookie Pro / At Risk | 430372 | £1,000 | £84,991 | £-38,624 | £-8,782 | £0 | £-12,551 | £30,635 | £56,669 |
| Rookie Pro / At Risk | 455930 | £39,500 | £71,976 | £-40,520 | £-8,782 | £0 | £-12,847 | £28,537 | £77,864 |

## Findings requiring attention

1. **Youth money is tight under this manager.** All three finished with roughly £1,200–£1,300 from £8,000. Equipment spending ranged from £8,629 to £14,543 across two seasons; travel bookings added roughly £4,700–£5,100. The automated equipment policy repeatedly chooses from what is affordable and does not reserve all future travel costs. This limits how confidently the cash dips can be attributed to the game economy itself.
2. **Three careers briefly entered debt.** Youth seed 104729 reached approximately −£169; youth seed 130363 reached −£94; amateur seed 204732 reached −£21. Each finished positive. The current audit samples cash after advancement; it does not guarantee that every transient transaction balance was sampled.
3. **Adult finances depend strongly on commercial income.** Q Tour careers earned £44,292–£47,409 from sponsorship against £0–£1,100 in prizes. The two professionals who lost their cards still finished above £61,000. Sponsor expectations and renewal/drop behavior deserve a follow-up balance pass, especially after relegation.
4. **Development is consistent but very similar across seeds.** Youth overall rose 54 → 59 → 65 in every run; elite amateurs rose 68 → 75 → 80. Q Tour rose 72 → 78 → 82/83 and professionals 72 → 78 → 82. That demonstrates progression, but repeated training choices dominate this short sample; it does not demonstrate enough individual variation over a long career.
5. **Promotion needs a longer sample.** None of six amateur/Q Tour careers earned a card within two seasons. That alone is not enough evidence to increase qualification rates, given the sample size and manager’s event choices.
6. **Entries need to be distinguished from appearances.** The runner counts each successful entry action, including entries later withdrawn or repeated. Recorded tournament results are fewer, particularly for youth. The table below exposes the difference; entry actions must not be described as completed events.

| Start | Seed | Successful entry actions | Recorded event results | Matches |
| --- | ---: | ---: | ---: | ---: |
| Elite Amateur Circuit | 204732 | 28 | 18 | 40 |
| Elite Amateur Circuit | 230366 | 25 | 17 | 36 |
| Elite Amateur Circuit | 255924 | 30 | 19 | 43 |
| Q Tour / Global Amateur Pathway | 304735 | 13 | 12 | 25 |
| Q Tour / Global Amateur Pathway | 330369 | 13 | 12 | 27 |
| Q Tour / Global Amateur Pathway | 355927 | 13 | 12 | 24 |
| Regional Youth Prospect | 104729 | 42 | 18 | 59 |
| Regional Youth Prospect | 130363 | 26 | 18 | 54 |
| Regional Youth Prospect | 155921 | 27 | 18 | 56 |
| Rookie Pro / At Risk | 404738 | 22 | 22 | 44 |
| Rookie Pro / At Risk | 430372 | 22 | 22 | 36 |
| Rookie Pro / At Risk | 455930 | 23 | 23 | 44 |

## Audit corrections made during this work

- Human participation now requires a recorded match, live entry or competitive result. A CPU-completed calendar event or a published entry fee is not evidence that the player participated.
- Administrative Q School Order of Merit reviews are exempt from playable frame-format checks.
- Calendar stops within the same week no longer invent another weekly sponsor/coach settlement.
- Cash deducted during a match is no longer reported as negative prize money; recorded prize awards and concurrent costs are separated.
- The matrix accepts `--paths=` so this four-path comparison can be reproduced without running every career start.

These are test/reporting corrections. They do not rebalance the game. The final matrix was rerun with the same seeds after the participation and accounting corrections.

## Follow-up scope

The evidence supports a focused follow-up on youth spending reserves, sponsor income after weak results/relegation, and a longer promotion sample with conservative and ambitious management policies. This run did not assess late-career decline, retirement, long-term population stability, every tour format, or live-shot decision quality. Those require their own scenarios.
