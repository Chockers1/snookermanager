# Youth balance, economy and long-save loading — 12 September 2026

Implemented and tested locally on the v0.1.2 working tree. No GitHub release was published in this pass. Earlier audit fixes remain in the working tree.

## Changes

### Opponent ability in youth matches

Match Centre previously treated a circuit placing as a world-ranking placing when constructing CPU shot attributes, confidence and clutch ability. A top-ranked junior could therefore receive elite professional match attributes despite a much lower public overall rating. New matches now construct a stable individual attribute profile from the registered player’s current overall and saved development offsets. Confidence follows recent results, fatigue comes from their world record, and equipment follows their recorded equipment quality. Potential does not become current ability. Existing in-progress matches retain their saved state. Unknown synthetic opponents retain the existing fallback. This changes live Match Centre, Auto Play and the visit-engine simulations; it is not a rewrite of every aggregate CPU simulation model.

### Passive income and sponsorship

Background support remains fully available up to £25,000 cash, tapers to zero at £100,000, and returns when reserves fall. Difficulty multipliers still apply; negative background costs are not discounted. Retirement still ends support. This changes future income, not existing balances, prizes or contractual payments. New Career, Settings and Finance explain the rule.

National-level senior sponsor offers now require both a top-16 senior position and a singles final in the current or previous season. Qualifiers and unplayed records do not qualify. Existing contracts remain binding; new offers and renewals follow current exposure. The prior fixed renewal ceilings and passive-publicity cap remain in place. Cached final detection avoids rescanning history on every sponsor-profile read.

### Loading and archives

The active save retains current and previous event seasons; older completed brackets move to the existing lossless archive. Four active CPU seasons remain resident, with compact selection summaries. A trial reduction to two CPU seasons changed future selection during the equivalence test and was rejected. Loading also avoids repairing and recalculating a second starter career just to obtain hydration defaults. The actual loaded save still receives all existing repairs.

| Fixture | Old active JSON | New active JSON | Complete portable JSON |
| --- | ---: | ---: | ---: |
| 25 seasons | 21.68 MB | 18.30 MB | 109.09 MB |
| 50 seasons | 29.48 MB | 26.11 MB | 221.30 MB |

Sizes use decimal MB. Full records are preserved. The first archival conversion and full portable import/export are heavier operations than ordinary navigation. Updated compact payloads take effect after the archive/save operation completes.

## Fresh career reruns

Eight careers completed **31 seasons** under the balanced automated manager, middle support, rotating training, season-life decisions and visit-engine match resolution. Seeds and results are below. These are fresh starts, not another fresh 50-season run. The separate 25/50-season checks use the existing long-save snapshots.

| Starting age/path | Seed | Seasons | Wins / matches | Titles | Final overall | Final cash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 12 / club junior | 104729 | 3 | 8 / 72 | 0 | 56 | £1,210.10 |
| 12 / club junior | 130363 | 3 | 14 / 67 | 0 | 56 | £1,338.61 |
| 15 / national youth | 104729 | 3 | 75 / 104 | 6 | 73 | £7,803.38 |
| 15 / national youth | 130363 | 3 | 69 / 101 | 4 | 73 | £7,819.68 |
| 18 / elite amateur | 130363 | 3 | 126 / 161 | 7 | 79 | £75,140.40 |
| 21 / Q Tour | 130363 | 3 | 38 / 62 | 0 | 83 | £160,958.65 |
| 30 / rookie professional | 130363 | 3 | 22 / 51 | 0 | 82 | £139,869.59 |
| 50 / veteran | 130363 | 10 | 7 / 69 | 0 | 50 | £133,657.40 |

The age-12 starts now won **11.1% and 20.9%** of matches; the age-15 starts won **72.1% and 68.3%**. The weaker starting background is still a difficult development route. This is not enough evidence to guarantee an enjoyable first season for an independent new player. Age, starting level and different scheduling are confounded; these are not estimates of a pure age effect.

The elite amateur earned a Q School card at age 21. The Q Tour starter earned one at age 22 and lost it at age 24 after its two-season term. The rookie professional recorded 34.2% wins in professional matches and 69.2% in pathway matches, triggering the audit’s professional-transition balance warning. A single career is insufficient evidence to alter tour difficulty.

Both national-youth cases briefly entered sampled debt (−£233.15 and −£176.50) and recovered on the same game date through event winnings. No unresolved debt was observed. The youngest manager repeatedly spent nearly all available cash; spending strategy remains relevant to its difficulty. Cash observations cover transitions and checkpoints, not every internal mutation within a composite action.

