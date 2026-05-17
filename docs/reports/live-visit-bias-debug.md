# Live Visit Bias Debug

Generated: 2026-05-14T02:31:24.567Z

- 1000 synthetic matches were run per bias case.
- Career mode remains isolated from these tests; this report uses only `liveVisitCalibration`.
- `Snooker escapes` are not modelled as a separate event in the engine. The nearest explicit signal available here is `Snooker Hunt` success rate.

## Headline Findings

- Equal Youth mirror: player-start 49.0%, opponent-start 48.4%.
- Equal Amateur mirror: player-start 48.8%, opponent-start 47.9%.
- Equal Top 64 mirror: player-start 50.1%, opponent-start 50.8%.
- Equal World Champion mirror: player-start 52.3%, opponent-start 46.8%.
- Youth vs Amateur rank-based swap gap: original 27.7%, swapped 90.4%, perspective gap 18.1%.
- Youth vs Amateur mirrored-attributes swap gap: original 17.7%, swapped 85.2%, perspective gap 2.9%.

## Source Checks

- A. Player-first possession: Equal Youth start swing is -2.6% and Equal World Champion start swing is -0.9% when only the opening break is flipped.
- B. Profile asymmetry: Youth vs Amateur actual win rate is 27.7% with the current rank-based opponent model, versus 17.7% when both sides use mirrored attribute profiles.
- C. Tactical asymmetry: compare the constructed tactical plans and the average decision bonus lines below. Simulated mode is side-neutral; any persistent gap is coming from constructed profile or frame-state flow.
- D. Momentum asymmetry: frame-start and first-scoring-chance gaps show whether winner-keeps-table and frame-start sequencing are still compounding a side advantage.
- E. Error-rate asymmetry: compare pot/safety/break-build success plus unforced errors and fouls by side in the equal-profile mirror cases.
- F. Probability perspective bug: a healthy swap pair should sum close to 100%. The rank-based Youth/Amateur pair sums to 118.1%; the mirrored pair sums to 102.9%.

## Swap Test Matrix

| Pair | A as Player Win % | B as Player Win % | Sum | Inversion Valid | Warnings |
| --- | ---: | ---: | ---: | --- | --- |
| Youth vs Amateur | 27.7% | 90.4% | 118.1% | no | Swapped pair sum 118.1% is outside the 85%-115% inversion band. |
| Youth vs Top 64 | 0.0% | 100.0% | 100.0% | yes | none |
| Veteran Min Support vs World Champion | 0.0% | 100.0% | 100.0% | yes | none |
| Top 16 vs Top 4 | 32.2% | 89.6% | 121.8% | no | Swapped pair sum 121.8% is outside the 85%-115% inversion band. |

## Constructed Profile Audit

### Youth vs Amateur | current rank-based opponent profile

- Expected stronger side: opponent
- Actual stronger side after construction: opponent
- Warnings: none
- Player source kind: attributes
- Player source rank band: Youth
- Player overall: 57.27
- Player technical average: 59.19
- Player mental average: 54.22
- Player physical average: 58.44
- Player confidence: 55.94
- Player fatigue: 13.99
- Player pressure handling: 54.37
- Player composure: 53.10
- Player break building: 63.97
- Player safety: 52.99
- Player potting: 60.02
- Player long potting: 61.99
- Player tactical rating: 55.13
- Player consistency: 58.04
- Player error rate: 44.03
- Player equipment bonus: 0.00
- Player tactical plan: Attack
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 50.82
- Player visit profile values: LP 61.99, BB 63.97, CBC 58.98, SAF 52.99, CONS 58.04, FOC 54.97, COMP 53.10, BMN 55.01, HAND 59.07, STM 59.06
- Opponent source kind: rankBased
- Opponent source rank band: Amateur
- Opponent overall: 60.24
- Opponent technical average: 61.78
- Opponent mental average: 59.24
- Opponent physical average: 59.78
- Opponent confidence: 58.99
- Opponent fatigue: 14.98
- Opponent pressure handling: 59.24
- Opponent composure: 58.24
- Opponent break building: 63.78
- Opponent safety: 61.78
- Opponent potting: 60.78
- Opponent long potting: 61.78
- Opponent tactical rating: 60.24
- Opponent consistency: 59.78
- Opponent error rate: 40.76
- Opponent equipment bonus: 1.00
- Opponent tactical plan: Attack
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 54.64
- Opponent visit profile values: LP 61.78, BB 63.78, CBC 60.78, SAF 61.78, CONS 59.78, FOC 59.24, COMP 58.24, BMN 60.24, HAND 59.78, STM 60.78

### Amateur vs Youth | current rank-based opponent profile

