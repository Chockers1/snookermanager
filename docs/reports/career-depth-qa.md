# Career depth implementation — QA, 5 September 2026

## Result

Career-depth implementation is available through the existing game screens. Save schema 9 migrates existing careers without replaying old rewards or enabling assistance. Existing unrelated working-tree changes were preserved. No commit, GitHub push or deployment was performed in this task.

| Check | Result |
| --- | --- |
| Unit/integration tests | 116 passed across 8 files |
| Full Chromium browser suite | 87 passed |
| Production build / TypeScript | Passed |
| ESLint | Passed, no lint errors or warnings |
| Production dependency audit | 0 vulnerabilities |
| Whitespace/diff check | Passed |
| Long-career matrix | 24/24 scenarios passed, 30 completed seasons each |

Babel prints its existing large-file formatting notice for the game-state hook; this is not an ESLint finding. The new domain rules are in separate career-depth modules, but this task does not claim to have finished splitting the older central engine.

## Long-career matrix

Command:

```text
npm run simulate:balance-matrix -- --seasons=30 --seeds=104729,130363 --concurrency=3
```

Final matrix generated at `2026-09-04T21:09:21.207Z` (5 September in New Zealand).

- All 12 starting paths, two derived seeds each: **720 archived seasons**.
- Matrix failures/review flags: **0**.
- Settled-week confidence samples: **37,752**.
- Average confidence by career: **75.9–81.6%**.
- Settled weeks at 98% confidence or above: **0**.
- Major stories per 30-year career: **2–53**; four-week pacing checks passed.
- No detected duplicated career reward ledger IDs, cap violations or matches directly altering permanent attributes.

The matrix uses conservative authored choices (retain approach/protect preparation), existing managed support and explicit withdrawal if equipment cannot be serviced. It does not automatically select paid story commitments or run every possible project/assistance combination. Those paths have separate boundary, accounting, lifecycle and browser tests. These results are not proof that every player strategy has identical balance.

### Non-blocking balance advisories retained

The existing simulation report emitted two advisories, separate from matrix failures:

- Q Tour, seed **504741**: final reported rank 65; aggregate win rate 53.1% is more strongly driven by pathway wins than professional wins.
- Rookie Pro, seed **704747**: final reported rank 65; aggregate win rate 53.2% is more strongly driven by pathway wins than professional wins.

Both careers completed all 30 seasons. These are retained for a future targeted professional/pathway balance review; the core progression model was not rewritten to erase the warnings.

## Bugs found and fixed during verification

1. Switching to the last stocked chalk unit could leave 100% condition with zero usable stock, stranding an entered career. Chalk stock now includes the active unit and per-product condition survives switching; switching does not grant free fresh chalk.
2. A player who rose into the Top 16 during a qualifier could be forbidden from continuing and forbidden from withdrawing. Valid participants can finish the same already-started event; future-entry restrictions, retirement, date, travel and equipment gates remain enforced.
3. Duplicate live finalization could replay settlement. New live session IDs are attached to the resulting match and repeated finalization is ignored.
4. Same-day matches after a story choice were omitted from follow-ups. Reviews now track the choice's match-ID baseline, not only the calendar date.
5. An expanded development section initially squeezed the laptop timetable. Contained native-dialog editors preserve the underlying workspace.

## Coverage details

- Live and quick-match completion both enter the once-only career evidence pipeline.
- Reading/reopening/reloading a choice does not resolve or repay it; pending decisions survive inbox trimming.
- Historical-name migration refuses ambiguous CPU names and does not replay stories or money.
- Partner retirement preserves history; observed tactics alone select rivalry counters.
- Projects count relevant weeks, pause for injury/competition, remove temporary cue penalties, and have no completion attribute lump sum.
- Project and partner efficiency respects the shared ceiling and selected skills.
- Coach review conversations have a four-week cooldown and never change existing contracts automatically.
- Approved schedules enforce caps, reserves, injury pauses, tournament gates and protected pre-major days.
- Commitments replace training cells; partial calendar boundaries do not duplicate weekly training or finance settlement.
- Sponsor appearance payments are once-only, limited in frequency, and cannot credit a replacement sponsor's obligation.
- Neutral weekly confidence settles below saturation; expected/upset outcomes differ and repeated gear/travel/preparation confirmation cannot farm confidence.
- Browser tests cover complete tournaments, story decisions, budget approval, named saves/reload, season rollover, every route and responsive layouts.
- New career editors were checked at **1920×1080**, **1280×720**, and **768×1024**; the broader suite also covers iPad landscape and smaller phone viewports. Laptop/iPad screenshots were visually inspected.

## Artifacts and use

Raw reports and screenshots remain ignored under `artifacts/`; `artifacts/simulations/balance-matrix-latest.json` contains individual seeds and report paths. Earlier diagnostic runs are not the final acceptance result.

See [the career-depth player guide](../career-depth.md) for controls, consequences, defaults and persistence details. Start with **Training → Development & practice** or **Calendar → Season strategy & commitments**. Assistance remains off until the player explicitly approves a block.