The veteran finished ten seasons with **£133,657**, versus **£381,622** at the same age in the earlier seed-130363 run. Match outcomes and subsequent management also changed, so this is a combined result, not an isolated measurement of the support taper. Successful elite careers can still accumulate substantial prize money; no arbitrary tax or confiscation has been introduced.

No career-run issues, world-audit issues or season-life invariant flags were recorded across the final 31 seasons. These checks do not prove every rule or every future career correct.

The audit manager was corrected to answer required inbox decisions between fixtures before attempting the next match. Previously it recorded a temporary blocked action as an issue and could advance a week before retrying. The final reruns include this correction.

## Production browser performance

Same 25/50-season fixtures as the earlier comparison, production Vite preview, Chromium at 1366×768, three fresh-browser passes each at normal and 4× CPU throttling. Simulation and unit-test jobs were stopped during measurement. Medians below include launcher readiness and continuing into the career.

| Fixture | CPU | Previous cold load | Current cold load |
| --- | --- | ---: | ---: |
| 25 seasons | 1× | 1.66 s | 1.64 s |
| 25 seasons | 4× | 4.04 s | 3.39 s |
| 50 seasons | 1× | 1.76 s | 1.70 s |
| 50 seasons | 4× | 4.58 s | 4.32 s |

Inbox selection across both fixtures at 1×: median **21 ms**, maximum **39 ms**.

Inbox selection across both fixtures at 4×: median **82 ms**, maximum **111 ms**.

312 measured actions covered loading, inbox selection, calendar modes and month changes, planning, all ranking tabs, qualification races and historical player seasons. No captured console errors, page errors or failed requests. Full action medians are in the companion performance CSV. CPU throttling is a proxy, not a measurement on a physical low-end laptop.

The 50-season throttled gain is modest (**4.58 → 4.32 seconds**). Ranking navigation still takes about **1.08 seconds** at 4×. This is an improvement, not a claim that decades-long careers now load instantly.

## Verification

- **881/881 unit tests passed**, including a real playable junior fixture, saved-match reload, support thresholds and restored eligibility for recent senior finalists.
- **15/15 selected Chromium browser tests passed**: lossless archived draws, portable export/import, corrupt/missing archive rejection, durable named saves with the 50-season payload, quota failures, old database upgrades, recovery rotation, rollover backups, interrupted writes, and damaged active saves. Keyboard access and largest text size are included in the archive/settings checks.
- TypeScript, lint on changed source files, and production build passed.
- Both long saves materialized back to an exactly equal original record. Their repaired gameplay state, all 104 event entry decisions, seeded season rollover and opening of the next season matched the unarchived equivalents.
- Old and new loader results matched exactly on both compact long saves and an incomplete older save requiring fallback fields.

## Before a public release

1. **Run a closed beta with independent players.** Have several people complete a season without guidance, including a novice youth start and a professional start. Record abandonment, confusing blocked actions, spending choices and whether losses feel fair. The age-12 route remains hard despite removing the attribute mismatch.
2. **Declare and test supported platforms.** These browser checks use Chromium. Test the actual intended browsers, a physical lower-powered laptop and the supported screen sizes. Keep a release gate for loading/navigation rather than relying only on this machine’s throttling.
3. **Freeze a release candidate and run the full CI/browser suite.** This pass reran all unit tests and selected browser checks, not every Playwright scenario. Extend match calibration across live play, aggregate Quick Sim and CPU-only results; the opponent-profile change affects match balance. Repeat long-career checks on the frozen version.
4. **Rehearse distribution and recovery.** Use the intended hosting origin, test direct links/refreshes and upgrades, and import an exported career into a separate browser profile. Browser saves do not automatically move between origins. Keep the previous release available and document how to export before moving sites or clearing browser data.
5. **Finish release materials.** Confirm asset/data/branding permissions, add the chosen licence and third-party notices, state the supported platforms and minimum tested hardware, explain local saves and backup limitations, and provide a visible support/bug-report route and known-issues page. No repository-wide licence or hosting deployment configuration was found in this pass.

No additional major gameplay system is a prerequisite to a closed beta. The remaining work is proving the existing experience is understandable, balanced and recoverable for users.

## Reproducibility

Career details: [CSV](release-balance-2026-09-12-careers.csv). Performance details: [CSV](release-balance-2026-09-12-performance.csv).

Local evidence is under `artifacts/release-balance*`, `artifacts/simulations/*release-balance-final-20260912*`, `artifacts/career-v012/archive-release-balance-*-v2-*`, and `artifacts/release-readiness/release-balance-final-*`. The immutable simulation bundle is `artifacts/release-balance-simulation.mjs`. Prior findings and longer comparisons remain in [the previous audit](career-audit-fixes-retest-2026-09-12.md).