- Expected stronger side: player
- Actual stronger side after construction: player
- Warnings: none
- Player source kind: attributes
- Player source rank band: Amateur
- Player overall: 62.80
- Player technical average: 66.23
- Player mental average: 60.59
- Player physical average: 61.57
- Player confidence: 58.89
- Player fatigue: 15.08
- Player pressure handling: 60.98
- Player composure: 60.97
- Player break building: 71.06
- Player safety: 61.00
- Player potting: 64.65
- Player long potting: 64.99
- Player tactical rating: 63.12
- Player consistency: 66.11
- Player error rate: 36.41
- Player equipment bonus: 1.00
- Player tactical plan: Attack
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 57.05
- Player visit profile values: LP 64.99, BB 71.06, CBC 67.99, SAF 61.00, CONS 66.11, FOC 61.92, COMP 60.97, BMN 60.04, HAND 60.96, STM 62.98
- Opponent source kind: rankBased
- Opponent source rank band: Youth
- Opponent overall: 55.00
- Opponent technical average: 55.66
- Opponent mental average: 53.15
- Opponent physical average: 56.00
- Opponent confidence: 55.94
- Opponent fatigue: 14.07
- Opponent pressure handling: 53.15
- Opponent composure: 52.15
- Opponent break building: 57.66
- Opponent safety: 55.66
- Opponent potting: 55.66
- Opponent long potting: 55.66
- Opponent tactical rating: 54.15
- Opponent consistency: 53.66
- Opponent error rate: 46.85
- Opponent equipment bonus: 0.00
- Opponent tactical plan: Attack
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 48.74
- Opponent visit profile values: LP 55.66, BB 57.66, CBC 54.66, SAF 55.66, CONS 53.66, FOC 53.15, COMP 52.15, BMN 54.15, HAND 56.00, STM 57.00

### Youth vs Top 64 | current rank-based opponent profile

- Expected stronger side: opponent
- Actual stronger side after construction: opponent
- Warnings: none
- Player source kind: attributes
- Player source rank band: Youth
- Player overall: 57.77
- Player technical average: 58.65
- Player mental average: 55.81
- Player physical average: 58.77
- Player confidence: 55.90
- Player fatigue: 13.93
- Player pressure handling: 56.33
- Player composure: 57.06
- Player break building: 54.02
- Player safety: 64.14
- Player potting: 58.68
- Player long potting: 55.08
- Player tactical rating: 59.92
- Player consistency: 59.00
- Player error rate: 42.14
- Player equipment bonus: 0.00
- Player tactical plan: Safety
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 51.15
- Player visit profile values: LP 55.08, BB 54.02, CBC 60.98, SAF 64.14, CONS 59.00, FOC 56.96, COMP 57.06, BMN 54.99, HAND 59.98, STM 57.94
- Opponent source kind: rankBased
- Opponent source rank band: Top 64
- Opponent overall: 74.00
- Opponent technical average: 77.56
- Opponent mental average: 74.56
- Opponent physical average: 70.00
- Opponent confidence: 66.91
- Opponent fatigue: 17.99
- Opponent pressure handling: 74.56
- Opponent composure: 73.56
- Opponent break building: 80.56
- Opponent safety: 77.56
- Opponent potting: 75.56
- Opponent long potting: 78.56
- Opponent tactical rating: 75.56
- Opponent consistency: 75.56
- Opponent error rate: 25.44
- Opponent equipment bonus: 4.00
- Opponent tactical plan: Balanced
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 70.11
- Opponent visit profile values: LP 78.56, BB 80.56, CBC 77.56, SAF 77.56, CONS 75.56, FOC 74.56, COMP 73.56, BMN 75.56, HAND 70.00, STM 71.00

### Top 64 vs Youth | current rank-based opponent profile

