# Every starting age to 65 — fixes and complete retest

Generated 2026-09-12T10:23:35.617432+00:00.
**78/78 careers completed; 2,652 seasons.** Every integer starting age from 12 through 50 was tested with seeds 104729 and 130363, ending at age 65.

## Fixes verified

| Change | Retest evidence |
|---|---|
| Protected professional cards below World #128 | Entry recognises active cards; top-16, one-year and invitation limits remain. Eight qualifying/ranking access cases and CPU expiry/top-up regression tests pass. |
| Human world-player match records | Archived seasons now use canonical human match totals. 2,652 human and 3,777,595 CPU season rows compared with scored brackets; 0 mismatches. |
| Older-save recovery | Known season summaries repair missing matches, wins and losses on load; unknown older totals are preserved. Both 25- and 50-season saves retain identical cash and financial ledgers. |
| Starting age 49 | A valid bottom-tour professional route now exists; unsupported configurations cannot silently fall back to a junior. |
| Audit money categories | Team/story transactions and withdrawal refunds are tracked. 0 of 2652 season cash changes fail to reconcile to the penny. The original £541 example is fully explained: £450 team transactions and £91 refunds. |
| Duplicate audit warnings | Overlapping major/World win-rate warnings are emitted once per condition; a high win rate with no title remains advice rather than proof of a defect. |
| Browser follow-ups | Updated the inbox test for consolidated event arrangements; fixed the first-week guide’s invisible area intercepting clicks and sized Tournament Hub to the space below required-decision banners. |

## Integrity checks

| Check | Result |
|---|---|
| Unit tests | 897 passed across 84 files |
| Browser scenarios | 262 unique scenarios passed across the full run and focused reruns, including a real 50-season named-save copy/reload |
| Production build and lint | Passed |
| Complete final save exports parsed | 78; 0 mismatches in cumulative human records |
| Scored world matches examined | 22,332,492 |
| Published event ledgers | 275,808 |
| World/story integrity flags | 0 |
| Extended player-record inconsistencies | 0 across 3,867,648 player-season rows |
| Awarded qualification cards missing | 0 / 60,150 |
| Audit career errors | 0 |
| Financial reconciliation failures | 0 |
| Human World Championship finals / wins | 6 / 1 |
| Game-source files changed during simulation | 0 |

## Career outcomes

Two seeds are a small balance sample. These are automated-manager outcomes, not success targets for human players.

| Starting ages | Careers | Matches | Win rate | Final cash range |
|---|---:|---:|---:|---|
| 12–14 | 6 | 5,931 | 48.9% | £1,442,377–£4,127,513 |
| 15–17 | 6 | 5,769 | 57.9% | £1,488,498–£4,404,979 |
| 18–20 | 6 | 5,506 | 56.4% | £2,071,497–£6,276,113 |
| 21–24 | 8 | 6,066 | 54.8% | £1,668,720–£5,569,152 |
| 25–34 | 20 | 9,985 | 47.5% | £629,164–£4,237,574 |
| 35–44 | 20 | 4,664 | 26.4% | £349,622–£699,008 |
| 45–49 | 10 | 1,443 | 16.6% | £216,680–£348,452 |
| 50 | 2 | 211 | 10.4% | £176,166–£202,349 |


Debt episodes: **8**; unresolved at the final checkpoint: **0**. Lowest observed cash: **−£372**.
Final overall ratings: **38–53**. Final cash: **£176,166–£6,276,113**.

## Remaining findings

See the reviewed findings CSV for the final assessment. Raw win-rate warnings are listed separately; they are not automatically counted as game bugs.

### The youngest careers still lose frequently before later progression.

age12-104729: 22/143 wins/matches in first six seasons; first earned card at 23; final cash £1,771,835; age12-130363: 30/142 wins/matches in first six seasons; first earned card at 23; final cash £2,271,160
Solvency and eventual promotion do not establish an enjoyable opening career. Review event selection and attainable junior objectives before adjusting fair match probabilities.

### Late-career win and trophy opportunities vary substantially by starting route.

age40-104729: 49/214 wins/matches, 1 titles; age40-130363: 34/213 wins/matches, 0 titles; age45-104729: 35/175 wins/matches, 0 titles; age45-130363: 30/170 wins/matches, 0 titles; age49-104729: 26/133 wins/matches, 0 titles; age49-130363: 19/127 wins/matches, 0 titles; age50-104729: 12/107 wins/matches, 0 titles; age50-130363: 10/104 wins/matches, 0 titles
The audit manager and age decline affect these outcomes; a playable solvent save can still provide an unrewarding season. Assess available local/senior events and player expectations.

