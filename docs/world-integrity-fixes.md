# World simulation integrity repairs

The 50-year baseline is preserved in artifacts/simulations/50-year-world-audit-seed-20260906.zip. The new report is in artifacts/simulations/50-year-world-fixed-report.

## Behaviour

- The sporting season changes on 30 June, before the Championship League opens. The 30 June–23 July event is now owned by one season. UTC date shifting preserves dates in every timezone.
- CPU ability grows towards potential early in a career, settles in the thirties, then declines gradually from a saved individual starting age of 35, 36, 37, 38, 39 or 40. Each player also has a separate saved rate multiplier of 0.65–1.45. The initial annual CPU loss is about 0.36–0.80 points and increases gradually with years since onset. The same profile governs monthly skill ageing, assessment penalties and the human player’s seasonal attribute regression. Existing saves receive stable seeded profiles without retroactive attribute loss or cash changes. Victories cannot cancel veteran decline, and current ability affects CPU match outcomes alongside seeding and skill specialisation. There is no maximum age for winning a title.
- Actual qualification awards are guaranteed. Discretionary top-up cards last one season, so they do not crowd out the following season's qualifiers. Existing genuine protected contracts remain valid, including overfull legacy rosters; the normal 50-year test maintains exactly 128 cards throughout.
- Annual population maintenance supplies named, persistent, age- and region-eligible cohorts. Direct-seed withdrawals use named losing qualifiers as reserves. Early senior previews use eligible invitation players until qualification results fill the draw. Draw construction never creates anonymous Qualifier competitors.
- CPU season matches, wins, losses, draws, titles, major titles and prize earnings come from completed event brackets. New CPU break records use a separate deterministic simulation stream, preserving the outcome random stream. Highest break, centuries and recorded-match coverage are retained. These remain simulated break estimates, not a shot-by-shot model or reconstructed missing historical data.
- Ranking copies are deduplicated by player name, retaining the most complete row rather than adding duplicate totals. Import repairs provable historical match-count and major-title lower bounds without changing human cash or inventing lost events.
- Finances shows the recurring four-week cash projection and warns monthly when funds are low. Club work pays £120 after a reserved day, limited to one shift per seven days, replacing training and adding fatigue. It can be booked while in debt. Existing expenses are still payable; irresponsible spending can still produce debt.

## Validation and scope

Run npx tsx scripts/auditWorldRollover.ts --years=50 for the annual CPU world regression. It exercises the production CPU calendar, every event, age development, rankings and rollover. It deliberately skips human events and does not simulate 50 years of human weekly finances.

A separate two-season managed rookie run used the original seed and fixed support policy: 111 weekly settlements, 23 entries. It briefly reached −£27; this policy does not book the newly available club work. The budget warning, training reservation and delayed/idempotent £120 payment are covered by unit and browser tests. No live user save was used or altered.

The earlier world regression, before the individual 35–40 onset change, completed 50 seasons, all 5,200 events and 421,050 scored matches. Champion ages averaged 31.28 (range 21–41), compared with 42.32 in the baseline. These are different management scenarios, not a controlled prediction of real-world champion ages. All derived record, entrant, score, age, ranking and card checks passed.