- Expected stronger side: player
- Actual stronger side after construction: player
- Warnings: Player received support/equipment bonus but opponent did not.
- Player source kind: attributes
- Player source rank band: Top 64
- Player overall: 76.67
- Player technical average: 81.59
- Player mental average: 76.58
- Player physical average: 71.79
- Player confidence: 66.98
- Player fatigue: 18.07
- Player pressure handling: 76.66
- Player composure: 76.93
- Player break building: 81.02
- Player safety: 81.94
- Player potting: 79.34
- Player long potting: 80.97
- Player tactical rating: 80.36
- Player consistency: 83.00
- Player error rate: 19.98
- Player equipment bonus: 4.00
- Player tactical plan: Balanced
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 72.59
- Player visit profile values: LP 80.97, BB 81.02, CBC 84.03, SAF 81.94, CONS 83.00, FOC 78.02, COMP 76.93, BMN 75.04, HAND 73.00, STM 71.01
- Opponent source kind: rankBased
- Opponent source rank band: Youth
- Opponent overall: 55.00
- Opponent technical average: 55.81
- Opponent mental average: 53.29
- Opponent physical average: 56.00
- Opponent confidence: 56.02
- Opponent fatigue: 14.02
- Opponent pressure handling: 53.29
- Opponent composure: 52.29
- Opponent break building: 57.81
- Opponent safety: 55.81
- Opponent potting: 55.81
- Opponent long potting: 55.81
- Opponent tactical rating: 54.29
- Opponent consistency: 53.81
- Opponent error rate: 46.71
- Opponent equipment bonus: 0.00
- Opponent tactical plan: Safety
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 48.86
- Opponent visit profile values: LP 55.81, BB 57.81, CBC 54.81, SAF 55.81, CONS 53.81, FOC 53.29, COMP 52.29, BMN 54.29, HAND 56.00, STM 57.00

### Veteran Min Support vs World Champion | current rank-based opponent profile

- Expected stronger side: opponent
- Actual stronger side after construction: opponent
- Warnings: none
- Player source kind: attributes
- Player source rank band: Veteran Min Support
- Player overall: 75.58
- Player technical average: 80.39
- Player mental average: 76.58
- Player physical average: 69.80
- Player confidence: 61.91
- Player fatigue: 23.91
- Player pressure handling: 76.32
- Player composure: 76.00
- Player break building: 80.96
- Player safety: 81.03
- Player potting: 76.93
- Player long potting: 80.94
- Player tactical rating: 79.37
- Player consistency: 81.12
- Player error rate: 21.38
- Player equipment bonus: 7.00
- Player tactical plan: Balanced
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 72.83
- Player visit profile values: LP 80.94, BB 80.96, CBC 82.97, SAF 81.03, CONS 81.12, FOC 76.96, COMP 76.00, BMN 75.96, HAND 66.95, STM 72.98
- Opponent source kind: rankBased
- Opponent source rank band: World Champion
- Opponent overall: 89.00
- Opponent technical average: 93.15
- Opponent mental average: 91.00
- Opponent physical average: 82.00
- Opponent confidence: 78.91
- Opponent fatigue: 13.96
- Opponent pressure handling: 91.00
- Opponent composure: 90.00
- Opponent break building: 96.15
- Opponent safety: 94.15
- Opponent potting: 90.15
- Opponent long potting: 95.15
- Opponent tactical rating: 92.15
- Opponent consistency: 91.15
- Opponent error rate: 9.00
- Opponent equipment bonus: 8.00
- Opponent tactical plan: Balanced
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 89.29
- Opponent visit profile values: LP 95.15, BB 96.15, CBC 94.15, SAF 94.15, CONS 91.15, FOC 91.00, COMP 90.00, BMN 92.00, HAND 82.00, STM 83.00

### World Champion vs Veteran Min Support | current rank-based opponent profile

- Expected stronger side: player
- Actual stronger side after construction: player
- Warnings: none
- Player source kind: attributes
- Player source rank band: World Champion
- Player overall: 90.39
- Player technical average: 94.59
- Player mental average: 94.01
- Player physical average: 82.56
- Player confidence: 78.96
- Player fatigue: 14.02
- Player pressure handling: 95.35
- Player composure: 96.03
- Player break building: 94.97
- Player safety: 95.00
- Player potting: 92.65
- Player long potting: 95.97
- Player tactical rating: 95.40
- Player consistency: 96.06
- Player error rate: 5.02
- Player equipment bonus: 8.00
- Player tactical plan: Balanced
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 90.82
- Player visit profile values: LP 95.97, BB 94.97, CBC 97.02, SAF 95.00, CONS 96.06, FOC 93.01, COMP 96.03, BMN 97.00, HAND 84.95, STM 81.99
- Opponent source kind: rankBased
- Opponent source rank band: Veteran Min Support
- Opponent overall: 73.15
- Opponent technical average: 78.15
- Opponent mental average: 75.15
- Opponent physical average: 66.97
- Opponent confidence: 61.82
- Opponent fatigue: 23.97
- Opponent pressure handling: 75.15
- Opponent composure: 74.15
- Opponent break building: 81.15
- Opponent safety: 79.15
- Opponent potting: 75.15
- Opponent long potting: 79.15
- Opponent tactical rating: 77.15
- Opponent consistency: 76.15
- Opponent error rate: 24.85
- Opponent equipment bonus: 7.00
- Opponent tactical plan: Balanced
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 71.04
- Opponent visit profile values: LP 79.15, BB 81.15, CBC 79.15, SAF 79.15, CONS 76.15, FOC 75.15, COMP 74.15, BMN 76.15, HAND 66.97, STM 67.97

