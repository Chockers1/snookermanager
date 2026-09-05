# Rolling ranking earnings

The live game uses an earnings ledger for the World and One-Year lists. Other pathways retain their own points systems.

- A complete event draw produces one finishing credit per competitor. CPU-only events are resolved in calendar order, including skipped events. The human is excluded from fields they did not enter.
- Credits become active at the scheduled event finish, not when the human exits. Cash, form and match history remain separate from ranking credit.
- Non-ranking invitationals contribute no world earnings. Seeded opening losses can still pay cash without counting credit; qualifying winners do not receive a second champion's purse.
- All listed competitors are sorted by active earnings, including nonparticipants. Equal totals use recent counting awards, then the previous order as a fallback.
- The one-year list filters credits to the current season. No annual percentage decay applies to main-tour ranking totals.
- Each award has an expiry date. An explicit tournament expiry takes precedence; otherwise the two-year anniversary is used, rebound to the corresponding future event finish when that calendar is available.
- Seed snapshots are stored at authored cut-offs; the current default is seven days before an event. Results completed on a cut-off day are included. An entered but unstarted draw is refreshed when its cut-off arrives; an ongoing match is never redrawn.
- UK/World qualifying fields protect the top 16, use staggered entry and feed their recorded qualifiers into the main field.

## Migration and storage

Schema 10 keeps existing careers, cash and titles. Missing pre-save monetary history cannot be reconstructed exactly. The old opening points are converted at £100 per point solely to preserve relative starting standings, visibly labelled **estimated opening carry-over**, and removed in 24 dated instalments. Recorded human current-season event prizes are recovered where available; they are deducted from the estimated opening balance to avoid duplication. Historical CPU events are not replayed on import.

New results use actual configured finishing prizes. Opening credits are not income and do not create trophies. The new one-year list cannot recover unrecorded CPU results from older saves.

Event keys prevent repeated awards. Expired credits and old CPU bracket detail are pruned, with lightweight event receipts retained. Local active/named saves use lossless LZ compression; old JSON saves remain readable and exported backups remain ordinary JSON.

## Fidelity boundary

This implements the earnings/expiry model described by the [WPBSA ranking FAQ](https://www.wpbsa.com/rankings/rankings-faq/), not a licensed mirror of the latest official calendar. Prize schedules still come from the game's tournament catalogue, and missing cut-offs/expiry schedules use the defaults above. Championship League group-stage simulation and other existing format approximations are not replaced by this change. The older standalone long-career balance script is not a substitute for testing this live calendar processor.

## Regression coverage

`rollingRankings.test.ts` covers defended money, nonparticipant movement, invitationals, deduplication, cut-offs, full CPU draws, stepped versus jumped dates, season filtering and migration. `saveStorage.test.ts` checks old/new save round-trips and browser-size budgets after a CPU calendar season. Browser coverage exercises Rankings and reload, alongside existing career, travel, match and season-review journeys.

Validation for this implementation: 130 unit tests passed; nine targeted Chromium journeys passed, including a complete multi-round tournament, mandatory season review, named save reload and the money-ranking screen. A complete CPU calendar season also passed the compressed-save budget test. The 30-year multi-seed balance matrix has not been rerun for this ranking model.
