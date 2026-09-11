# Long-career storage and balance report — 11 September 2026

## Outcome and scope

Implemented on-demand historical archives, corrected defensive match AI, recovery and ageing safeguards, sponsor payment/renewal rules, financial estimates, and disclosed career difficulty settings. Existing careers retain their records, earned money and signed commercial terms. Package version remains 0.1.1; this report covers subsequent development changes.

This report distinguishes fresh v0.1.1 baselines, an intermediate diagnostic build, and the final corrected simulation build. It does not describe a 50-year final-build playthrough: the final matrix runs 15 years per career, while fresh unchanged v0.1.1 careers run 25. Existing 50- and 100-season snapshots test archival preservation and browser performance separately.

## Historical storage and compatibility

The active save retains the current gameplay window, recent player seasons, compact event outcomes, and small selection summaries. Older event draws and player seasons are compressed into immutable, content-addressed IndexedDB records. Player profiles load the requested player's earlier seasons; Legacy Stats has a World season archive. Historical draws load on request. Normal inbox navigation does not materialise the full career.

| Existing snapshot | Original JSON | Active JSON after archiving | Reduction | Archived records |
| --- | ---: | ---: | ---: | ---: |
| 50 seasons | 100.66 MB | 29.11 MB | 71.1% | 2,476 chunks |
| 100 seasons | 228.15 MB | 42.82 MB | 81.2% | 4,243 chunks |

These are decimal JSON byte sizes, not browser RAM. The compressed active payloads are approximately 3.62 and 5.13 million characters; archive payloads total approximately 8.14 and 17.17 million encoded bytes respectively. Full reconstruction deep-equals the source snapshots. Archiving preserves records that exist; it cannot recreate scores already removed by earlier game versions.

Chunks are written before the compact active save is published. Failed writes leave the original career available. Named saves and recovery snapshots share immutable chunks. Portable exports and bug reports include all archived data, with integrity checks; a missing or corrupted chunk fails explicitly. Importing an incomplete internal compact payload is rejected before replacing the active career. Explicit backup restoration verifies its archive first.

Verified: real 50-season named-copy save/reload; portable export/import in a separate browser context; old draw opening; corrupt/missing data handling; all 104 current entry decisions and an actual subsequent season transition agree between full and compact versions. Tests used isolated browser storage on ports 4174/4175; they did not import into or advance the live RT career on port 5173.

First-time conversion took approximately 5.01 seconds for 50 seasons and 13.04 seconds for 100 seasons under concurrent audit load. This is separate from subsequent startup measurements. There is intentionally no automatic archive garbage collection yet: deleted careers may leave unreferenced chunks. This avoids deleting data still used by backups but remains a storage-management limitation.

## Performance

Production Chromium, 1366×768, three repeated passes at normal speed and simulated 4× CPU slowdown. Audit workers were paused during measurements. This is not certification on a physical low-end laptop. Compact saves and their archives were installed before timing, so the numbers exclude first migration.

| Save | Normal cold start median | 4× CPU cold start median | 4× inbox message selection | 4× rankings open | 4× oldest player season |
| --- | ---: | ---: | ---: | ---: | ---: |
| RT | 1.56 s | 3.19 s | 30–39 ms | 974 ms | 59 ms |
| 50 seasons | 1.75 s | 4.35 s | 62–114 ms | 732 ms | 286 ms |
| 100 seasons | 1.75 s | 4.85 s | 38–81 ms | 1,118 ms | 340 ms |

The 50-season slow-CPU result improves about 31% against the previously reported 6.31 seconds. No runtime errors were observed. Remaining warnings: all slow-CPU cold starts exceed the three-second target; occasional ranking/profile interactions exceed one second. The 100-season profile maximum was 1.315 seconds. The still-growing current CPU population, event headers and central game module remain candidates for further profiling; loading every old bracket is no longer required.

## Dominant human careers: a confirmed AI defect