### Top 16 vs Top 4 | current rank-based opponent profile

- Expected stronger side: opponent
- Actual stronger side after construction: opponent
- Warnings: none
- Player source kind: attributes
- Player source rank band: Top 16
- Player overall: 84.37
- Player technical average: 90.66
- Player mental average: 85.63
- Player physical average: 76.83
- Player confidence: 72.94
- Player fatigue: 15.97
- Player pressure handling: 85.70
- Player composure: 86.07
- Player break building: 90.07
- Player safety: 92.08
- Player potting: 87.36
- Player long potting: 90.00
- Player tactical rating: 89.95
- Player consistency: 92.00
- Player error rate: 10.95
- Player equipment bonus: 6.00
- Player tactical plan: Balanced
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 82.79
- Player visit profile values: LP 90.00, BB 90.07, CBC 94.09, SAF 92.08, CONS 92.00, FOC 87.03, COMP 86.07, BMN 84.05, HAND 77.98, STM 76.04
- Opponent source kind: rankBased
- Opponent source rank band: Top 4
- Opponent overall: 85.00
- Opponent technical average: 90.00
- Opponent mental average: 87.00
- Opponent physical average: 79.00
- Opponent confidence: 76.05
- Opponent fatigue: 14.99
- Opponent pressure handling: 87.00
- Opponent composure: 86.00
- Opponent break building: 93.00
- Opponent safety: 91.00
- Opponent potting: 87.00
- Opponent long potting: 91.00
- Opponent tactical rating: 89.00
- Opponent consistency: 88.00
- Opponent error rate: 13.00
- Opponent equipment bonus: 7.00
- Opponent tactical plan: Balanced
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 84.77
- Opponent visit profile values: LP 91.00, BB 93.00, CBC 91.00, SAF 91.00, CONS 88.00, FOC 87.00, COMP 86.00, BMN 88.00, HAND 79.00, STM 80.00

### Top 4 vs Top 16 | current rank-based opponent profile

- Expected stronger side: player
- Actual stronger side after construction: player
- Warnings: none
- Player source kind: attributes
- Player source rank band: Top 4
- Player overall: 87.05
- Player technical average: 91.58
- Player mental average: 90.01
- Player physical average: 79.57
- Player confidence: 76.04
- Player fatigue: 15.03
- Player pressure handling: 91.36
- Player composure: 91.96
- Player break building: 91.90
- Player safety: 92.00
- Player potting: 89.35
- Player long potting: 91.97
- Player tactical rating: 91.89
- Player consistency: 93.04
- Player error rate: 8.58
- Player equipment bonus: 7.00
- Player tactical plan: Balanced
- Player starts frame probability: 100.00
- Player initial momentum: 50.00
- Player constructed strength: 86.45
- Player visit profile values: LP 91.97, BB 91.90, CBC 94.02, SAF 92.00, CONS 93.04, FOC 89.08, COMP 91.96, BMN 93.07, HAND 81.98, STM 79.00
- Opponent source kind: rankBased
- Opponent source rank band: Top 16
- Opponent overall: 82.00
- Opponent technical average: 86.97
- Opponent mental average: 83.97
- Opponent physical average: 76.00
- Opponent confidence: 73.13
- Opponent fatigue: 15.99
- Opponent pressure handling: 83.97
- Opponent composure: 82.97
- Opponent break building: 89.97
- Opponent safety: 87.97
- Opponent potting: 83.97
- Opponent long potting: 87.97
- Opponent tactical rating: 85.97
- Opponent consistency: 84.97
- Opponent error rate: 16.03
- Opponent equipment bonus: 6.00
- Opponent tactical plan: Balanced
- Opponent starts frame probability: 0.00
- Opponent initial momentum: 50.00
- Opponent constructed strength: 80.70
- Opponent visit profile values: LP 87.97, BB 89.97, CBC 87.97, SAF 87.97, CONS 84.97, FOC 83.97, COMP 82.97, BMN 84.97, HAND 76.00, STM 77.00

## Equal Profile Matrix

| Mirror | Player Starts | Opponent Starts | Combined Average | Target 45-55 |
| --- | ---: | ---: | ---: | --- |
| Youth | 49.0% | 48.4% | 48.7% | yes |
| Amateur | 48.8% | 47.9% | 48.3% | yes |
| Top 64 | 50.1% | 50.8% | 50.5% | yes |
| World Champion | 52.3% | 46.8% | 49.6% | yes |

## Deterministic Seed Spot Checks

