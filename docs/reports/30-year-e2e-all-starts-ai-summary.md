# 30-Year E2E All Starts + CPU/World Report

Generated: 2026-06-04

## Scope

- Ran 12 starting points for 30 seasons each.
- Covered user careers from club junior through youth, amateur, Q Tour, Q School, rookie/bottom tour, top 64, top 32, top 16, and senior masters.
- Checked user lifecycle, promotion/relegation, tour-card fallback, senior-only restriction, CPU player churn, CPU overall/potential movement, world roster size, event volume, match counts, ranking/title/world outputs, and warning flags.
- Production build passed before the matrix run.

## Headline

- All 12 scenarios completed 30 seasons / 1,835 simulated weeks with 0 hard issues.
- No top-level balance warnings, status-integrity warnings, or tournament warning flags were triggered in the refreshed JSON reports.
- CPU/world simulation is active: 128 active main-tour card holders were maintained every season, CPU players gained/lost cards, new players entered, and CPU overall/potential changed year to year.
- Senior retirement now works: the senior start stayed senior-only until age 78, then entered 0 events in the final two seasons and finished age 80 as Retired.
- Main remaining calibration concern: several non-elite starts now underperform their expected win probability by roughly 4-9 percentage points, so the previous overpowered problem has swung conservative in some paths.

## Scenario Outcomes

| Start | Events | Events/Season | Matches | Expected Win % | Actual Win % | Avg Player Str | Avg Opp Str | Titles | Ranking Titles | Majors | World Wins | World Entries | Best World | Best Rank | Final Rank | Final Status | Warnings |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---|---:|
| Age 12 Club Junior | 278 | 9.3 | 353 | 25.3 | 21.2 | 64.8 | 91.4 | 0 | 0 | 0 | 0 | 0 | No main draw win | 33 | 33 | Tour Survivor / Top 64 | 0 |
| Age 13 Regional Youth | 299 | 10.0 | 418 | 28.3 | 28.5 | 69.7 | 92.8 | 0 | 0 | 0 | 0 | 0 | No main draw win | 33 | 33 | Tour Survivor / Top 64 | 0 |
| Age 15 National Youth | 369 | 12.3 | 517 | 35.9 | 31.5 | 73.6 | 93.1 | 1 | 1 | 0 | 0 | 13 | Quarter-final | 1 | 33 | Tour Survivor / Top 64 | 0 |
| Age 17 Elite Amateur | 331 | 11.0 | 445 | 35.8 | 27.2 | 78.3 | 95.5 | 0 | 0 | 0 | 0 | 7 | Quarter-final | 17 | 33 | Tour Survivor / Top 64 | 0 |
| Age 18 Q Tour | 375 | 12.5 | 546 | 38.9 | 34.8 | 77.0 | 95.5 | 4 | 2 | 2 | 0 | 15 | Final | 17 | 17 | Top 32 Professional | 0 |
| Age 18 Q School | 312 | 10.4 | 420 | 36.2 | 27.1 | 77.8 | 95.3 | 0 | 0 | 0 | 0 | 6 | Quarter-final | 17 | 65 | Bottom Tour / At Risk | 0 |
| Age 18 Rookie Pro | 367 | 12.2 | 515 | 39.2 | 32.4 | 76.9 | 95.6 | 0 | 0 | 0 | 0 | 16 | Quarter-final | 17 | 97 | Bottom Tour / At Risk | 0 |
| Age 18 Bottom Tour | 345 | 11.5 | 474 | 37.9 | 31.2 | 77.8 | 96.0 | 2 | 2 | 0 | 0 | 14 | Semi-final | 17 | 33 | Tour Survivor / Top 64 | 0 |
| Age 19 Top 64 | 319 | 10.6 | 457 | 39.8 | 34.4 | 78.3 | 96.0 | 3 | 1 | 1 | 0 | 14 | Quarter-final | 9 | 17 | Top 32 Professional | 0 |
| Age 20 Top 32 | 403 | 13.4 | 592 | 41.7 | 36.7 | 79.3 | 96.0 | 1 | 1 | 1 | 1 | 24 | Winner | 1 | 33 | World Champion | 0 |
| Age 21 Top 16 | 427 | 14.2 | 643 | 44.4 | 39.0 | 79.3 | 95.6 | 6 | 2 | 5 | 2 | 25 | Winner | 1 | 1 | World Champion | 0 |
| Age 50 Senior Masters | 112 | 3.7 | 188 | 40.9 | 40.4 | 68.5 | 78.4 | 0 | 0 | 0 | 0 | 0 | No main draw win | 999 | 999 | Retired | 0 |

## Milestones