The normal Match Centre opponent could repeatedly choose safety while tired or using a cautious archetype, even when it needed to score. That becomes especially damaging over long World Championship matches. The earlier symmetric calibration path did not exercise this normal opponent decision policy and therefore missed the defect.

The corrected cautious AI takes available scoring chances, uses defence when protecting an appropriate lead or playing to a genuine safety strength, and takes periodic openings instead of remaining in indefinite safety exchanges. Player safety tactics can also take available colour-ball openings. Ratings, potting probabilities, prize money and difficulty-dependent match rules were not changed.

Equal-ability best-of-35 controls use attributes 90, confidence 75, fatigue 30, no equipment edge, alternating opening side and equal session recovery.

| Opponent archetype | Before: human wins, 200 matches | Corrected: same 200 seeds | Independent corrected RNG, 400 matches |
| --- | ---: | ---: | ---: |
| Serial Scorer | 95.5% | 51.5% | 50.0% |
| Tactical Grinder | 100.0% | 57.0% | 51.5% |
| Counter Puncher | 100.0% | 53.5% | 50.0% |
| Tempo Disruptor | 100.0% | 52.0% | 51.75% |

An additional 1,800 controlled calibration matches examined confidence and freshness separately. Equal conditions produced 53.67% human wins (95% Wilson interval 48.01–59.23%); confidence 95 versus 75 produced 56%; fatigue 0 versus 40 produced 67.67%; both advantages produced 68%. These controlled inputs do not validate every tactical matchup or convert the UI's heuristic win probability into an exact calibrated probability. Fresh careers also diverge in later opponents and event choices, so same seeds cease to be identical match pairings after outcomes change.

## Fresh career matrix

Completed in this report: **420 fresh simulated seasons** across 20 completed careers/build cases.

All starts use the same automated balanced manager, middle support/equipment policy, rotating training focuses, normal live match engine and season-life systems. No calibration adjustments were enabled. This covers several seeds, not every human management style or every difficulty mode. Canonical title flags distinguish trophies from qualifying wins and Winners Group labels.

### Unchanged v0.1.1 — 25 seasons each

| Start / seed | Years | Final age / overall | World rank | Singles titles | World wins / finals | Closing cash |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| Youth 104729 | 25 | 40 / 94 | 1 | 67 | 10 / 10 | £25,911,938 |
| Youth 130363 | 25 | 40 / 94 | 1 | 74 | 9 / 9 | £26,359,681 |
| Amateur 204732 | 25 | 42 / 91 | 1 | 64 | 14 / 14 | £31,527,043 |
| Amateur 230366 | 25 | 42 / 90 | 1 | 71 | 7 / 7 | £28,891,062 |
| Q Tour 304735 | 25 | 43 / 91 | 2 | 73 | 12 / 12 | £30,716,384 |
| Q Tour 330369 | 25 | 43 / 88 | 2 | 63 | 14 / 14 | £29,461,183 |
| Professional 404738 | 25 | 43 / 91 | 3 | 79 | 16 / 16 | £36,026,367 |
| Professional 430372 | 25 | 43 / 89 | 5 | 77 | 15 / 15 | £36,811,422 |

### Corrected build — 15 seasons each

| Start / seed | Years | Final age / overall | World rank | Singles titles | World wins / finals | Closing cash |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| Youth 104729 | 15 | 30 / 91 | 23 | 17 | 0 / 0 | £1,910,736 |
| Youth 130363 | 15 | 30 / 91 | 29 | 15 | 0 / 0 | £1,082,169 |
| Amateur 204732 | 15 | 32 / 92 | 34 | 16 | 0 / 0 | £1,448,464 |
| Amateur 230366 | 15 | 32 / 92 | 44 | 22 | 0 / 0 | £1,537,305 |
| Q Tour 304735 | 15 | 33 / 92 | 44 | 11 | 0 / 0 | £1,308,726 |
| Q Tour 330369 | 15 | 33 / 92 | 19 | 21 | 0 / 0 | £4,772,793 |
| Professional 404738 | 15 | 33 / 92 | 30 | 19 | 0 / 1 | £7,690,925 |
| Professional 430372 | 15 | 33 / 92 | 21 | 28 | 0 / 0 | £8,405,844 |