- Fixed seed used: 240514

| Pair | First Direction | Score | Winner | Second Direction | Score | Winner |
| --- | --- | --- | --- | --- | --- | --- |
| Youth vs Amateur | Youth vs Amateur | current rank-based opponent profile | 5-6 | Opponent | Amateur vs Youth | current rank-based opponent profile | 2-6 | Opponent |
| Youth vs Top 64 | Youth vs Top 64 | current rank-based opponent profile | 0-10 | Opponent | Top 64 vs Youth | current rank-based opponent profile | 10-0 | Player |
| Veteran Min Support vs World Champion | Veteran Min Support vs World Champion | current rank-based opponent profile | 3-10 | Opponent | World Champion vs Veteran Min Support | current rank-based opponent profile | 10-4 | Player |
| Top 16 vs Top 4 | Top 16 vs Top 4 | current rank-based opponent profile | 9-10 | Opponent | Top 4 vs Top 16 | current rank-based opponent profile | 7-10 | Opponent |

## Detailed Cases

### Equal Youth mirror | player starts

- Expected win rate: 50.0%
- Actual player-side win rate: 49.0%
- Drift: -1.0%
- Average visits per match: 183.9
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 8124
- Player first scoring chances: 7901
- Player frame win %: 49.6%
- Player pot success: 47.0% (43214/91974)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 46867
- Player fouls: 1901
- Player average scoring break: 12.64
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 47.07
- Player average confidence: 56.31
- Player average fatigue: 33.99
- Opponent frame starts: 7587
- Opponent first scoring chances: 7810
- Opponent frame win %: 50.4%
- Opponent pot success: 47.4% (43542/91861)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 46426
- Opponent fouls: 1898
- Opponent average scoring break: 12.60
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 47.25
- Opponent average confidence: 57.24
- Opponent average fatigue: 34.01

### Equal Youth mirror | opponent starts

- Expected win rate: 50.1%
- Actual player-side win rate: 48.4%
- Drift: -1.7%
- Average visits per match: 187.8
- Opponent profile mode: attributes
- Opening break: opponent
- Player frame starts: 7716
- Player first scoring chances: 7987
- Player frame win %: 49.5%
- Player pot success: 47.0% (43984/93610)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 47592
- Player fouls: 2042
- Player average scoring break: 12.51
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 47.13
- Player average confidence: 56.60
- Player average fatigue: 34.26
- Opponent frame starts: 8250
- Opponent first scoring chances: 7979
- Opponent frame win %: 50.5%
- Opponent pot success: 47.3% (44528/94189)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 47573
- Opponent fouls: 2098
- Opponent average scoring break: 12.58
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 47.06
- Opponent average confidence: 56.85
- Opponent average fatigue: 34.41

### Equal Amateur mirror | player starts

- Expected win rate: 50.0%
- Actual player-side win rate: 48.8%
- Drift: -1.2%
- Average visits per match: 169.2
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 8214
- Player first scoring chances: 8079
- Player frame win %: 49.9%
- Player pot success: 52.5% (44489/84721)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 38683
- Player fouls: 1558
- Player average scoring break: 13.18
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 52.64
- Player average confidence: 59.65
- Player average fatigue: 33.49
- Opponent frame starts: 7683
- Opponent first scoring chances: 7818
- Opponent frame win %: 50.1%
- Opponent pot success: 52.8% (44546/84391)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 38226
- Opponent fouls: 1628
- Opponent average scoring break: 13.22
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 52.60
- Opponent average confidence: 59.69
- Opponent average fatigue: 33.55

### Equal Amateur mirror | opponent starts

- Expected win rate: 49.9%
- Actual player-side win rate: 47.9%
- Drift: -2.0%
- Average visits per match: 169.6
- Opponent profile mode: attributes
- Opening break: opponent
- Player frame starts: 7636
- Player first scoring chances: 7726
- Player frame win %: 49.3%
- Player pot success: 52.3% (44214/84596)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 38810
- Player fouls: 1578
- Player average scoring break: 13.10
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 52.55
- Player average confidence: 59.30
- Player average fatigue: 33.50
- Opponent frame starts: 8171
- Opponent first scoring chances: 8081
- Opponent frame win %: 50.7%
- Opponent pot success: 52.6% (44705/84957)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 38657
- Opponent fouls: 1604
- Opponent average scoring break: 12.94
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 52.70
- Opponent average confidence: 60.13
- Opponent average fatigue: 33.60

### Equal Top 64 mirror | player starts

