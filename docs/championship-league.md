# Championship League ranking event

The ranking event now uses 32 groups of four, then eight groups of four, two groups of four and a best-of-five final. Each group contains six fixtures; the player plays three different opponents. Group matches stop at 3–0, 3–1 or 2–2, awarding three points for a win and one for a draw. Only the group winner advances. A loss does not end the event while fixtures remain.

Tournament Hub, the full draw and match review show saved group standings and fixtures. Stage and group selectors expose the entire competition. CPU fixtures in the same matchday settle with the player's fixture. Later groups are created from actual group winners. Tables use points, frame difference, head-to-head or a tied-player mini-table, then recorded breaks. If all stored sporting evidence remains equal, the saved draw order provides a stable game fallback. The game records the highest break from each player match, rather than claiming a complete break-by-break archive.

Group prizes accumulate into the final event award, paid when the player exits. A champion receives £33,000 across all stages. Ranking ledger awards use actual group places. Draws are stored as Drawn; they award no win, loss or title. All 253 fixtures are retained when a tournament finishes.

Unplayed legacy Championship League brackets upgrade automatically on save load; already played legacy results are retained. The invitational Championship League now has its separate rolling seven-player groups, group play-offs and Winners Group; see [the full tournament audit](reports/tournament-rules-audit.md). Career dates retain the existing event calendar model; the group table uses fixture order rather than invented real-world match times.

Format and prize reference: https://championshipleaguesnooker.co.uk/ranking/championship-league-snooker-2026/

Validation: src/game/championshipLeague.test.ts and e2e/championship-league.spec.ts cover group scheduling, draws, qualification/elimination, complete title campaigns, awards, reloads, mobile tables and legacy unplayed draws.
