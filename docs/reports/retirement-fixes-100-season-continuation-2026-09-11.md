# Retirement fixes and the completed 100-season continuation

The stopped career now completes its existing seniors event and advances. The same saved world has reached **30 June 2126: 100 completed seasons**. Retirement stays permanent, new competitive entries stop after retirement, and long saves can be copied and restored from IndexedDB.

## Changes

- **Retirement:** becoming eligible for retirement during an active competition now creates a persistent pending retirement. Existing active entries finish first; new entries close. Retirement cannot disappear when a ranking label or seniors table changes. The human world record retains the same retired status at rollover.
- **Old deadlocked saves:** a started, recorded tournament entry remains playable even when an older save already says retired. An unplayed entry can still be withdrawn. Existing results and finances are preserved.
- **Pairs:** retired players receive no new side invitations and cannot accept or start new team matches. An old optional entry can be withdrawn after its completed match. A pending retirement allows the accepted competition to finish.
- **Ageing:** human attribute losses previously translated into only about 48–52% of the overall decline applied to a CPU player with the same profile. Annual losses now use the rating's actual group weights. Random onset ages 35–40, individual decline rates, and slower loss of learned skills remain. This applies at future rollovers; existing ratings and results are not rewritten.
- **Storage:** new saves use deterministic GZIP compression, with old LZ and raw JSON still readable. The compression worker no longer parses and serializes the whole career again. Recovery listings and rotation use small metadata records; restoring loads only the chosen payload. The recovery database upgrade preserves old backups, including when another window initially blocks it.
- **Planning:** view switches reuse unchanged recommendations. Retired players are told they are retired rather than directed towards a qualifying event.

The earlier coach-date, season-opening snapshot, summary retention, ranking tie-order and IndexedDB fixes remain in place. See [the previous fix report](long-career-fixes-2026-09-11.md).

## Actual failed save reproduced

The original career stopped on **10 October 2094**, age 83, in the last 16 of Seniors Tour – Event 3. It had already won two matches. The old code rejected play because the player was retired, rejected withdrawal because the event had started, and rejected advancement because the event was active.

With the fix, the next match completed normally, the player lost in the last 16, and the calendar advanced to **11 October**. Retirement remained set in both human and world records. The original input file was unchanged. [Reproduction evidence](../../artifacts/retirement-fixes/reproduction.json).

## Continuation results

This was **68 original completed seasons plus the remainder of season 69 and 31 further seasons**, not a fresh 100-season run entirely on the new code. The human remained retired throughout the continuation; age 115 at the end represents calendar history, not competitive participation.

The original failure did not preserve its terminal random-generator state. The continuation explicitly reseeded future random choices to 104729 while keeping the saved world, identities and past results. It used a frozen source copy. Later pending-retirement and planning refinements were verified separately; they did not alter this frozen run.

| Check | Result |
| --- | ---: |
| Total completed seasons, original + continuation | 100 |
| Continuation annual event records | 3,328 |
| Events still due when resuming / recorded | 3,302 / 3,302 |
| Scored matches in those annual records | 269,472 |
| Combined 100-season annual records | 10,400 events; 842,100 scored matches |
| Missing events, unresolved matches, frame-rule flags | 0 |
| Anonymous winners / age-ineligible CPU entrants | 0 / 0 |
| Tour cards at every continuation rollover | 128 |
| Earned card awards checked / missing | 727 / 0 |
| New named players / retirements | 1,171 / 1,156 |
| World champion ages in continuation | 24–40; mean 32.81 |
| New human competition entries after retirement | 0 |
| New dated staff/team storyline failures | 0 |

The first partial season includes **26 events already published before the continuation began**. Its July pairs result and 52 older coach-deadline incidents also survive in history. All 53 inherited life findings predate the resume date; they were retained and classified, not deleted or counted as newly fixed gameplay. [Classification](../../artifacts/retirement-fixes/classified-life-findings.json).

[Annual tables and findings](../../artifacts/retirement-fixes/continuation-report/measured-results.md) · [Card awards](../../artifacts/retirement-fixes/continuation-report/all-card-awards.csv) · [Continuation manifest](../../artifacts/retirement-fixes/continuation/manifest.json) · [Completion record](../../artifacts/retirement-fixes/continuation/result.json).

## Save and regression verification

**719 tests passed in 65 files.** The initial unrestricted run had five timeouts while heavy jobs ran together; the complete rerun with two workers passed. Subsequent focused checks passed after the planning refinements. TypeScript, production build and lint passed; the build retains its large-bundle warning.

All browser storage/recovery checks passed: legacy migration, transaction failure, corruption detection, interrupted compression, protected rollover, database upgrade retry, and named-copy/reload journeys for both **68-season and 100-season** real saves. The 100-season copy-and-reload journey took 61.3 seconds across its multiple loads and writes.

The final save contains **228,145,055 bytes of JSON**, encoded to **20,650,656 ASCII characters**. Round-trip decoding was exact. Two successive repairs changed none of the checked finances, career records, contracts, player records or match IDs. World and one-year standings matched a fresh ledger rebuild. [Final save verification](../../artifacts/retirement-fixes/final-save-verification.json).

For the same 68-season source used in the original measurement, encoding fell from **83.2 seconds to 3.25 seconds**, and decoding took **1.27 seconds**. The 100-season verification measured 6.9 seconds for encoding and 3.9 seconds for decoding while other checks ran. [Codec benchmark](../../artifacts/retirement-fixes/codec-benchmark.json).

## Balance and performance limits

A controlled experiment covered **1,200 seeded ageing profiles** and 30 years per profile. Single-season human/CPU underlying decline matched within floating-point precision. With all starting attributes at 94 at age 30 and no training, the median human rating was 87.02 at 45 and 78.57 at 50; individual age-50 results ranged from 63.77 to 86.92. This confirms varied, equivalent ageing mechanics. It does **not** prove championship outcomes are balanced for every playing policy or starting path. [Experiment](../../artifacts/retirement-fixes/ageing-parity.json).

Production browser measurements used the 68-season save, three passes each at normal speed and simulated 4× CPU slowdown. No runtime or resource errors were recorded. Normal median cold navigation to the career was **3.77 seconds**; message selection was **10–25 ms**, opening rankings **185 ms**, and opening player history **213 ms**. Normal all-tour planning improved from 214 ms to 128 ms after avoiding repeat calculations.

**Further performance work remains for slow machines:** simulated 4× slowdown took **20.38 seconds** for cold navigation, **4.04 seconds** for all-tour planning and **1.28 seconds** for the Q Tour tab. Compression and save capacity are substantially improved, but loading and some broad views still exceed a smooth-interaction budget on that stress test. CPU throttling is not certification on a physical low-end laptop. [Repeated performance report](../../artifacts/release-readiness/retirement-68-final/performance-report.md).

These tests used isolated files and browser contexts. The live RT save was not replaced. Changes are local; no GitHub push or release was performed.

Frozen continuation source SHA-256: `ac0b19ac3516902fad5c5859de5e62311be9dcf77f43758fac8e7144806b068d`

Final runtime source SHA-256: `605a262bd0cc5d48862c10cb24ae39993eff4b6a919a9ff30813caa3c72ab9c2`