- Expected win rate: 50.0%
- Actual player-side win rate: 50.1%
- Drift: 0.1%
- Average visits per match: 131.2
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 8200
- Player first scoring chances: 8023
- Player frame win %: 50.0%
- Player pot success: 66.6% (43688/65604)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 21081
- Player fouls: 845
- Player average scoring break: 15.05
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 66.71
- Player average confidence: 67.12
- Player average fatigue: 32.50
- Opponent frame starts: 7687
- Opponent first scoring chances: 7864
- Opponent frame win %: 50.0%
- Opponent pot success: 66.9% (43802/65482)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 20844
- Opponent fouls: 848
- Opponent average scoring break: 15.16
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 66.82
- Opponent average confidence: 67.59
- Opponent average fatigue: 32.41

### Equal Top 64 mirror | opponent starts

- Expected win rate: 50.0%
- Actual player-side win rate: 50.8%
- Drift: 0.8%
- Average visits per match: 130.7
- Opponent profile mode: attributes
- Opening break: opponent
- Player frame starts: 7687
- Player first scoring chances: 7759
- Player frame win %: 50.0%
- Player pot success: 67.0% (43595/65032)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 20592
- Player fouls: 854
- Player average scoring break: 15.22
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 66.77
- Player average confidence: 67.21
- Player average fatigue: 32.53
- Opponent frame starts: 8222
- Opponent first scoring chances: 8150
- Opponent frame win %: 50.0%
- Opponent pot success: 66.5% (43624/65570)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 21078
- Opponent fouls: 880
- Opponent average scoring break: 15.37
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 66.81
- Opponent average confidence: 67.57
- Opponent average fatigue: 32.56

### Equal World Champion mirror | player starts

- Expected win rate: 50.0%
- Actual player-side win rate: 52.3%
- Drift: 2.3%
- Average visits per match: 105.8
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 8416
- Player first scoring chances: 8302
- Player frame win %: 50.7%
- Player pot success: 81.4% (43330/53202)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 9494
- Player fouls: 387
- Player average scoring break: 17.85
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 81.23
- Player average confidence: 78.89
- Player average fatigue: 26.33
- Opponent frame starts: 7876
- Opponent first scoring chances: 7990
- Opponent frame win %: 49.3%
- Opponent pot success: 81.5% (42778/52507)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 9354
- Opponent fouls: 383
- Opponent average scoring break: 17.44
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 81.21
- Opponent average confidence: 78.28
- Opponent average fatigue: 26.28

### Equal World Champion mirror | opponent starts

- Expected win rate: 50.0%
- Actual player-side win rate: 46.8%
- Drift: -3.2%
- Average visits per match: 103.1
- Opponent profile mode: attributes
- Opening break: opponent
- Player frame starts: 7749
- Player first scoring chances: 7813
- Player frame win %: 49.2%
- Player pot success: 81.2% (41488/51125)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 9236
- Player fouls: 410
- Player average scoring break: 17.75
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 81.32
- Player average confidence: 77.96
- Player average fatigue: 26.04
- Opponent frame starts: 8288
- Opponent first scoring chances: 8224
- Opponent frame win %: 50.8%
- Opponent pot success: 81.4% (42222/51883)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 9234
- Opponent fouls: 436
- Opponent average scoring break: 18.00
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 81.39
- Opponent average confidence: 79.18
- Opponent average fatigue: 26.06

### Youth vs Amateur | current rank-based opponent profile

- Expected win rate: 42.7%
- Actual player-side win rate: 27.7%
- Drift: -15.0%
- Average visits per match: 45.6
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 4723
- Player first scoring chances: 4101
- Player frame win %: 41.0%
- Player pot success: 45.5% (1187/2610)
- Player safety success: 0.0% (0/0)
- Player break-build success: 48.8% (9451/19378)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 10373
- Player fouls: 984
- Player average scoring break: 29.64
- Player average tactical edge: 0.00
- Player average decision bonus: 1.76
- Player average success chance: 47.63
- Player average confidence: 54.18
- Player average fatigue: 21.93
- Opponent frame starts: 4216
- Opponent first scoring chances: 4838
- Opponent frame win %: 59.0%
- Opponent pot success: 55.4% (1574/2842)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 58.2% (12040/20703)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 9246
- Opponent fouls: 687
- Opponent average scoring break: 30.56
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 1.76
- Opponent average success chance: 57.90
- Opponent average confidence: 61.84
- Opponent average fatigue: 22.94

### Amateur vs Youth | current rank-based opponent profile

