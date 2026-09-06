# Career records and trophy cabinet

Open **Legacy Stats** in the sidebar. Career Records and Trophy Cabinet appear above the existing charts.

## Recorded statistics

- Career matches, wins, losses, draws and event prize earnings.
- Centuries (100+), highest break, 50+ breaks including centuries, and exact recorded 147 counts.
- Pot, long-pot and safety percentages, weighted by the number of frames in each completed match. These remain estimates produced by the match simulator, not measured per-ball shot percentages.
- Frames won/lost, frame win percentage, deciding-frame results, whitewash wins, and current/best winning streaks. A draw ends a winning streak. Single-frame events do not count as deciders or whitewashes.
- Fouls per match: played matches use the visit-engine foul count; quick simulation uses its simulated match figure.

## Persistence and existing saves

The optional versioned history.legacy ledger stores compact lifetime totals and trophy records. Completed matches update it exactly once through finalizeLiveMatch. It survives season changes, the 24-match detail limit, the 240-match/event archive limits, compressed saves, reloads, and exports/imports.

Old saves recover available match, event and season records without adding overlapping totals twice. Potting, safety, fifties, fouls and frame/streak records report their coverage. An old highest break does not establish how many maximums were made, so exact maximum counts start with matches that carry the new counter. An in-progress old match keeps unknown maximum coverage. Centuries and highest breaks also recover from event/season summaries. Discarded records cannot be reconstructed.

## Trophy cabinet

Each recorded title retains event name, category/circuit, season, date, final opponent/score when available, and event earnings. Filters separate categories; additional trophies load in batches. Q School cards, qualifying routes, playoffs and exhibitions are not title trophies. Earlier titles without surviving event records cannot be reconstructed. New trophy records remain even after the detailed tournament archive is trimmed.

## Validation

- 413 unit tests passed, including nine Legacy cases for migration, percentages, multiple maximums, lifetime retention, draw/decider rules, real simulation, duplicate finalization and title recording.
- Three isolated browser checks passed: empty state, populated cabinet/filtering/reload, and 390px layout without horizontal overflow.
- Production build and lint passed. Local player saves were not changed by test fixtures.

## Legacy rating correction

The score now equals its displayed breakdown: titles contribute up to 75 points (15 per professional World Championship, 5 per other main-tour title, 1 per other title capped at 10); match wins contribute up to 10 (one per ten wins); centuries up to 10 (one per 25); recorded 147s up to five. Reputation, cash, earnings, elapsed weeks and the previous saved score do not award points. Losing no longer increments legacy.

Labels require the corresponding trophy: World Champion requires the professional World Championship; Ranking Winner requires a recorded main-tour ranking title. Seniors/youth/amateur world titles do not confer the professional World Champion label. Scores are recalculated on save repair and after actions, and progression reads the same rating. The old event-table Legacy Impact was ranking credit divided by 12; it now shows the actual ranking credit under that name.

Regression fixture: RT, 38 matches, 23 wins, seven centuries, no titles, £240,000 earnings and an old saved score of 100 now scores 2/100. The visible breakdown sums to two, with Tour Professional as the label when holding a tour card.
