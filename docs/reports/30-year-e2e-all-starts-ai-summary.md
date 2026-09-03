# 30-Year E2E All Starts + CPU/World Report

Generated: 2026-09-03
Deterministic seed: `20260903`

## Scope

- Ran all 12 supported starting points for 30 seasons each with middle coaching/equipment support.
- Used the same date, eligibility, travel, match, ranking, finance, progression, and season-rollover state functions as the UI.
- Audited human results plus CPU development, ranking movement, tour-card churn, intake, retirement, naming, and match volume.

## Headline

- 12/12 scenarios completed all 30 seasons: 360 seasons, 4,289 tournament entries, and 6,678 matches.
- Hard simulation issues: **0**.
- Balance/status warnings: **0** after using final-round modeled probability for final-conversion checks.
- Only **4 of 11** non-senior careers became World Champion and reached No. 1, down from 11 of 11.
- The four World-title breakthroughs arrived at ages **30, 35, 39, and 43**. No age-22 titles remain.
- The largest positive actual-versus-modeled win-rate gap is **+0.8 percentage points**, down from +8.3.
- Rankings move both ways: the 11 non-senior paths recorded **107 improving and 109 declining** season-to-season moves.
- The representative CPU audit recorded **148 explicit retired players**, **0 invalid lifecycle seasons**, and **0 active zero-match players** across all 30 seasons.
- Generated CPU names remain natural two-part names; no artificial single-letter suffixes were found.

## Scenario Outcomes

Expected win percentage is the match-weighted probability recorded before each match. Rank moves are seasons improved / declined / unchanged while the player held a world rank.

| Start | Events | Matches | Expected | Actual | Gap | Titles | World Titles (age) | Best | Final | Rank moves | Final status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |
| Age 12 Club Junior | 331 | 476 | 31.7% | 32.1% | +0.5 pp | 0 | 0 | 17 | 17 | 6 / 4 / 12 | Top 32 Professional |
| Age 13 Regional Youth | 348 | 513 | 35.3% | 35.5% | +0.2 pp | 3 | 0 | 2 | 17 | 9 / 9 / 6 | Top 32 Professional |
| Age 15 National Youth | 361 | 542 | 40.0% | 36.9% | -3.1 pp | 3 | 0 | 2 | 17 | 8 / 9 / 7 | Top 32 Professional |
| Age 17 Elite Amateur | 382 | 596 | 40.6% | 41.4% | +0.8 pp | 10 | 1 (43) | 1 | 17 | 10 / 10 / 7 | World Champion |
| Age 18 Bottom Tour | 381 | 604 | 42.6% | 41.9% | -0.7 pp | 3 | 0 | 2 | 17 | 10 / 12 / 6 | Top 32 Professional |
| Age 18 Q School | 376 | 591 | 41.0% | 41.1% | +0.1 pp | 8 | 0 | 2 | 2 | 10 / 10 / 5 | Major Contender |
| Age 18 Q Tour | 404 | 636 | 41.4% | 42.0% | +0.6 pp | 3 | 0 | 2 | 17 | 8 / 9 / 12 | Top 32 Professional |
| Age 18 Rookie Pro | 407 | 629 | 41.0% | 40.5% | -0.4 pp | 6 | 1 (30) | 1 | 17 | 14 / 13 / 2 | World Champion |
| Age 19 Top 64 | 363 | 559 | 43.6% | 39.5% | -4.0 pp | 6 | 0 | 2 | 5 | 11 / 12 / 5 | Major Contender |
| Age 20 Top 32 | 401 | 648 | 42.8% | 42.7% | -0.1 pp | 4 | 1 (35) | 1 | 2 | 10 / 8 / 10 | World Champion |
| Age 21 Top 16 | 423 | 696 | 44.7% | 44.8% | +0.1 pp | 10 | 1 (39) | 1 | 2 | 11 / 13 / 5 | World Champion |
| Age 50 Senior Masters | 112 | 188 | 46.8% | 42.0% | -4.7 pp | 3 | 0 | — | — | 0 / 0 / 0 | Retired |

## Fix Verification

1. **Career success:** World Champions/No. 1 players fell from 11/11 non-senior starts to 4/11. Seven paths never won the Worlds and cannot occupy No. 1.
2. **Probability calibration:** hidden result boosts and forced breakthrough conversions were removed. The worst positive gap is now +0.8 pp; the full range is -4.7 to +0.8 pp.
3. **Ranking movement:** rankings use stronger rolling expiry and current-form gates. Lifetime titles no longer permanently unlock elite ranks, and No. 1 now requires a World title in the current season.
4. **Rookie vs Bottom Tour:** the presets now differ in attributes, cash, weekly costs, card year/remaining protection, event totals, titles, peak rank, and final status.
5. **Early champions:** under-25 World rounds use stricter ceilings. The earliest title in this matrix is age 30.
6. **CPU retirement:** every world-player record has explicit `retired` and `retiredSeason` state. Retired players retain history but lose card/circuit membership; schema-v2 saves migrate to schema v3.
7. **CPU names:** expanded first/last-name pools and exhaustive pair selection replace appended letter suffixes.
8. **CPU match volume:** the audit only judges players who belonged to a circuit in the audited season, and active main-tour records missing a one-year row receive baseline activity. The representative 30-year audit has zero active zero-match players.

## Remaining Statistical Caveat

This deterministic matrix validates state integrity and catches systematic bias, but it is still one seed per start. A multi-seed Monte Carlo run is the appropriate next step before making finer tuning decisions about title frequency or the negative tail of win-rate variance.

## Evidence

- Per-start raw Markdown and JSON are generated locally under `artifacts/simulations/` and are intentionally excluded from source control.
- CPU lifecycle/progression: `docs/reports/ai-player-progression-audit.md`
- Ranking behavior: `docs/reports/ranking-points-realism-audit.md`
- Match accounting: `docs/reports/human-match-count-audit.md`
- Event volume: `docs/reports/player-event-volume-audit.md`
- Calendar validation: `docs/reports/tournament-calendar-audit.md`
- Status validation: `docs/reports/status-integrity-audit.md`