- Expected win rate: 57.4%
- Actual player-side win rate: 90.4%
- Drift: 33.0%
- Average visits per match: 41.1
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 4487
- Player first scoring chances: 5212
- Player frame win %: 68.5%
- Player pot success: 59.1% (1379/2335)
- Player safety success: 0.0% (0/0)
- Player break-build success: 62.9% (12634/20092)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 7828
- Player fouls: 588
- Player average scoring break: 32.19
- Player average tactical edge: 0.00
- Player average decision bonus: 1.79
- Player average success chance: 62.56
- Player average confidence: 64.07
- Player average fatigue: 22.23
- Opponent frame starts: 3934
- Opponent first scoring chances: 3209
- Opponent frame win %: 31.5%
- Opponent pot success: 41.3% (850/2060)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 44.4% (7386/16646)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 9474
- Opponent fouls: 998
- Opponent average scoring break: 29.34
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 1.78
- Opponent average success chance: 44.08
- Opponent average confidence: 51.57
- Opponent average fatigue: 21.69

### Youth vs Amateur | mirrored attribute opponent profile

- Expected win rate: 42.6%
- Actual player-side win rate: 17.7%
- Drift: -24.9%
- Average visits per match: 42.4
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 4622
- Player first scoring chances: 3625
- Player frame win %: 35.9%
- Player pot success: 43.6% (968/2218)
- Player safety success: 0.0% (0/0)
- Player break-build success: 47.3% (8364/17701)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 9682
- Player fouls: 910
- Player average scoring break: 30.27
- Player average tactical edge: 0.00
- Player average decision bonus: 1.78
- Player average success chance: 47.56
- Player average confidence: 52.77
- Player average fatigue: 21.36
- Opponent frame starts: 4123
- Opponent first scoring chances: 5120
- Opponent frame win %: 64.1%
- Opponent pot success: 57.7% (1424/2470)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 62.4% (12468/19987)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 8019
- Opponent fouls: 550
- Opponent average scoring break: 31.85
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 1.78
- Opponent average success chance: 62.42
- Opponent average confidence: 63.33
- Opponent average fatigue: 22.18

### Amateur vs Youth | mirrored attribute opponent profile

- Expected win rate: 57.4%
- Actual player-side win rate: 85.2%
- Drift: 27.8%
- Average visits per match: 41.9
- Opponent profile mode: attributes
- Opening break: player
- Player frame starts: 4627
- Player first scoring chances: 5229
- Player frame win %: 65.1%
- Player pot success: 58.1% (1436/2473)
- Player safety success: 0.0% (0/0)
- Player break-build success: 62.6% (12584/20099)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 8013
- Player fouls: 541
- Player average scoring break: 32.14
- Player average tactical edge: 0.00
- Player average decision bonus: 1.78
- Player average success chance: 62.45
- Player average confidence: 63.34
- Player average fatigue: 22.19
- Opponent frame starts: 4058
- Opponent first scoring chances: 3456
- Opponent frame win %: 34.9%
- Opponent pot success: 44.2% (974/2202)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 47.8% (8180/17096)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 9265
- Opponent fouls: 882
- Opponent average scoring break: 30.30
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 1.77
- Opponent average success chance: 47.51
- Opponent average confidence: 52.36
- Opponent average fatigue: 21.32

### Youth vs Top 64 | current rank-based opponent profile

- Expected win rate: 24.7%
- Actual player-side win rate: 0.0%
- Drift: -24.7%
- Average visits per match: 63.1
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 5168
- Player first scoring chances: 940
- Player frame win %: 1.8%
- Player pot success: 36.9% (3475/9406)
- Player safety success: 33.0% (4775/14490)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 14704
- Player fouls: 943
- Player average scoring break: 13.18
- Player average tactical edge: 0.00
- Player average decision bonus: 1.09
- Player average success chance: 34.46
- Player average confidence: 38.47
- Player average fatigue: 19.93
- Opponent frame starts: 5020
- Opponent first scoring chances: 9248
- Opponent frame win %: 98.2%
- Opponent pot success: 81.3% (31851/39169)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 7035
- Opponent fouls: 283
- Opponent average scoring break: 17.11
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 80.97
- Opponent average confidence: 86.74
- Opponent average fatigue: 26.34

### Top 64 vs Youth | current rank-based opponent profile

- Expected win rate: 75.3%
- Actual player-side win rate: 100.0%
- Drift: 24.7%
- Average visits per match: 58.5
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 5104
- Player first scoring chances: 9238
- Player frame win %: 98.9%
- Player pot success: 84.6% (31261/36956)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 5480
- Player fouls: 215
- Player average scoring break: 17.51
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 84.67
- Player average confidence: 87.43
- Player average fatigue: 25.98
- Opponent frame starts: 5004
- Opponent first scoring chances: 870
- Opponent frame win %: 1.1%
- Opponent pot success: 33.5% (2770/8275)
- Opponent safety success: 28.1% (3742/13319)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 14031
- Opponent fouls: 1051
- Opponent average scoring break: 13.17
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 1.14
- Opponent average success chance: 30.39
- Opponent average confidence: 37.00
- Opponent average fatigue: 19.76

