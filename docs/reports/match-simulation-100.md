# Match Simulation Report

Generated: 2026-05-14T00:01:20.580Z

This report is match-simulation only. It does not use calendar, career status, event access, or tournament progression logic.

## Method

- 100 deterministic synthetic match simulations were generated.
- Profiles are built from live-match attribute families: technical, mental, and physical groups.
- Overall rating comes from the shared overall-rating utility.
- Match strength comes from the shared pre-match strength formula.
- Baseline win chance uses the same match seeding curve shape as the live engine: `50 + (playerStrength - opponentStrength) * 1.18`, clamped to the normal match bounds.
- Each case simulates one full match after converting match win chance into frame win chance for the selected format.

## Matchup Summary

| Matchup | Cases | Avg Player Overall | Avg Opponent Overall | Avg Player Strength | Avg Opponent Strength | Avg Win Chance | Sim Wins |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Youth vs Youth | 10 | 58.4 | 58.3 | 51.3 | 51.2 | 50.1% | 2/10 |
| Youth vs Amateur | 10 | 58.1 | 63.8 | 51.2 | 56.8 | 43.4% | 4/10 |
| Youth vs Top 64 | 10 | 58.2 | 78.0 | 51.0 | 72.2 | 25.0% | 1/10 |
| Amateur vs Q Tour | 10 | 63.8 | 69.0 | 56.9 | 62.7 | 43.2% | 5/10 |
| Q Tour vs Rookie Pro | 10 | 69.4 | 73.5 | 63.0 | 67.2 | 45.0% | 6/10 |
| Rookie Pro vs Top 64 | 10 | 73.3 | 78.1 | 66.8 | 72.2 | 43.6% | 4/10 |
| Top 64 vs Top 32 | 10 | 78.3 | 81.5 | 72.2 | 76.7 | 44.7% | 5/10 |
| Top 32 vs Top 16 | 10 | 81.7 | 86.3 | 77.2 | 82.3 | 44.0% | 4/10 |
| Top 16 vs Top 4 | 10 | 86.5 | 89.3 | 82.2 | 87.0 | 44.3% | 6/10 |
| Veteran Min Support vs World Champion | 10 | 77.7 | 92.4 | 73.3 | 90.7 | 29.5% | 3/10 |

## Notable Upsets

- Case 25: Youth vs Top 64 | Youth Nerve (58) vs Top 64 Counter (77) | expected 25.2% | result 6-5
- Case 94: Veteran Min Support vs World Champion | Veteran Min Support Counter (78) vs World Champion Scorer (92) | expected 29.9% | result 10-8
- Case 97: Veteran Min Support vs World Champion | Veteran Min Support Scorer (78) vs World Champion Break Builder (93) | expected 28.8% | result 4-1
- Case 100: Veteran Min Support vs World Champion | Veteran Min Support Break Builder (78) vs World Champion Break Builder (93) | expected 31.1% | result 5-1

## Full 100 Simulations

