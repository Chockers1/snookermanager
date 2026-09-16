# Steam screenshot plan — final ten shots

Offline v0.1.9 plan. Nothing captured for the store or uploaded. First four establish match experience, career, tournament structure and development.

All shots: **1920 × 1080 PNG game content**, native rendering, standard text size, dark theme. Higher native 16:9 resolution is acceptable if the text remains readable; do not upscale a small capture. Keep the normal side navigation visible. No modal, first-week popup, operating-system chrome, development tools, cursor tooltip, error, placeholder/empty dataset, loading indicator or unrelated private information. Do not remove genuine gameplay caveats with image editing. Select a better real state instead. Do not add headlines, review scores, prices or promotional overlays to screenshots; themes below are internal notes only. A normal in-game pending award notice may remain when understandable, but prefer settled results for clarity.

## Prepare an isolated copy

Export a real career through Save Manager → Import & export. With the Windows package built, run:

```powershell
npm run capture:prepare -- --save "C:\Captures\career.json" --screen dashboard
```

The development CLI opens the packaged game in a new temporary profile, imports through its normal UI and selects a whitelisted route. It does not advance the career, manufacture results, hide gameplay information or produce images. The source export is hashed before/after. Autosaves and any manual play affect only this disposable copy. Re-running from the same export restores the same starting state. Close normally when finished. The printed profile path is retained, not automatically deleted. The command and its dependencies are excluded from the packaged application.

`--check` performs a non-capture import/navigation check and closes normally. `--screen match` requires an already active match in the export. Subtabs must be selected manually using the navigation below. No debug controls are added to the game. Never use hand-populated test victories for marketing. If a route shows missing information, earn it through ordinary play in the copy or choose another real export.

The real 25-season audit export currently awaits season review. The helper reports `requestedScreenReady: false` and preserves that real gate. Start the next season manually in the copy before navigating elsewhere, or use a mid-season export. An import check passing does not mean this export is immediately ready for every screenshot. Do not rebuild the Windows package while a capture window is open.

## Screenshot 1 — Match Centre · live match

- **Filename:** `steam-01-match.png`
- **Route / helper:** `/match/live` / `--screen match`
- **Navigate:** Tournament Hub → Play Next Match → Start Match, or import a career already mid-match.
- **Recommended state:** An actual singles match in progress, several frames played, visible visits and a competitive score. Pause Auto Play for a still; never fabricate a century or score.
- **Visible:** Both named players, match/frame scores, break, frame log and tactical controls.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Paused mid-match tension.
- **Why included:** Immediately shows the snooker match experience and the kind of simulation being sold.

## Screenshot 2 — Dashboard

- **Filename:** `steam-02-career-dashboard.png`
- **Route / helper:** `/` / `--screen dashboard`
- **Navigate:** Left navigation → Dashboard.
- **Recommended state:** A genuine progressed mid-season career with recent results, an upcoming event and ranking history.
- **Visible:** Player identity, career stage, upcoming opponent/event, results, training and finances.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Your career, your decisions.
- **Why included:** Explains the main management loop and progression at a glance.

## Screenshot 3 — Tournament Hub · draw

- **Filename:** `steam-03-tournament-hub.png`
- **Route / helper:** `/tournaments/hub` / `--screen tournament`
- **Navigate:** Left navigation → Tournament Hub.
- **Recommended state:** An entered knockout tournament with some rounds actually completed and the player still involved.
- **Visible:** Named bracket, real scores, highlighted route, current round and next-match controls.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Find your route through the draw.
- **Why included:** Makes tournament structure and stakes understandable; avoid an entirely TBD bracket.

## Screenshot 4 — Training · weekly planner

- **Filename:** `steam-04-training.png`
- **Route / helper:** `/training` / `--screen training`
- **Navigate:** Left navigation → Training.
- **Recommended state:** An existing scheduled week with a mix of real training and recovery sessions and an active project if already earned.
- **Visible:** Weekly sessions, focus, expected gains and fatigue/strain tradeoffs; compact project/base cards.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Prepare for the next step.
- **Why included:** Shows active decisions, development and recovery instead of only historical numbers.

## Screenshot 5 — Player Attributes · Grouped

- **Filename:** `steam-05-player-development.png`
- **Route / helper:** `/player/attributes` / `--screen attributes`
- **Navigate:** Attributes → Grouped → Since start (or 12 months if the recorded baseline is complete).
- **Recommended state:** A developed career with genuine saved attribute history; use a complete baseline where possible.
- **Visible:** Technical, mental and physical attributes, bounded decimal deltas and selected comparison period.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Watch your player develop.
- **Why included:** Shows that training leads to recorded changes, with no invented historical baseline.

## Screenshot 6 — Rankings · World Ranking

- **Filename:** `steam-06-rankings.png`
- **Route / helper:** `/rankings` / `--screen rankings`
- **Navigate:** Rankings → World Ranking; bring the human row into the visible table.
- **Recommended state:** A professional career after published ranking results; use an appropriate circuit for a pathway-focused alternative.
- **Visible:** Human position, nearby named opponents, ages, earnings or points with the correct label, ranking movement.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Measure your place on the tour.
- **Why included:** Connects individual results to the wider field and ranking competition.

## Screenshot 7 — Staff · My team

- **Filename:** `steam-07-coaching-team.png`
- **Route / helper:** `/staff/coaches` / `--screen staff`
- **Navigate:** Staff → My team.
- **Recommended state:** A career with two legitimately hired coaches in unlocked slots, real contracts and different specialisms.
- **Visible:** Coach identities, ratings, trained attributes, weekly costs and contract controls.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Build a team around your player.
- **Why included:** Demonstrates management depth and recurring financial commitments.

## Screenshot 8 — Sponsorship · Available Offers

- **Filename:** `steam-08-sponsors.png`
- **Route / helper:** `/sponsorship` / `--screen sponsors`
- **Navigate:** Sponsorship → Available Offers; select one existing offer.
- **Recommended state:** An established career with active deals and a genuine available offer; do not inject brands or terms.
- **Visible:** Three slot cards, actual contract status, offer payment, fit and expectations.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Balance income and expectations.
- **Why included:** Shows commercial choices and consequences beyond match results.

## Screenshot 9 — Finance · Overview

- **Filename:** `steam-09-finances.png`
- **Route / helper:** `/finance` / `--screen finance`
- **Navigate:** Finance → Overview.
- **Recommended state:** A career with actual prize income, travel/hotel and staff expenditure; choose a financially representative period.
- **Visible:** Balance, recurring cash flow, costs and transaction/overview chart labels.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** Fund the season.
- **Why included:** Shows meaningful budgeting without advertising a contrived huge bank balance.

## Screenshot 10 — Legacy Stats · Records

- **Filename:** `steam-10-career-history.png`
- **Route / helper:** `/career/stats` / `--screen legacy`
- **Navigate:** Legacy Stats → Records; use the season selector/history controls to load the chosen real season if needed.
- **Recommended state:** A multi-season real career/export. The existing 25-season audit export can provide authentic recorded history after a human checks it for confusing old-save anomalies.
- **Visible:** Actual career records, titles/major/world totals with their correct categories and seasons.
- **Not visible:** All exclusions above; do not use an empty or misleadingly staged version of this screen.
- **Resolution:** 1920 × 1080 native game content.
- **Side navigation:** Visible. **Modal:** None.
- **Internal theme:** A career worth looking back on.
- **Why included:** Closes with long-term progression and recorded achievements rather than an unsupported promise of perfect long-save performance.