### Large savings can still accumulate under the low-cost automated manager.

Highest final cash: age19-130363, £6,276,113. Lifetime recorded categories: prizeMoney £3,367,403; sponsorIncome £3,367,531; coachingStaffCosts £-83,737; facilityCosts £0; equipmentMaintenance £-11,406; tournamentEntryFees £-18,585; travelHotelCosts £-214,442; treatmentRecoveryCosts £-7,200; teamAndStoryEvents £34,200; other £-165,652
Two seeds and a low-cost staff/facility policy do not justify compulsory cash drains. Sponsorship after card loss and meaningful optional spending deserve human playtesting.

### Raw audit warnings

A season-opening top-16 ranking is not the World Championship cutoff ranking. A player who later plays and loses qualifying has a recorded route; that warning alone is not the earlier missed-entry defect.

- age13-130363: Top 16 season without World Championship main-draw entry: 2055/56 (open #10, close #21, open status Major Contender, close status Top 32 Professional, main draw no, qualifying yes, reason entered qualifying instead (Lost in Qualifying Round 3)).
- age16-130363: Top 16 season without World Championship main-draw entry: 2046/47 (open #4, close #30, open status Major Contender, close status Top 32 Professional, main draw no, qualifying yes, reason entered qualifying instead (Lost in Qualifying Round 3)).
- age16-130363: Major-event win rate 63.8% produced no major titles.
- age16-130363: World Championship main-draw win rate 66.7% across 15 matches produced no world title.
- age19-130363: Top 16 season without World Championship main-draw entry: 2043/44 (open #16, close #21, open status Major Contender, close status Top 32 Professional, main draw no, qualifying yes, reason entered qualifying instead (Lost in Qualifying Round 3)) | 2050/51 (open #10, close #18, open status Major Contender, close status Top 32 Professional, main draw no, qualifying no, reason season-open main-draw access was available but no World Championship entry was recorded).
- age22-130363: World Championship main-draw win rate 66.7% across 12 matches produced no world title.
- age23-104729: Major-event win rate 62.3% produced no major titles.
- age23-104729: World Championship main-draw win rate 64.3% across 14 matches produced no world title.
- age24-104729: Major-event win rate 62.5% produced no major titles.

## Focused World Championship manager replay

One additional audit-policy fault was found during this matrix. The age-19 seed-130363 career booked the World main draw at #15 on 20 March 2051, fell to #17 before the shared cutoff, and retained the now-invalid reservation until the main event started. The game correctly offered qualifying, but the automated manager did not release its booking in time.
The manager now rechecks locked future entries and uses the ordinary withdrawal/refund action before choosing a valid event. Four focused tests cover invalid, valid, provisional and live-match bookings. The original 25-season trace matched all recorded season results, finances and pathway states. A separate corrected replay is reported alongside the unchanged 78-career matrix; its outcomes are not substituted into that matrix.
The corrected replay preserves the first 24 seasons exactly, then records two qualifying wins and a World Championship quarter-final (two main-draw wins, one loss, £50,000 prize). All 25 seasons reconcile financially and report no career errors. The original missed-entry warning remains in the frozen matrix data for transparency.

## All 78 careers

| Start age | Route | Seed | W–L–D | Titles | Major titles | End cash |
|---|---|---:|---|---:|---:|---:|
| 12 | club-junior | 104729 | 504–480–20 | 10 | 0 | £1,771,835 |
| 12 | club-junior | 130363 | 487–499–27 | 7 | 0 | £2,271,160 |
| 13 | club-junior | 104729 | 474–508–22 | 11 | 0 | £2,843,223 |
| 13 | club-junior | 130363 | 478–500–30 | 7 | 2 | £4,127,513 |
| 14 | club-junior | 104729 | 476–473–26 | 8 | 0 | £2,998,986 |
| 14 | club-junior | 130363 | 483–434–10 | 9 | 0 | £1,442,377 |
| 15 | national-youth | 104729 | 633–422–29 | 18 | 0 | £4,404,979 |
| 15 | national-youth | 130363 | 527–388–25 | 13 | 0 | £2,393,557 |
| 16 | national-youth | 104729 | 567–368–10 | 20 | 0 | £1,488,498 |
| 16 | national-youth | 130363 | 562–381–22 | 17 | 0 | £4,322,900 |
| 17 | national-youth | 104729 | 532–360–22 | 16 | 0 | £2,035,891 |
| 17 | national-youth | 130363 | 522–378–21 | 13 | 0 | £2,859,759 |
| 18 | elite-amateur | 104729 | 547–410–31 | 16 | 1 | £5,669,778 |
| 18 | elite-amateur | 130363 | 563–343–19 | 18 | 0 | £2,071,497 |
| 19 | elite-amateur | 104729 | 517–357–15 | 13 | 0 | £2,142,023 |
| 19 | elite-amateur | 130363 | 567–429–34 | 19 | 0 | £6,276,113 |
| 20 | elite-amateur | 104729 | 417–338–19 | 4 | 0 | £2,441,332 |
| 20 | elite-amateur | 130363 | 497–380–23 | 9 | 0 | £4,654,093 |
| 21 | q-tour | 104729 | 412–308–19 | 10 | 0 | £1,864,434 |
| 21 | q-tour | 130363 | 458–327–22 | 14 | 0 | £2,361,616 |
| 22 | q-tour | 104729 | 386–289–21 | 11 | 0 | £1,897,330 |
| 22 | q-tour | 130363 | 444–351–33 | 9 | 0 | £3,768,096 |
| 23 | q-tour | 104729 | 484–375–29 | 12 | 0 | £5,569,152 |
| 23 | q-tour | 130363 | 404–307–26 | 9 | 0 | £2,063,251 |
| 24 | q-tour | 104729 | 401–312–23 | 8 | 0 | £3,348,333 |
| 24 | q-tour | 130363 | 334–288–13 | 5 | 0 | £1,668,720 |
| 25 | rookie-pro | 104729 | 354–279–16 | 10 | 0 | £1,564,903 |
| 25 | rookie-pro | 130363 | 352–293–16 | 7 | 0 | £1,924,538 |
| 26 | rookie-pro | 104729 | 300–270–17 | 5 | 0 | £1,651,928 |
| 26 | rookie-pro | 130363 | 304–247–20 | 7 | 1 | £4,045,720 |
| 27 | rookie-pro | 104729 | 297–253–16 | 8 | 0 | £1,539,810 |
| 27 | rookie-pro | 130363 | 286–268–15 | 5 | 0 | £1,657,622 |
| 28 | rookie-pro | 104729 | 281–253–13 | 6 | 0 | £1,984,914 |
| 28 | rookie-pro | 130363 | 285–266–12 | 4 | 0 | £1,505,796 |
| 29 | rookie-pro | 104729 | 245–259–15 | 3 | 0 | £1,279,375 |
| 29 | rookie-pro | 130363 | 233–263–11 | 3 | 0 | £1,394,808 |
| 30 | rookie-pro | 104729 | 226–283–16 | 1 | 0 | £2,272,239 |
| 30 | rookie-pro | 130363 | 227–240–12 | 6 | 0 | £1,264,923 |
| 31 | rookie-pro | 104729 | 280–294–22 | 4 | 0 | £4,237,574 |
| 31 | rookie-pro | 130363 | 189–218–5 | 2 | 0 | £928,586 |
| 32 | rookie-pro | 104729 | 201–236–10 | 1 | 0 | £1,273,402 |
| 32 | rookie-pro | 130363 | 155–230–5 | 2 | 0 | £1,003,324 |
| 33 | rookie-pro | 104729 | 163–217–13 | 3 | 0 | £1,236,855 |
| 33 | rookie-pro | 130363 | 143–214–5 | 2 | 0 | £739,642 |
| 34 | rookie-pro | 104729 | 123–212–3 | 3 | 0 | £822,135 |
| 34 | rookie-pro | 130363 | 100–200–4 | 1 | 0 | £629,164 |
| 35 | top-64 | 104729 | 107–187–3 | 2 | 0 | £610,430 |
| 35 | top-64 | 130363 | 108–187–4 | 1 | 0 | £699,008 |
| 36 | top-64 | 104729 | 84–190–3 | 1 | 0 | £625,193 |
| 36 | top-64 | 130363 | 90–191–4 | 0 | 0 | £619,844 |
| 37 | top-64 | 104729 | 73–182–2 | 1 | 0 | £554,906 |
| 37 | top-64 | 130363 | 75–181–2 | 0 | 0 | £629,305 |
| 38 | top-64 | 104729 | 75–182–1 | 1 | 0 | £551,102 |
| 38 | top-64 | 130363 | 89–178–4 | 3 | 0 | £616,941 |
| 39 | top-64 | 104729 | 70–181–1 | 2 | 0 | £509,260 |
| 39 | top-64 | 130363 | 62–163–2 | 1 | 0 | £458,278 |
| 40 | top-64 | 104729 | 49–165–0 | 1 | 0 | £403,048 |
| 40 | top-64 | 130363 | 34–176–3 | 0 | 0 | £501,870 |
| 41 | top-64 | 104729 | 50–160–0 | 0 | 0 | £410,841 |
| 41 | top-64 | 130363 | 36–160–2 | 0 | 0 | £410,646 |
| 42 | top-64 | 104729 | 47–155–0 | 1 | 0 | £372,958 |
| 42 | top-64 | 130363 | 38–154–2 | 0 | 0 | £400,976 |
| 43 | top-64 | 104729 | 36–152–0 | 0 | 0 | £352,767 |
| 43 | top-64 | 130363 | 35–160–2 | 0 | 0 | £461,871 |
| 44 | top-64 | 104729 | 40–147–0 | 0 | 0 | £349,622 |
| 44 | top-64 | 130363 | 34–144–2 | 0 | 0 | £383,477 |
| 45 | top-64 | 104729 | 35–140–0 | 0 | 0 | £345,728 |
| 45 | top-64 | 130363 | 30–140–0 | 0 | 0 | £348,452 |
| 46 | bottom-tour | 104729 | 23–123–0 | 0 | 0 | £255,226 |
| 46 | bottom-tour | 130363 | 24–124–0 | 1 | 0 | £216,680 |
| 47 | bottom-tour | 104729 | 29–118–0 | 1 | 0 | £274,625 |
| 47 | bottom-tour | 130363 | 10–121–0 | 0 | 0 | £261,450 |
| 48 | bottom-tour | 104729 | 29–109–0 | 0 | 0 | £276,246 |
| 48 | bottom-tour | 130363 | 15–113–0 | 0 | 0 | £251,340 |
| 49 | bottom-tour | 104729 | 26–107–0 | 0 | 0 | £244,461 |
| 49 | bottom-tour | 130363 | 19–108–0 | 0 | 0 | £239,633 |
| 50 | masters | 104729 | 12–95–0 | 0 | 0 | £202,349 |
| 50 | masters | 130363 | 10–94–0 | 0 | 0 | £176,166 |

## Scope and limitations

- The same two initial world seeds are reused across starting ages; these are not 78 statistically independent world populations. One selected route at each age, two seeds per age; this is not every combination of path, age and seed. Ages 45–49 resolve to eligible professional routes; age 50 uses the senior start. The old age-49 results used an invalid junior fallback and are not a like-for-like balance comparison.
- Middle support profile, balanced automated management, rotating training and real match gameplay. No synthetic attribute or result boosts.
- Age 65 is the audit stop, not a forced game-retirement action. The audit does not establish that the game automatically retires everyone at 65.
- Cash is observed around game actions and dated settlements; not every internal intermediate mutation is sampled. Some concurrent financial changes remain in the disclosed Other category.
- Browser functionality tests run separately from the simulations. This run is not a weak-CPU loading benchmark or a manual assessment of fun and difficulty.
- Earlier interrupted setup runs are excluded. All reported career outcomes use the single frozen engine below.

Frozen engine SHA-256: `2b87e5b12db40f9aba93405661d2e3552928093ab9592b3cd39384a2d7ef4b82`. Base commit: `a105d7ec11e3960297acfcab2f60e332ac78540e` plus the source changes recorded in the audit manifest.

## Detailed data

- [Career totals](all-ages-to-65-final-20260912-careers.csv)
- [Every season and financial breakdown](all-ages-to-65-final-20260912-seasons.csv)
- [Yearly attributes and development](all-ages-to-65-final-20260912-development.csv)
- [Before/after comparison](all-ages-to-65-final-20260912-comparison.csv)
- [Raw audit warnings](all-ages-to-65-final-20260912-issues.csv)
- [Reviewed issues and balance concerns](all-ages-to-65-final-20260912-reviewed-findings.csv)