The corrected careers reached one World final in total and lost it. This removes the earlier perfect-conversion pattern in the sample, but one final is far too little evidence to estimate a fair championship win rate or rule out overcorrection. All completed reports recorded zero integrity issues; every sampled debt episode had recovered by the final checkpoint.

### Like-for-like first 15 years

| Start / seed | v0.1.1 World wins / finals, first 15 years | Corrected World wins / finals | v0.1.1 cash, year 15 | Corrected cash, year 15 |
| --- | ---: | ---: | ---: | ---: |
| Youth 104729 | 4 / 4 | 0 / 0 | £9,802,864 | £1,910,736 |
| Youth 130363 | 3 / 3 | 0 / 0 | £10,327,494 | £1,082,169 |
| Amateur 204732 | 9 / 9 | 0 / 0 | £16,716,949 | £1,448,464 |
| Amateur 230366 | 4 / 4 | 0 / 0 | £13,457,500 | £1,537,305 |
| Q Tour 304735 | 6 / 6 | 0 / 0 | £15,309,758 | £1,308,726 |
| Q Tour 330369 | 5 / 5 | 0 / 0 | £14,122,239 | £4,772,793 |
| Professional 404738 | 8 / 8 | 0 / 1 | £19,108,027 | £7,690,925 |
| Professional 430372 | 10 / 10 | 0 / 0 | £20,758,232 | £8,405,844 |

Four additional intermediate 25-season careers (two youth, two amateur) tested recovery/economy changes before the AI correction. Their continuing perfect World-final conversion helped locate the separate defensive-AI defect. They are diagnostic evidence, not evidence for the final AI. Incomplete queued intermediate runs are excluded.

## Ageing, training and recovery

Stable individual decline onset remains randomly distributed from 35 to 40, with individual rates from 0.65 to 1.45. Annual loss is redistributed using current attribute levels, so already-depleted physical skills decline more slowly instead of reaching 1 while maintained attributes remain untouched. The weighted overall ageing budget remains consistent with CPU decline. Permanent attributes are never raised by this ageing calculation.

Treatment previously awarded permanent shoulder/recovery increases and mental recovery awarded permanent focus/composure increases. Those repeatable gains have been removed. Treatment and mental recovery have saved cooldown dates; repeated immediate actions cannot apply another recovery or charge. Genuine training remains the source of development. Old accumulated attributes are not retroactively reduced because a save cannot reliably distinguish legitimate training from the old treatment rewards.

Verification includes 120 seeded decline profiles, human/CPU overall parity, stable onset/rate, and a 40–65 attribute-distribution scenario. In the intermediate 25-year youth runs, shoulder/recovery stayed around the low 80s/high 70s instead of both reaching 100. The final fresh 15-year matrix ends at ages 30–33; it does not independently establish final-build retirement-age balance.

## Economy and affordability

Sponsorship now pays twelve monthly amounts over a 52-week year, correcting the old monthly÷4 formula which paid thirteen. Monthly facility rent and the planning cost estimate use the same twelve-month conversion. New renewals are capped by current commercial exposure; lifetime prestige cannot indefinitely compound a prior professional deal after card loss. Existing signed payments remain binding. Retired players receive no new sponsor renewals or background work support; existing contracts run to normal expiry/review.

Financial forecasts now show recurring estimates, rather than adding lifetime prize money to monthly income or counting net income twice. Season-opening cash and recorded season prizes are labelled separately. Upcoming event estimates are not presented as already charged expenses.