| Start | First Tour Card | First Ranking Title | First World Title | First World Rank 1 |
|---|---|---|---|---|
| Age 12 Club Junior | 2032/33 age 19 | none | none | none |
| Age 13 Regional Youth | 2031/32 age 19 | none | none | none |
| Age 15 National Youth | 2033/34 age 23 | 2046/47 age 35 | none | 2047/48 age 37 |
| Age 17 Elite Amateur | 2029/30 age 21 | none | none | none |
| Age 18 Q Tour | 2026/27 age 19 | 2037/38 age 29 | none | none |
| Age 18 Q School | 2029/30 age 22 | none | none | none |
| Age 18 Rookie Pro | 2026/27 age 19 | none | none | none |
| Age 18 Bottom Tour | 2026/27 age 19 | 2038/39 age 30 | none | none |
| Age 19 Top 64 | 2026/27 age 20 | 2049/50 age 42 | none | none |
| Age 20 Top 32 | 2026/27 age 21 | 2039/40 age 33 | 2039/40 age 33 | 2039/40 age 34 |
| Age 21 Top 16 | 2026/27 age 22 | 2045/46 age 40 | 2045/46 age 40 | 2045/46 age 41 |
| Age 50 Senior Masters | none | none | none | none |

## CPU / World Health

- Active main-tour card holders: 128 every season.
- World roster size grew from 481 to 713 records over 30 seasons.
- New CPU players: 8 every season.
- Active CPU match average: 6.6 to 9.6 matches per season, average 9.0.
- Zero-match CPU players: 0 to 21 per season, average 4.6.
- CPU overall movers: 0 to 251 per season, average 133.7.
- CPU potential movers: 0 to 320 per season, average 90.7.
- Tour cards gained/lost: 1 to 65 each season, average 29.6 gained and 29.6 lost.
- CPU invalid career states: none.
- AI audit warnings: none.

## What Worked

- All lifecycle routes completed without hard failure: youth to amateur, Q Tour, Q School, pro card, tour survival, drop-off, and senior-only path.
- Q School/Q Tour fallback paths remain available after pro-card loss.
- Senior-only restriction held: senior start played no non-senior competitive events.
- Retirement held: senior start retired at age 78, entered 0 events in 2054/55 and 2055/56, and the status-integrity audit ended as Retired / valid.
- CPU players are not static: new players arrive, cards churn, rankings move, and overall/potential changes year to year.
- World Championship access works for top starts: top-32 and top-16 both reached and won worlds in this full matrix.
- Event volume is controlled for the human player: most starts landed around 9-13 entered events per season, senior at 4 per season.

## Issues / Watch Items

1. Several player paths are now slightly too conservative versus expected win probability.
   - Age 17 Elite Amateur: expected 35.8%, actual 27.2%.
   - Age 18 Q School: expected 36.2%, actual 27.1%.
   - Age 18 Rookie Pro: expected 39.2%, actual 32.4%.
   - Age 18 Bottom Tour: expected 37.9%, actual 31.2%.

2. Some starts reached deep World Championship runs but did not convert titles.
   - This is not a hard bug, but the Q School / rookie / elite-amateur starts look light on titles over 30 years.

3. Age 15 National Youth reached world rank 1 despite only 1 ranking title and no world title.
   - This suggests ranking-points inertia may still be generous for deep-run accumulation.

4. CPU zero-match pockets still exist.
   - Average is low at 4.6, but the maximum was 21 in one season. No warning fired, but this is worth tightening if every visible CPU needs season activity.

## Recommendations

1. Do a small calibration pass for mid-path starts, especially elite amateur, Q School, rookie pro, and bottom tour.
2. Review ranking-points accumulation for title-light players reaching rank 1.
3. Decide whether CPU zero-match pockets are acceptable background roster behavior or should be reduced further.
4. Keep the world-title age gate as-is for now: this matrix produced world titles at age 33 and 40, not unrealistic teenage world champions.

## Report Files

- `docs/reports/30-season-start-age-12-start-club-junior-middle-support-simulation.md`
- `docs/reports/30-season-start-age-13-start-regional-youth-middle-support-simulation.md`
- `docs/reports/30-season-start-age-15-start-national-youth-middle-support-simulation.md`
- `docs/reports/30-season-start-age-17-start-elite-amateur-middle-support-simulation.md`
- `docs/reports/30-season-start-age-18-start-q-tour-middle-support-simulation.md`
- `docs/reports/30-season-start-age-18-start-q-school-middle-support-simulation.md`
- `docs/reports/30-season-start-age-18-start-rookie-pro-middle-support-simulation.md`
- `docs/reports/30-season-start-age-18-start-bottom-tour-middle-support-simulation.md`
- `docs/reports/30-season-start-age-19-start-top-64-middle-support-simulation.md`
- `docs/reports/30-season-start-age-20-start-top-32-middle-support-simulation.md`
- `docs/reports/30-season-start-age-21-start-top-16-middle-support-simulation.md`
- `docs/reports/30-season-start-age-50-start-masters-middle-support-simulation.md`
- `docs/reports/ai-player-progression-audit.md`
- `docs/reports/status-integrity-audit.md`
- `docs/reports/player-event-volume-audit.md`
- `docs/reports/human-match-count-audit.md`
