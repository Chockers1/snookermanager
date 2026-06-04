# 20-Year Current Full Matrix Summary

Generated: 2026-06-03

Scope: 12 starting points across junior, youth, amateur, Q Tour, Q School, pro, elite pro, and senior starts after the latest real-life pathway, senior, card-retention, and rank-proof updates.

## Result

- Build: passed with `npm.cmd run build`.
- Simulation matrix: 12/12 starts completed 20 seasons with no hard issues.
- Balance warnings: 0 across all starts.
- Unsupported rank/card checks: 0 retained-card rows outside top 64, 0 elite-tier labels unsupported by adjusted rank, 0 titleless top-four/world-number-1 rows.
- Senior restriction: senior start played 80 senior events and 0 pro/pathway events; final senior rank was 2.
- AI ecosystem: latest AI audit kept 128 active main-tour players every season, generated 8 new AI players per season, recorded overall/potential movers each year, and reported no invalid AI career states.

## Matrix

| Start | Events | Matches | Win % | Avg win prob | Titles | Majors | Worlds | Final rank | Status | First card | Lost-card fallbacks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| Age 12 Club Junior | 206 | 269 | 23.4 | 24.9 | 0 | 0 | 0 | 81 | Bottom Tour / At Risk | 2036/37 Q Tour age 23 | 3 |
| Age 13 Regional Youth | 200 | 286 | 30.1 | 28.5 | 0 | 0 | 0 | 97 | Bottom Tour / At Risk | 2032/33 Q Tour age 20 | 4 |
| Age 15 National Youth | 203 | 283 | 28.3 | 32.9 | 0 | 0 | 0 | 65 | Bottom Tour / At Risk | 2031/32 Q Tour age 21 | 5 |
| Age 20 Elite Amateur | 198 | 263 | 24.7 | 32.0 | 0 | 0 | 0 | 77 | Bottom Tour / At Risk | 2027/28 Q Tour age 22 | 6 |
| Age 18 Q Tour | 198 | 278 | 28.8 | 33.5 | 0 | 0 | 0 | 97 | Bottom Tour / At Risk | 2026/27 Q Tour age 19 | 6 |
| Age 20 Q School | 199 | 283 | 30.0 | 35.6 | 0 | 0 | 0 | 79 | Bottom Tour / At Risk | 2030/31 Q Tour age 25 | 4 |
| Age 18 Rookie Pro | 204 | 302 | 32.8 | 34.5 | 1 | 0 | 0 | 65 | Bottom Tour / At Risk | 2028/29 Q Tour age 21 | 6 |
| Age 18 Bottom Tour | 204 | 295 | 30.5 | 34.4 | 0 | 0 | 0 | 65 | Bottom Tour / At Risk | 2028/29 Q Tour age 21 | 7 |
| Age 25 Top 64 | 205 | 315 | 34.3 | 35.4 | 0 | 0 | 0 | 77 | Bottom Tour / At Risk | 2027/28 Q Tour age 27 | 5 |
| Age 20 Top 32 | 218 | 336 | 35.4 | 39.2 | 2 | 0 | 0 | 78 | Bottom Tour / At Risk | 2027/28 Q Tour age 22 | 5 |
| Age 21 Top 16 | 246 | 411 | 41.1 | 41.9 | 6 | 2 | 0 | 65 | Bottom Tour / At Risk | 2029/30 Q School age 25 | 3 |
| Age 50 Senior Masters | 80 | 140 | 42.9 | 43.4 | 0 | 0 | 0 | 999 / senior 2 | Senior Tour / Legend Circuit | n/a | 0 |

## Notes

- Win percentage now tracks expected win probability closely enough for this audit. The previous large gaps, such as age-12 winning far above expected, did not recur.
- Elite starts are no longer excessively dominant over 20 years. The top-16 start won 6 total titles and 2 majors, with no world titles.
- World Championship wins are no longer arriving too early in these starts.
- Post-card-loss fallback is active: affected careers return into Q School/Q Tour/amateur pathway states rather than getting stranded.
- The stricter rank proof may now be conservative for long elite saves. A future calibration pass could selectively improve sustained title-winning elite careers, but only after preserving the new guardrails against titleless world-number-1 outcomes.