| Corrected start / seed | Prize income | Sponsor income | Itemised costs | Lowest sampled cash | Longest debt episode | Card changes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Youth 104729 | £1,184,110 | £846,109 | £131,994 | £4 | 0 days | earned age 22 |
| Youth 130363 | £657,636 | £527,142 | £118,875 | £1 | 0 days | earned age 23 |
| Amateur 204732 | £807,610 | £770,884 | £109,134 | £-5,143 | 1791 days | earned age 26 |
| Amateur 230366 | £857,990 | £785,033 | £130,145 | £-3,036 | 663 days | earned age 20; lost age 22; earned age 23; lost age 25; earned age 27 |
| Q Tour 304735 | £627,253 | £769,507 | £143,904 | £78 | 0 days | earned age 23; lost age 25; earned age 26 |
| Q Tour 330369 | £2,647,440 | £2,197,745 | £159,614 | £78 | 0 days | earned age 21; lost age 23; earned age 24 |
| Professional 404738 | £4,594,483 | £3,042,359 | £165,423 | £78 | 0 days | lost age 20; earned age 21 |
| Professional 430372 | £4,975,500 | £3,237,036 | £162,577 | £78 | 0 days | lost age 20; earned age 21 |

Itemised costs include staff, equipment, entry, travel/hotels and treatment. Other cash movements include support, bonuses and unitemised adjustments, so this is not a claim that the older ledger identifies every transaction perfectly. Debt sampling observes completed actions and calendar checkpoints, not every mutation inside a composite action.

The corrected amateur sample still contains long debt episodes: as much as 1,791 days in one seed. Both recovered, but that is a real affordability warning, not a clean pass. The automated manager continues entering events through debt and does not represent careful human budgeting. Successful professionals can still accumulate substantial wealth because real prize-scale rewards dwarf ordinary travel costs; expenses have not been artificially inflated to erase success.

## Difficulty options

Available when confirming a new career and under Settings → Career difficulty. Existing careers default to Standard. Changes apply prospectively and never grant an immediate cash payment.

| Mode | Positive background support | Compliance lost for a missed obligation | Missed-obligation termination threshold |
| --- | ---: | ---: | ---: |
| Relaxed | 150% | 12 | 5 |
| Standard | 100% | 18 | 3 |
| Demanding | 75% | 22 | 3 |

Compliance below 40 can also end a deal; the UI explains this. Negative background costs are not multiplied. Support stops at retirement. Match rules, opponents, training and prize awards are identical across modes. Automated tests compare the same match profile/preparation/probability across all modes. A complete multi-decade matrix of all three modes remains future balance coverage, not claimed here.

## Verification and evidence

- 749 unit/regression tests passed across 69 files.
- Four archive/difficulty browser tests passed, including separate-browser import and incomplete-import preservation.
- Existing storage and season-life browser coverage: ten passed, one optional scenario skipped.
- A simultaneous unrestricted-worker test/build/lint run hit five timeouts, with no failed value assertions. The final suite was rerun with two workers without changing test limits.
- Production build, TypeScript and lint passed. Lint emits only the existing large-module Babel note.
- Archive preservation and next-season gameplay equivalence passed on the large snapshots.
- Largest text size and keyboard selection checked; no horizontal page overflow in the tested finance view.

Raw evidence stays locally under `artifacts/career-v012/`. `comparison-summary.json` records each report source. Baseline manifest fixes commit `c82c72b95652d292010a44a155aea7d003783600`; `final/source-manifest.json` fixes the simulated candidate source. Later changes are UI/storage import validation and a negative-support guard and twelve-month facility rent correction. The simulated manager used no paid facility, so those latter adjustments do not change this matrix; the match engine is unchanged. Performance reports are under `artifacts/release-readiness/{rt,archive50,archive100}-verified/`.

The remaining practical work is further slow-CPU startup reduction, safe archive cleanup, broader difficulty/affordability samples, and a final-code career through retirement. The implemented fixes and completed samples should not be described as proof that every long-career situation is balanced.
