# Fresh 50-season career and save audit — 11 September 2026

**Completed all 50 seasons on the latest fixed code**, ending on **30 June 2076**. The final save successfully created a named copy and reloaded through the game. No simulation deadlock, missing annual event, lost earned tour card, or career-stat arithmetic failure was detected. Further work remains on eligibility, long-save responsiveness and balance.

[Importable 50-season save](../../artifacts/fresh50-20260911/snooker-50-season-save.json) · [Every season, tournament and player](../../artifacts/fresh50-20260911/report/measured-results.md) · [Run manifest](../../artifacts/fresh50-20260911/run-manifest.json).

The importable file uses the game's compressed save envelope and works with **Save Manager → Import Career**. It is a separate test career, **Elliot Vance**, not the user's RT career. The live RT save was not read or replaced during this run.

## Test setup

One fresh youth career, age 15, seed **104729**, normal middle-support manager, balanced event selection, rotating training and the normal live-frame engine with interval recovery. The manager accepted affordable optional pairs events, used training for form recovery, answered interviews with praise, declined coach renewals and recruited juniors. No synthetic attribute, cash or preparation boosts were applied.

The run used a frozen copy of the runtime and audit scripts; the current runtime still matches that copy. It completed **2,616 weekly advances**, **606 human singles-event entries**, and approximately **74.9 minutes** of simulation and annual evidence recording. All 50 season rollovers ran without a restart or reseed. The initial career begins 11 May 2026; its first season includes that opening period, rather than being exactly twelve months. This is one policy and seed, not a statistical guarantee for every starting route.

## What worked

| Check | Result |
| --- | ---: |
| Scheduled events / recorded events | 5,200 / 5,200 |
| Scored tournament-bracket matches | 421,050 |
| Missing events, unresolved matches or frame-format flags | 0 |
| Anonymous champions / unregistered entrant appearances | 0 / 0 |
| CPU age-eligibility or retired-entry flags | 0 |
| CPU season-record arithmetic / major-counter shortfalls | 0 / 0 |
| Earned cards checked / missing next-season cards | 1,134 / 0 |
| Tour-card holders at every rollover | 128 |
| New named players / retirements | 1,728 / 1,035 |
| Incorrect human season-opening dates | 0 |
| Human season summaries / opening snapshots retained | 50 / 51 |
| Early coach departures, short notices or double employment flags | 0 |
| Duplicate retained financial-ledger IDs | 0 |

Card checks included **600 Q School**, **200 Q Tour** and **334 federation-route** awards. They verify allocation against the game's configured rules, not independent certification against future real-world tournament regulations. All 50 Championship League seasons survived calendar rollover. [Card-by-card evidence](../../artifacts/fresh50-20260911/report/all-card-awards.csv).

The player earned a Q School card at age **22** on 30 June 2033, retained main-tour membership until age **54**, then continued in senior and amateur competition. Losing the card did not block advancement. At the end the player was **65**, still active in the veteran phase; this fresh run does not itself test eventual retirement. The previous [100-season continuation](retirement-fixes-100-season-continuation-2026-09-11.md) tested that separate path.

## Human career and ageing

The actual saved career contains **2,130 singles matches: 1,385 wins, 689 losses and 56 draws**, **92 singles trophies**, **12 World Championships**, **1,261 centuries** and **one 147**. Recorded prize money totals **£25,922,424.50**; final cash is **£40,807,297.90**, including other career income. Team results are separate.

The player's stable decline profile starts at **40**, rate **0.88**. Continued training was allowed throughout:

| Age | Earlier code, same starting seed/policy | Latest code |
| --- | ---: | ---: |
| 35 | 94 | 94 |
| 40 | 94 | 94 |
| 45 | 93 | 91 |
| 50 | 91 | 86 |
| 55 | 87 | 79 |
| 60 | 82 | 70 |
| 65 | 76 | 63 |

This shows stronger late-career decline. The careers diverge as results and random choices change, so this is not an isolated experiment proving that ageing alone caused every difference.

CPU World champions averaged **30.16 years**. Including the human gives **31.96**, with an overall range of **21–49**. The human's latest World title came at **49**, and they won all **12 World finals** reached. Their six-title streak ran from ages **31–36**. These are balance concerns, not evidence of corrupt standings. Confidence, live-match outcomes, training effects and the mature-career economy warrant a wider multi-seed comparison. At age 65, stamina, balance and hand steadiness had reached 1 while trained shoulder health and recovery remained above 80; the shape of decline also merits review, beyond the overall number.

Cash was observed at **50,377 action/calendar checkpoints**. One debt episode reached **−£48.60** at age 15 and recovered on the same game date after event settlement. No season closed in debt. Internal temporary mutations within a composite action were not sampled; the final wealthy career does not establish affordability for every start or management choice.

## In-season systems

- **100 accepted pairs events completed**, exactly two per season: **640 rubbers**, including **40 deciding doubles**. No field-identity, rubber-format, individual-condition, duplicate-payment-ID or winner-share flags occurred.
- **Six form concerns** resolved after **26, 28, 30, 31, 33 and 42 days**. Diagnostic evidence remained bounded. This manager used targeted training; it does not re-test every recovery choice.
- **101 recorded coach moves to named CPU players**, with no detected early-departure or double-employment errors.
- **325 interviews** and **264 distinct stories** were retained across annual evidence: 102 staff, 100 team, 55 rival-return, six form and one junior arc.