### Top 16 vs Top 4 | current rank-based opponent profile

- Expected win rate: 45.7%
- Actual player-side win rate: 32.2%
- Drift: -13.5%
- Average visits per match: 111.3
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 8094
- Player first scoring chances: 7567
- Player frame win %: 43.7%
- Player pot success: 72.7% (39533/54412)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 14291
- Player fouls: 599
- Player average scoring break: 16.39
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 72.76
- Player average confidence: 69.38
- Player average fatigue: 28.56
- Opponent frame starts: 7623
- Opponent first scoring chances: 8150
- Opponent frame win %: 56.3%
- Opponent pot success: 78.3% (44494/56821)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 11844
- Opponent fouls: 491
- Opponent average scoring break: 16.71
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 78.28
- Opponent average confidence: 79.49
- Opponent average fatigue: 27.83

### Top 4 vs Top 16 | current rank-based opponent profile

- Expected win rate: 54.4%
- Actual player-side win rate: 89.6%
- Drift: 35.2%
- Average visits per match: 101.8
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 7726
- Player first scoring chances: 8544
- Player frame win %: 65.0%
- Player pot success: 81.8% (44180/54028)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 9472
- Player fouls: 380
- Player average scoring break: 17.38
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 81.60
- Player average confidence: 83.75
- Player average fatigue: 27.22
- Opponent frame starts: 7137
- Opponent first scoring chances: 6319
- Opponent frame win %: 35.0%
- Opponent pot success: 69.8% (33308/47752)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 13876
- Opponent fouls: 578
- Opponent average scoring break: 16.47
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 69.67
- Opponent average confidence: 64.46
- Opponent average fatigue: 27.45

### Veteran Min Support vs World Champion | current rank-based opponent profile

- Expected win rate: 28.8%
- Actual player-side win rate: 0.0%
- Drift: -28.8%
- Average visits per match: 70.2
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 5897
- Player first scoring chances: 3566
- Player frame win %: 11.9%
- Player pot success: 53.5% (15753/29421)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 13159
- Player fouls: 516
- Player average scoring break: 15.35
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 53.24
- Player average confidence: 42.03
- Player average fatigue: 31.04
- Opponent frame starts: 5456
- Opponent first scoring chances: 7787
- Opponent frame win %: 88.1%
- Opponent pot success: 91.5% (37299/40761)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 3308
- Opponent fouls: 155
- Opponent average scoring break: 18.35
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 91.61
- Opponent average confidence: 93.12
- Opponent average fatigue: 22.90

### World Champion vs Veteran Min Support | current rank-based opponent profile

- Expected win rate: 71.3%
- Actual player-side win rate: 100.0%
- Drift: 28.7%
- Average visits per match: 65.9
- Opponent profile mode: rankBased
- Opening break: player
- Player frame starts: 5772
- Player first scoring chances: 8005
- Player frame win %: 90.5%
- Player pot success: 92.1% (36073/39155)
- Player safety success: 0.0% (0/0)
- Player break-build success: 0.0% (0/0)
- Player snooker-hunt success: 0.0% (0/0)
- Player unforced errors: 2939
- Player fouls: 144
- Player average scoring break: 18.74
- Player average tactical edge: 0.00
- Player average decision bonus: 0.00
- Player average success chance: 91.98
- Player average confidence: 93.64
- Player average fatigue: 22.60
- Opponent frame starts: 5281
- Opponent first scoring chances: 3048
- Opponent frame win %: 9.5%
- Opponent pot success: 51.2% (13668/26709)
- Opponent safety success: 0.0% (0/0)
- Opponent break-build success: 0.0% (0/0)
- Opponent snooker-hunt success: 0.0% (0/0)
- Opponent unforced errors: 12510
- Opponent fouls: 534
- Opponent average scoring break: 15.09
- Opponent average tactical edge: 0.00
- Opponent average decision bonus: 0.00
- Opponent average success chance: 51.30
- Opponent average confidence: 40.49
- Opponent average fatigue: 30.58

## Symmetry Notes

- Equal Youth mirror stays near 50/50 only if the start-side swing is negligible. The measured swing here is -2.6%.
- Equal World Champion mirror checks whether the side effect persists even at elite profiles. The measured swing here is -0.9%.
- Youth/Amateur mirrored swap should invert cleanly if the probability perspective is correct. The current mirrored swap gap is 2.9% from perfect inversion.