| # | Matchup | Best Of | Player | Player Attrs | Opponent | Opponent Attrs | Player OVR | Opp OVR | Player STR | Opp STR | Match Win % | Frame Win % | Score | Winner |
| ---: | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1 | Youth vs Youth | 7 | Youth Scorer | LP 63, BB 63, SAF 53, COMP 52, STM 59 | Youth Counter | LP 56, BB 57, SAF 59, COMP 56, STM 60 | 59 | 58 | 51 | 52 | 48.8% | 49.5% | 4-3 | Player |
| 2 | Youth vs Youth | 9 | Youth Tactical | LP 54, BB 52, SAF 63, COMP 57, STM 58 | Youth Nerve | LP 59, BB 54, SAF 57, COMP 59, STM 61 | 58 | 58 | 51 | 52 | 48.8% | 49.5% | 5-1 | Player |
| 3 | Youth vs Youth | 11 | Youth Break Builder | LP 57, BB 64, SAF 58, COMP 54, STM 62 | Youth Stamina | LP 54, BB 58, SAF 56, COMP 57, STM 64 | 59 | 57 | 52 | 50 | 52.4% | 50.9% | 2-6 | Opponent |
| 4 | Youth vs Youth | 19 | Youth Counter | LP 61, BB 61, SAF 60, COMP 55, STM 60 | Youth Scorer | LP 65, BB 64, SAF 54, COMP 55, STM 57 | 59 | 59 | 53 | 51 | 52.4% | 50.7% | 9-10 | Opponent |
| 5 | Youth vs Youth | 11 | Youth Nerve | LP 56, BB 59, SAF 57, COMP 62, STM 57 | Youth Counter | LP 56, BB 61, SAF 60, COMP 58, STM 58 | 58 | 58 | 52 | 52 | 50.0% | 50.0% | 3-6 | Opponent |
| 6 | Youth vs Youth | 9 | Youth Stamina | LP 55, BB 54, SAF 55, COMP 55, STM 63 | Youth Tactical | LP 52, BB 57, SAF 63, COMP 60, STM 59 | 57 | 59 | 50 | 51 | 48.8% | 49.5% | 4-5 | Opponent |
| 7 | Youth vs Youth | 7 | Youth Scorer | LP 64, BB 65, SAF 50, COMP 54, STM 62 | Youth Break Builder | LP 57, BB 63, SAF 57, COMP 57, STM 59 | 58 | 58 | 50 | 51 | 48.8% | 49.5% | 3-4 | Opponent |
| 8 | Youth vs Youth | 19 | Youth Counter | LP 60, BB 57, SAF 62, COMP 53, STM 58 | Youth Scorer | LP 61, BB 66, SAF 54, COMP 55, STM 60 | 58 | 58 | 52 | 50 | 52.4% | 50.7% | 7-10 | Opponent |
| 9 | Youth vs Youth | 11 | Youth Tactical | LP 55, BB 54, SAF 65, COMP 57, STM 59 | Youth Tactical | LP 52, BB 54, SAF 65, COMP 60, STM 56 | 59 | 59 | 51 | 51 | 50.0% | 50.0% | 5-6 | Opponent |
| 10 | Youth vs Youth | 9 | Youth Break Builder | LP 58, BB 62, SAF 57, COMP 57, STM 61 | Youth Break Builder | LP 58, BB 67, SAF 56, COMP 54, STM 61 | 59 | 59 | 51 | 52 | 48.8% | 49.5% | 4-5 | Opponent |
| 11 | Youth vs Amateur | 7 | Youth Scorer | LP 59, BB 61, SAF 55, COMP 50, STM 57 | Amateur Counter | LP 62, BB 64, SAF 65, COMP 61, STM 59 | 58 | 64 | 51 | 58 | 41.7% | 46.2% | 4-2 | Player |
| 12 | Youth vs Amateur | 9 | Youth Tactical | LP 53, BB 56, SAF 67, COMP 59, STM 55 | Amateur Nerve | LP 62, BB 60, SAF 63, COMP 65, STM 62 | 59 | 62 | 51 | 56 | 44.1% | 47.6% | 3-5 | Opponent |
| 13 | Youth vs Amateur | 11 | Youth Break Builder | LP 56, BB 67, SAF 55, COMP 54, STM 62 | Amateur Stamina | LP 63, BB 62, SAF 61, COMP 60, STM 65 | 58 | 62 | 51 | 55 | 45.3% | 48.3% | 6-5 | Player |
| 14 | Youth vs Amateur | 19 | Youth Counter | LP 57, BB 58, SAF 58, COMP 54, STM 60 | Amateur Scorer | LP 70, BB 70, SAF 58, COMP 58, STM 63 | 58 | 64 | 51 | 56 | 44.1% | 48.3% | 4-10 | Opponent |
| 15 | Youth vs Amateur | 11 | Youth Nerve | LP 57, BB 59, SAF 55, COMP 58, STM 56 | Amateur Counter | LP 61, BB 62, SAF 64, COMP 64, STM 60 | 57 | 63 | 51 | 57 | 42.9% | 47.4% | 3-6 | Opponent |
| 16 | Youth vs Amateur | 9 | Youth Stamina | LP 56, BB 55, SAF 54, COMP 51, STM 66 | Amateur Tactical | LP 59, BB 62, SAF 71, COMP 62, STM 63 | 56 | 65 | 50 | 58 | 40.6% | 46.1% | 5-4 | Player |
| 17 | Youth vs Amateur | 7 | Youth Scorer | LP 60, BB 65, SAF 50, COMP 54, STM 60 | Amateur Break Builder | LP 65, BB 74, SAF 63, COMP 61, STM 64 | 58 | 65 | 51 | 57 | 42.9% | 46.7% | 4-0 | Player |
| 18 | Youth vs Amateur | 19 | Youth Counter | LP 57, BB 60, SAF 58, COMP 59, STM 59 | Amateur Scorer | LP 67, BB 70, SAF 57, COMP 60, STM 64 | 58 | 64 | 51 | 57 | 42.9% | 48.0% | 7-10 | Opponent |
| 19 | Youth vs Amateur | 11 | Youth Tactical | LP 54, BB 53, SAF 66, COMP 60, STM 59 | Amateur Tactical | LP 59, BB 60, SAF 71, COMP 65, STM 59 | 59 | 65 | 52 | 57 | 44.1% | 47.8% | 5-6 | Opponent |
| 20 | Youth vs Amateur | 9 | Youth Break Builder | LP 61, BB 66, SAF 58, COMP 54, STM 62 | Amateur Break Builder | LP 63, BB 69, SAF 62, COMP 61, STM 63 | 60 | 64 | 53 | 57 | 45.3% | 48.1% | 3-5 | Opponent |
| 21 | Youth vs Top 64 | 7 | Youth Scorer | LP 61, BB 65, SAF 56, COMP 53, STM 61 | Top 64 Counter | LP 78, BB 79, SAF 81, COMP 74, STM 70 | 59 | 77 | 51 | 72 | 25.2% | 38.0% | 0-4 | Opponent |
| 22 | Youth vs Top 64 | 9 | Youth Tactical | LP 54, BB 56, SAF 63, COMP 58, STM 60 | Top 64 Nerve | LP 76, BB 79, SAF 77, COMP 79, STM 73 | 59 | 76 | 52 | 72 | 26.4% | 39.9% | 1-5 | Opponent |
| 23 | Youth vs Top 64 | 11 | Youth Break Builder | LP 61, BB 65, SAF 56, COMP 54, STM 63 | Top 64 Stamina | LP 77, BB 77, SAF 80, COMP 76, STM 74 | 59 | 77 | 51 | 71 | 26.4% | 40.8% | 5-6 | Opponent |
| 24 | Youth vs Top 64 | 19 | Youth Counter | LP 56, BB 59, SAF 57, COMP 59, STM 57 | Top 64 Scorer | LP 84, BB 86, SAF 78, COMP 76, STM 73 | 58 | 78 | 52 | 72 | 26.4% | 42.9% | 7-10 | Opponent |
| 25 | Youth vs Top 64 | 11 | Youth Nerve | LP 59, BB 57, SAF 60, COMP 61, STM 59 | Top 64 Counter | LP 80, BB 78, SAF 80, COMP 77, STM 70 | 58 | 77 | 51 | 72 | 25.2% | 40.3% | 6-5 | Player |
| 26 | Youth vs Top 64 | 9 | Youth Stamina | LP 56, BB 55, SAF 54, COMP 53, STM 66 | Top 64 Tactical | LP 75, BB 76, SAF 88, COMP 81, STM 73 | 56 | 79 | 50 | 73 | 22.9% | 38.1% | 0-5 | Opponent |
| 27 | Youth vs Top 64 | 7 | Youth Scorer | LP 64, BB 65, SAF 53, COMP 52, STM 62 | Top 64 Break Builder | LP 80, BB 89, SAF 74, COMP 76, STM 70 | 58 | 79 | 50 | 73 | 22.9% | 36.7% | 3-4 | Opponent |
| 28 | Youth vs Top 64 | 19 | Youth Counter | LP 58, BB 58, SAF 59, COMP 53, STM 56 | Top 64 Scorer | LP 84, BB 85, SAF 78, COMP 76, STM 71 | 58 | 79 | 50 | 72 | 24.0% | 42.1% | 4-10 | Opponent |
| 29 | Youth vs Top 64 | 11 | Youth Tactical | LP 53, BB 51, SAF 61, COMP 58, STM 59 | Top 64 Tactical | LP 75, BB 79, SAF 84, COMP 81, STM 70 | 57 | 79 | 50 | 72 | 24.0% | 39.7% | 4-6 | Opponent |
| 30 | Youth vs Top 64 | 9 | Youth Break Builder | LP 61, BB 67, SAF 57, COMP 57, STM 62 | Top 64 Break Builder | LP 81, BB 87, SAF 74, COMP 76, STM 72 | 60 | 79 | 53 | 73 | 26.4% | 39.9% | 1-5 | Opponent |
| 31 | Amateur vs Q Tour | 7 | Amateur Scorer | LP 70, BB 72, SAF 60, COMP 60, STM 62 | Q Tour Counter | LP 67, BB 68, SAF 74, COMP 70, STM 64 | 65 | 69 | 57 | 62 | 44.1% | 47.3% | 4-1 | Player |
| 32 | Amateur vs Q Tour | 9 | Amateur Tactical | LP 61, BB 59, SAF 71, COMP 61, STM 62 | Q Tour Nerve | LP 70, BB 70, SAF 67, COMP 72, STM 64 | 63 | 68 | 56 | 63 | 41.7% | 46.6% | 4-5 | Opponent |
| 33 | Amateur vs Q Tour | 11 | Amateur Break Builder | LP 66, BB 71, SAF 62, COMP 61, STM 63 | Q Tour Stamina | LP 67, BB 66, SAF 70, COMP 66, STM 68 | 65 | 67 | 57 | 62 | 44.1% | 47.8% | 5-6 | Opponent |
| 34 | Amateur vs Q Tour | 19 | Amateur Counter | LP 61, BB 61, SAF 67, COMP 59, STM 58 | Q Tour Scorer | LP 75, BB 77, SAF 64, COMP 68, STM 65 | 63 | 69 | 56 | 63 | 41.7% | 47.6% | 10-5 | Player |
| 35 | Amateur vs Q Tour | 11 | Amateur Nerve | LP 65, BB 63, SAF 66, COMP 63, STM 63 | Q Tour Counter | LP 72, BB 67, SAF 71, COMP 66, STM 62 | 64 | 68 | 58 | 63 | 44.1% | 47.8% | 4-6 | Opponent |
| 36 | Amateur vs Q Tour | 9 | Amateur Stamina | LP 66, BB 63, SAF 62, COMP 63, STM 69 | Q Tour Tactical | LP 70, BB 69, SAF 73, COMP 68, STM 64 | 63 | 70 | 57 | 63 | 42.9% | 47.1% | 5-2 | Player |
| 37 | Amateur vs Q Tour | 7 | Amateur Scorer | LP 67, BB 71, SAF 58, COMP 57, STM 63 | Q Tour Break Builder | LP 69, BB 76, SAF 67, COMP 66, STM 65 | 64 | 70 | 58 | 63 | 44.1% | 47.3% | 4-2 | Player |
| 38 | Amateur vs Q Tour | 19 | Amateur Counter | LP 63, BB 62, SAF 66, COMP 63, STM 62 | Q Tour Scorer | LP 73, BB 76, SAF 66, COMP 66, STM 66 | 63 | 69 | 57 | 62 | 44.1% | 48.3% | 10-8 | Player |
| 39 | Amateur vs Q Tour | 11 | Amateur Tactical | LP 59, BB 59, SAF 71, COMP 62, STM 63 | Q Tour Tactical | LP 64, BB 68, SAF 75, COMP 70, STM 66 | 64 | 69 | 57 | 62 | 44.1% | 47.8% | 2-6 | Opponent |
| 40 | Amateur vs Q Tour | 9 | Amateur Break Builder | LP 63, BB 73, SAF 64, COMP 63, STM 62 | Q Tour Break Builder | LP 70, BB 78, SAF 67, COMP 67, STM 69 | 64 | 71 | 56 | 64 | 40.6% | 46.1% | 2-5 | Opponent |
| 41 | Q Tour vs Rookie Pro | 7 | Q Tour Scorer | LP 72, BB 74, SAF 64, COMP 64, STM 66 | Rookie Pro Counter | LP 72, BB 75, SAF 75, COMP 71, STM 68 | 69 | 73 | 62 | 66 | 45.3% | 47.8% | 4-2 | Player |
| 42 | Q Tour vs Rookie Pro | 9 | Q Tour Tactical | LP 66, BB 65, SAF 78, COMP 70, STM 63 | Rookie Pro Nerve | LP 73, BB 75, SAF 73, COMP 73, STM 67 | 69 | 73 | 62 | 68 | 42.9% | 47.1% | 3-5 | Opponent |
| 43 | Q Tour vs Rookie Pro | 11 | Q Tour Break Builder | LP 69, BB 78, SAF 69, COMP 68, STM 70 | Rookie Pro Stamina | LP 76, BB 72, SAF 71, COMP 70, STM 76 | 70 | 72 | 63 | 67 | 45.3% | 48.3% | 5-6 | Opponent |
| 44 | Q Tour vs Rookie Pro | 19 | Q Tour Counter | LP 70, BB 72, SAF 74, COMP 69, STM 64 | Rookie Pro Scorer | LP 76, BB 80, SAF 68, COMP 67, STM 71 | 69 | 72 | 63 | 65 | 47.6% | 49.3% | 10-5 | Player |
| 45 | Q Tour vs Rookie Pro | 11 | Q Tour Nerve | LP 66, BB 68, SAF 68, COMP 71, STM 64 | Rookie Pro Counter | LP 76, BB 74, SAF 75, COMP 73, STM 67 | 69 | 74 | 64 | 68 | 45.3% | 48.3% | 5-6 | Opponent |
| 46 | Q Tour vs Rookie Pro | 9 | Q Tour Stamina | LP 68, BB 69, SAF 69, COMP 68, STM 70 | Rookie Pro Tactical | LP 73, BB 73, SAF 78, COMP 75, STM 69 | 68 | 74 | 63 | 68 | 44.1% | 47.6% | 4-5 | Opponent |
| 47 | Q Tour vs Rookie Pro | 7 | Q Tour Scorer | LP 73, BB 77, SAF 66, COMP 67, STM 67 | Rookie Pro Break Builder | LP 74, BB 82, SAF 70, COMP 72, STM 69 | 70 | 74 | 63 | 68 | 44.1% | 47.3% | 4-2 | Player |
| 48 | Q Tour vs Rookie Pro | 19 | Q Tour Counter | LP 73, BB 72, SAF 75, COMP 66, STM 67 | Rookie Pro Scorer | LP 81, BB 80, SAF 73, COMP 72, STM 71 | 70 | 75 | 64 | 67 | 46.5% | 49.0% | 10-5 | Player |
| 49 | Q Tour vs Rookie Pro | 11 | Q Tour Tactical | LP 66, BB 64, SAF 78, COMP 68, STM 64 | Rookie Pro Tactical | LP 71, BB 69, SAF 78, COMP 74, STM 67 | 70 | 73 | 63 | 66 | 46.5% | 48.7% | 6-4 | Player |
| 50 | Q Tour vs Rookie Pro | 9 | Q Tour Break Builder | LP 71, BB 77, SAF 66, COMP 66, STM 68 | Rookie Pro Break Builder | LP 76, BB 83, SAF 70, COMP 73, STM 68 | 70 | 75 | 63 | 69 | 42.9% | 47.1% | 5-4 | Player |
| 51 | Rookie Pro vs Top 64 | 7 | Rookie Pro Scorer | LP 81, BB 80, SAF 72, COMP 69, STM 70 | Top 64 Counter | LP 81, BB 79, SAF 80, COMP 79, STM 71 | 73 | 78 | 67 | 72 | 44.1% | 47.3% | 3-4 | Opponent |
| 52 | Rookie Pro vs Top 64 | 9 | Rookie Pro Tactical | LP 71, BB 74, SAF 83, COMP 71, STM 67 | Top 64 Nerve | LP 80, BB 78, SAF 78, COMP 78, STM 70 | 74 | 78 | 68 | 72 | 45.3% | 48.1% | 5-4 | Player |
| 53 | Rookie Pro vs Top 64 | 11 | Rookie Pro Break Builder | LP 74, BB 82, SAF 72, COMP 72, STM 71 | Top 64 Stamina | LP 79, BB 80, SAF 81, COMP 72, STM 78 | 74 | 77 | 67 | 73 | 42.9% | 47.4% | 2-6 | Opponent |
| 54 | Rookie Pro vs Top 64 | 19 | Rookie Pro Counter | LP 74, BB 73, SAF 77, COMP 73, STM 70 | Top 64 Scorer | LP 86, BB 86, SAF 74, COMP 76, STM 70 | 72 | 79 | 66 | 72 | 42.9% | 48.0% | 9-10 | Opponent |
| 55 | Rookie Pro vs Top 64 | 11 | Rookie Pro Nerve | LP 73, BB 75, SAF 75, COMP 73, STM 70 | Top 64 Counter | LP 80, BB 78, SAF 81, COMP 76, STM 72 | 73 | 78 | 66 | 73 | 41.7% | 46.9% | 6-5 | Player |
| 56 | Rookie Pro vs Top 64 | 9 | Rookie Pro Stamina | LP 75, BB 76, SAF 73, COMP 72, STM 74 | Top 64 Tactical | LP 74, BB 77, SAF 87, COMP 75, STM 73 | 73 | 79 | 67 | 73 | 42.9% | 47.1% | 3-5 | Opponent |
| 57 | Rookie Pro vs Top 64 | 7 | Rookie Pro Scorer | LP 77, BB 83, SAF 70, COMP 67, STM 67 | Top 64 Break Builder | LP 83, BB 84, SAF 75, COMP 73, STM 72 | 73 | 78 | 66 | 72 | 42.9% | 46.7% | 2-4 | Opponent |
| 58 | Rookie Pro vs Top 64 | 19 | Rookie Pro Counter | LP 72, BB 77, SAF 77, COMP 73, STM 70 | Top 64 Scorer | LP 87, BB 89, SAF 78, COMP 74, STM 72 | 73 | 78 | 67 | 72 | 44.1% | 48.3% | 10-6 | Player |
| 59 | Rookie Pro vs Top 64 | 11 | Rookie Pro Tactical | LP 74, BB 71, SAF 79, COMP 70, STM 68 | Top 64 Tactical | LP 74, BB 74, SAF 84, COMP 78, STM 69 | 73 | 77 | 66 | 71 | 44.1% | 47.8% | 2-6 | Opponent |
| 60 | Rookie Pro vs Top 64 | 9 | Rookie Pro Break Builder | LP 77, BB 85, SAF 74, COMP 69, STM 68 | Top 64 Break Builder | LP 81, BB 86, SAF 78, COMP 78, STM 73 | 75 | 79 | 68 | 72 | 45.3% | 48.1% | 5-4 | Player |
| 61 | Top 64 vs Top 32 | 7 | Top 64 Scorer | LP 82, BB 88, SAF 74, COMP 73, STM 70 | Top 32 Counter | LP 84, BB 87, SAF 84, COMP 82, STM 75 | 78 | 82 | 72 | 76 | 45.3% | 47.8% | 0-4 | Opponent |
| 62 | Top 64 vs Top 32 | 9 | Top 64 Tactical | LP 75, BB 75, SAF 86, COMP 77, STM 70 | Top 32 Nerve | LP 81, BB 85, SAF 81, COMP 83, STM 73 | 79 | 81 | 71 | 77 | 42.9% | 47.1% | 3-5 | Opponent |
| 63 | Top 64 vs Top 32 | 11 | Top 64 Break Builder | LP 80, BB 88, SAF 77, COMP 74, STM 76 | Top 32 Stamina | LP 82, BB 82, SAF 83, COMP 81, STM 81 | 79 | 80 | 73 | 77 | 45.3% | 48.3% | 5-6 | Opponent |
| 64 | Top 64 vs Top 32 | 19 | Top 64 Counter | LP 79, BB 80, SAF 84, COMP 79, STM 72 | Top 32 Scorer | LP 86, BB 91, SAF 80, COMP 78, STM 76 | 78 | 81 | 73 | 76 | 46.5% | 49.0% | 5-10 | Opponent |
| 65 | Top 64 vs Top 32 | 11 | Top 64 Nerve | LP 82, BB 80, SAF 80, COMP 81, STM 72 | Top 32 Counter | LP 86, BB 84, SAF 85, COMP 80, STM 73 | 79 | 81 | 73 | 78 | 44.1% | 47.8% | 6-2 | Player |
| 66 | Top 64 vs Top 32 | 9 | Top 64 Stamina | LP 80, BB 81, SAF 78, COMP 76, STM 80 | Top 32 Tactical | LP 81, BB 82, SAF 87, COMP 82, STM 73 | 78 | 82 | 72 | 76 | 45.3% | 48.1% | 5-3 | Player |
| 67 | Top 64 vs Top 32 | 7 | Top 64 Scorer | LP 84, BB 87, SAF 74, COMP 74, STM 72 | Top 32 Break Builder | LP 83, BB 94, SAF 79, COMP 79, STM 77 | 78 | 82 | 72 | 77 | 44.1% | 47.3% | 4-1 | Player |
| 68 | Top 64 vs Top 32 | 19 | Top 64 Counter | LP 80, BB 82, SAF 80, COMP 75, STM 69 | Top 32 Scorer | LP 86, BB 87, SAF 80, COMP 76, STM 74 | 77 | 81 | 72 | 75 | 46.5% | 49.0% | 10-8 | Player |
| 69 | Top 64 vs Top 32 | 11 | Top 64 Tactical | LP 76, BB 75, SAF 86, COMP 78, STM 71 | Top 32 Tactical | LP 83, BB 83, SAF 92, COMP 83, STM 71 | 78 | 83 | 72 | 78 | 42.9% | 47.4% | 1-6 | Opponent |
| 70 | Top 64 vs Top 32 | 9 | Top 64 Break Builder | LP 80, BB 85, SAF 79, COMP 77, STM 71 | Top 32 Break Builder | LP 87, BB 91, SAF 81, COMP 78, STM 78 | 79 | 82 | 72 | 77 | 44.1% | 47.6% | 5-4 | Player |
| 71 | Top 32 vs Top 16 | 7 | Top 32 Scorer | LP 86, BB 90, SAF 82, COMP 78, STM 74 | Top 16 Counter | LP 88, BB 88, SAF 91, COMP 87, STM 74 | 82 | 86 | 77 | 83 | 42.9% | 46.7% | 4-3 | Player |
| 72 | Top 32 vs Top 16 | 9 | Top 32 Tactical | LP 79, BB 78, SAF 93, COMP 80, STM 72 | Top 16 Nerve | LP 90, BB 90, SAF 89, COMP 89, STM 76 | 81 | 86 | 77 | 83 | 42.9% | 47.1% | 3-5 | Opponent |
| 73 | Top 32 vs Top 16 | 11 | Top 32 Break Builder | LP 88, BB 90, SAF 83, COMP 78, STM 78 | Top 16 Stamina | LP 88, BB 86, SAF 88, COMP 85, STM 83 | 83 | 85 | 78 | 81 | 46.5% | 48.7% | 5-6 | Opponent |
| 74 | Top 32 vs Top 16 | 19 | Top 32 Counter | LP 84, BB 82, SAF 85, COMP 83, STM 76 | Top 16 Scorer | LP 95, BB 93, SAF 82, COMP 86, STM 80 | 82 | 87 | 78 | 83 | 44.1% | 48.3% | 9-10 | Opponent |
| 75 | Top 32 vs Top 16 | 11 | Top 32 Nerve | LP 83, BB 84, SAF 81, COMP 82, STM 74 | Top 16 Counter | LP 92, BB 87, SAF 91, COMP 86, STM 79 | 80 | 86 | 76 | 83 | 41.7% | 46.9% | 6-1 | Player |
| 76 | Top 32 vs Top 16 | 9 | Top 32 Stamina | LP 83, BB 82, SAF 82, COMP 77, STM 79 | Top 16 Tactical | LP 85, BB 85, SAF 94, COMP 87, STM 74 | 80 | 86 | 76 | 82 | 42.9% | 47.1% | 5-1 | Player |
| 77 | Top 32 vs Top 16 | 7 | Top 32 Scorer | LP 89, BB 92, SAF 82, COMP 75, STM 74 | Top 16 Break Builder | LP 90, BB 98, SAF 85, COMP 86, STM 77 | 83 | 87 | 78 | 83 | 44.1% | 47.3% | 4-2 | Player |
| 78 | Top 32 vs Top 16 | 19 | Top 32 Counter | LP 82, BB 85, SAF 85, COMP 80, STM 73 | Top 16 Scorer | LP 93, BB 94, SAF 83, COMP 80, STM 75 | 81 | 86 | 77 | 81 | 45.3% | 48.7% | 3-10 | Opponent |
| 79 | Top 32 vs Top 16 | 11 | Top 32 Tactical | LP 83, BB 78, SAF 91, COMP 80, STM 71 | Top 16 Tactical | LP 87, BB 86, SAF 96, COMP 85, STM 78 | 82 | 87 | 77 | 82 | 44.1% | 47.8% | 5-6 | Opponent |
| 80 | Top 32 vs Top 16 | 9 | Top 32 Break Builder | LP 87, BB 88, SAF 81, COMP 82, STM 76 | Top 16 Break Builder | LP 90, BB 96, SAF 88, COMP 83, STM 79 | 83 | 87 | 78 | 82 | 45.3% | 48.1% | 3-5 | Opponent |
| 81 | Top 16 vs Top 4 | 7 | Top 16 Scorer | LP 93, BB 93, SAF 83, COMP 84, STM 77 | Top 4 Counter | LP 92, BB 93, SAF 91, COMP 88, STM 78 | 86 | 89 | 81 | 87 | 42.9% | 46.7% | 4-3 | Player |
| 82 | Top 16 vs Top 4 | 9 | Top 16 Tactical | LP 87, BB 86, SAF 94, COMP 85, STM 74 | Top 4 Nerve | LP 89, BB 89, SAF 94, COMP 91, STM 80 | 87 | 88 | 82 | 86 | 45.3% | 48.1% | 5-3 | Player |
| 83 | Top 16 vs Top 4 | 11 | Top 16 Break Builder | LP 93, BB 97, SAF 85, COMP 82, STM 78 | Top 4 Stamina | LP 92, BB 94, SAF 93, COMP 89, STM 86 | 87 | 88 | 82 | 86 | 45.3% | 48.3% | 4-6 | Opponent |
| 84 | Top 16 vs Top 4 | 19 | Top 16 Counter | LP 91, BB 87, SAF 92, COMP 85, STM 75 | Top 4 Scorer | LP 98, BB 97, SAF 88, COMP 83, STM 78 | 87 | 89 | 83 | 87 | 45.3% | 48.7% | 4-10 | Opponent |
| 85 | Top 16 vs Top 4 | 11 | Top 16 Nerve | LP 88, BB 89, SAF 88, COMP 91, STM 79 | Top 4 Counter | LP 92, BB 95, SAF 96, COMP 87, STM 79 | 86 | 90 | 83 | 88 | 44.1% | 47.8% | 4-6 | Opponent |
| 86 | Top 16 vs Top 4 | 9 | Top 16 Stamina | LP 91, BB 91, SAF 91, COMP 86, STM 81 | Top 4 Tactical | LP 91, BB 86, SAF 99, COMP 88, STM 77 | 86 | 90 | 83 | 88 | 44.1% | 47.6% | 5-3 | Player |
| 87 | Top 16 vs Top 4 | 7 | Top 16 Scorer | LP 92, BB 95, SAF 85, COMP 84, STM 74 | Top 4 Break Builder | LP 91, BB 99, SAF 90, COMP 91, STM 81 | 86 | 91 | 81 | 87 | 42.9% | 46.7% | 4-2 | Player |
| 88 | Top 16 vs Top 4 | 19 | Top 16 Counter | LP 89, BB 90, SAF 90, COMP 88, STM 74 | Top 4 Scorer | LP 96, BB 96, SAF 88, COMP 87, STM 79 | 86 | 89 | 82 | 86 | 45.3% | 48.7% | 9-10 | Opponent |
| 89 | Top 16 vs Top 4 | 11 | Top 16 Tactical | LP 89, BB 82, SAF 97, COMP 86, STM 74 | Top 4 Tactical | LP 90, BB 89, SAF 97, COMP 87, STM 78 | 87 | 89 | 82 | 87 | 44.1% | 47.8% | 6-4 | Player |
| 90 | Top 16 vs Top 4 | 9 | Top 16 Break Builder | LP 88, BB 97, SAF 86, COMP 83, STM 79 | Top 4 Break Builder | LP 96, BB 98, SAF 91, COMP 90, STM 80 | 87 | 90 | 83 | 88 | 44.1% | 47.6% | 5-3 | Player |
| 91 | Veteran Min Support vs World Champion | 7 | Veteran Min Support Scorer | LP 82, BB 85, SAF 76, COMP 72, STM 67 | World Champion Counter | LP 93, BB 94, SAF 98, COMP 91, STM 81 | 77 | 92 | 72 | 92 | 26.4% | 38.6% | 0-4 | Opponent |
| 92 | Veteran Min Support vs World Champion | 9 | Veteran Min Support Tactical | LP 77, BB 78, SAF 88, COMP 77, STM 68 | World Champion Nerve | LP 97, BB 94, SAF 95, COMP 98, STM 80 | 79 | 92 | 74 | 91 | 29.9% | 41.5% | 3-5 | Opponent |
| 93 | Veteran Min Support vs World Champion | 11 | Veteran Min Support Break Builder | LP 83, BB 87, SAF 80, COMP 75, STM 68 | World Champion Stamina | LP 94, BB 91, SAF 95, COMP 92, STM 86 | 79 | 91 | 74 | 90 | 31.1% | 42.8% | 3-6 | Opponent |
| 94 | Veteran Min Support vs World Champion | 19 | Veteran Min Support Counter | LP 84, BB 80, SAF 82, COMP 78, STM 66 | World Champion Scorer | LP 96, BB 99, SAF 89, COMP 87, STM 81 | 78 | 92 | 74 | 91 | 29.9% | 44.1% | 10-8 | Player |
| 95 | Veteran Min Support vs World Champion | 11 | Veteran Min Support Nerve | LP 80, BB 80, SAF 79, COMP 83, STM 64 | World Champion Counter | LP 96, BB 96, SAF 94, COMP 94, STM 80 | 77 | 92 | 72 | 91 | 27.6% | 41.3% | 3-6 | Opponent |
| 96 | Veteran Min Support vs World Champion | 9 | Veteran Min Support Stamina | LP 81, BB 83, SAF 79, COMP 75, STM 76 | World Champion Tactical | LP 94, BB 91, SAF 99, COMP 95, STM 80 | 76 | 93 | 72 | 90 | 28.8% | 41.0% | 4-5 | Opponent |
| 97 | Veteran Min Support vs World Champion | 7 | Veteran Min Support Scorer | LP 87, BB 87, SAF 75, COMP 75, STM 69 | World Champion Break Builder | LP 99, BB 99, SAF 95, COMP 94, STM 81 | 78 | 93 | 74 | 92 | 28.8% | 39.9% | 4-1 | Player |
| 98 | Veteran Min Support vs World Champion | 19 | Veteran Min Support Counter | LP 81, BB 79, SAF 85, COMP 77, STM 64 | World Champion Scorer | LP 99, BB 99, SAF 93, COMP 89, STM 85 | 77 | 93 | 73 | 90 | 29.9% | 44.1% | 4-10 | Opponent |
| 99 | Veteran Min Support vs World Champion | 11 | Veteran Min Support Tactical | LP 78, BB 77, SAF 86, COMP 77, STM 64 | World Champion Tactical | LP 91, BB 93, SAF 99, COMP 93, STM 82 | 78 | 93 | 74 | 90 | 31.1% | 42.8% | 4-6 | Opponent |
| 100 | Veteran Min Support vs World Champion | 9 | Veteran Min Support Break Builder | LP 81, BB 91, SAF 76, COMP 74, STM 70 | World Champion Break Builder | LP 93, BB 99, SAF 94, COMP 91, STM 82 | 78 | 93 | 74 | 90 | 31.1% | 42.1% | 5-1 | Player |