This run does not cover every negotiation answer, ignored invitation, interrupted doubles reload, or junior-development branch. The detailed outcome checks are in [additional evidence](../../artifacts/fresh50-20260911/report/additional-checks.json) and [story/team tables](../../artifacts/fresh50-20260911/report/life-seasons.csv).

## Remaining problems and warnings

1. **Champion of Champions eligibility remains too broad.** The human entered in every season from **2065/66 through 2075/76**, despite having no professional card and no recent singles title. The last actual singles trophy was the 2062/63 Championship League. The eligibility code accepts lifetime major/World Champion status without a qualifying-title window. Historical prestige should not silently provide indefinite access to this event.
2. **A World Championship selection gap needs a focused reproduction.** In 2050/51 the player was **#13 on 3 April**, with entry/travel/preparation snapshots. Qualifying started **7 April**. They were **#17 on 10 April**, then a withdrawal was recorded on the **18 April** main-draw start. No qualifying or main-draw match was played. The dates strongly indicate that qualification and main-draw selection can leave a player between routes after a ranking change. The evidence proves the missed event; the exact interaction between game cutoff rules and the automated manager still needs tracing before a fix.
3. **Long-save performance remains slow, especially on weak CPUs.** See measurements below. Storage capacity is fixed; loading and navigation are not yet consistently quick.
4. **The audit harness overcounts some titles and mislabels some money.** It reports 98 titles because six finishes containing “Winners Group” were treated as titles. The actual save, trophy cabinet and annual title sums correctly show **92**. Its “non-tour world-ranking prize money” warning includes non-ranking invitational prizes. The final ledger contains **no human world-ranking credits after the card loss**. These are audit-reporting defects, not six extra in-game trophies or ranking-credit leakage. Its other broad “major” and decider summaries use different classifications; the saved career records take precedence.

No gameplay fixes were made during this test. These findings remain open; they were not hidden behind the zero integrity-check count.

## Save verification

The final JSON is **100,659,820 bytes**, compressed to **10,225,780 ASCII bytes** in the portable save. Compression took **2.75 seconds** and decoding **1.68 seconds** in the verification run. Decoding reproduced the original exactly.

Two repair/load passes changed none of the checked finances, season records, contracts, story state, player aggregates or match IDs. World and one-year rankings matched a fresh ledger rebuild. The source file's checksum remained unchanged. These checks compare specified durable fields, not byte equality after every derived-state repair. [Verification results](../../artifacts/fresh50-20260911/save-50-verification.json).

Both **25-season and 50-season** browser named-copy/reload tests passed. Their complete multi-load/write journeys took **22.3 seconds** and **32.4 seconds** respectively. These are journey totals, not single-click latency. The latest production build and `git diff --check` passed. The previously passing full unit suite was not rerun for this audit-only work; no runtime source changed.

## Browser performance

Production Chromium, 1366×768, **three passes at normal speed and three at simulated 4× CPU slowdown**, using the final active career in isolated browser contexts. No runtime, console or failed-resource errors were captured. The standalone fresh launcher smoke check also passed; it does not represent loading the 50-season save.

| Action | Normal median | 4× CPU median |
| --- | ---: | ---: |
| Cold navigation to playable career | 3.97 s | 24.47 s |
| Open inbox | 0.90 s | 8.08 s |
| Select an inbox message | 0.23–0.29 s | 1.87–2.02 s |
| Open calendar | 1.36 s | 7.42 s |
| Calendar next month | 25 ms | 56 ms |
| All-tour season planning | 0.38 s | 2.49 s |
| Open rankings | 1.11 s | 5.84 s |
| Switch ranking tab | 0.20–0.35 s | 1.80–2.46 s |
| Open player history | 0.76 s | 4.32 s |
| Select oldest player season | 43 ms | 101 ms |

Cold loading exceeds the 3-second budget even normally; several views and tabs exceed a 1-second interaction budget under throttling. These results are **not a clean performance pass**. CPU throttling is a stress test, not certification on a physical low-end laptop. The 68-season retired snapshot tested previously is a different workload; its faster message timings should not be substituted for this active-career measurement. [Complete performance report](../../artifacts/release-readiness/fresh50-20260911/performance-report.md).

## Reproduction and files

The manifest contains the exact command, seed, manager policy and source fingerprint. Raw final state, 25/50-season checkpoints and random-generator state are retained under the frozen run's artifacts directory. The compact importable copy was verified against the raw file. Annual CSVs cover tournaments, player records, rankings, qualifiers and story outcomes.

Runtime SHA-256: `605a262bd0cc5d48862c10cb24ae39993eff4b6a919a9ff30813caa3c72ab9c2`

Final raw-save SHA-256: `e78c6c443aac0a8b076d6dde1d17426fbb84508359cec95dfa93d88e1bb1d5b5`

Changes remain local. No GitHub push or release was performed.
