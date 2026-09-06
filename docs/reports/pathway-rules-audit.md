# Non-main-tour audit — 6 September 2026

This extends the [full tournament audit](tournament-rules-audit.md) with entry, progression, finance and computer-player checks. The calendar still represents a generated player world; published regulations and explicit game conventions are distinguished below.

## Implemented corrections

| Circuit | Behaviour |
| --- | --- |
| Club, regional and national youth | Individual U16/U18/U21 limits, not a single youth-phase gate. Date of birth is used when saved; legacy players without one use their stored age. Local invented events retain their own advertised formats. |
| WSF Junior | Under 19, groups followed by knockout, 5-frame group baseline, 7-frame knockouts and 9-frame final. Open and Junior champions earn cards; no blanket runner-up award is invented. |
| EBSA | European federation representation, U16/U18/U21 eligibility on 31 March, groups and knockout lengths. A duplicate European card can pass to the eligible runner-up. |
| Q School | Removes the incorrect age-18 floor. Junior acceptance/guardian consent is assumed by the game. Asia-Oceania requires appropriate citizenship. UK quarter-final winners and Asian semi-final winners earn cards. Qualified players are excluded from subsequent events. One £960 UK or £560 Asia campaign fee covers the two events. Results are measured in frame wins, with separate UK and Asia tables. |
| Q Tour Europe | Published 2026/27 event dates and venues, £30,000 funds, £6,000 winner, £3,000 runner-up, £2,000 semi-final, £1,250 quarter-final, £750 last 16 and £350 last 32. Published 10,000/7,000/4,900/3,430/2,400/1,680/1,175/825/575 ranking scale; opening losses score zero. |
| Q Tour Global | Europe results determine the automatic card. Event champions are included in playoff selection, with regional places and European replacements. The leader does not play for a second card. Three section winners get cards, with actual CPU qualifiers prioritised at season rollover. |
| Regional Q Tour | Six-month residence requirement; an event trip is not residence. Rankings can be viewed by region. Fred Osbourne uses 5-frame matches and a 7-frame final; Australian Open uses 7/9/11. North American legs use 48 entrants and 7 frames throughout. New Zealand uses groups of five then a Last 16 knockout. |
| Seniors | Players aged 40+ can enter regular events even with an active professional card. £1,000 regular-event winner, instead of £40,000. Ranking points count frames. Two-year and one-year lists select separate qualifiers, followed by Golden Ticket and simulated invitations. Seniors titles never award a WST card. |
| Federation routes | EBSA, Asia-Pacific, Americas and CBSA enforce their represented territory. Generic federation qualifier names remain game events; they do not purport to reproduce every nomination tournament. |

All persisted CPU entrants pass the same basic age, nationality and professional-status rules. Q School and seniors CPU results now count frames rather than generic finishing-point percentages. Amateur results no longer credit Q School OOM or Q Tour standings. Official qualifying places are selected from recorded tournament brackets rather than invented career scores.

## In the game

- Tournament Hub → Event Details → Round rules and format: actual frame sequence plus applicable entry and qualification rules.
- Rankings → Q Tour Ranking: Europe, Asia Pacific, Middle East or Americas.
- Rankings → Q School OOM: UK or Asia.
- Rankings → Senior Ranking: two-year list or Race to the Crucible.
- New Zealand Q Tour: group standings and fixtures remain visible after every match.

## Remaining game conventions

- Fields are generated, with fixed accepted-entry sizes. UK Q School uses 128, Q Tour Europe 192, WSF/EBSA 64 or 128. The New Zealand game field is 40 in eight groups of five (the actual 2026 field was 45); group matches use the game's best-of-five baseline. Vacancies are filled by qualifier slots, rather than reproducing each actual accepted entry or withdrawal bye. A North American 48-player field assigns sixteen first-round byes by game ranking.
- Published 2026 regional match formats are retained as the baseline for subsequent seasons. Unpublished Middle East/regional details, generic federation formats and invitations are explicitly provisional or game-authored. Regional qualification currently allocates two places per represented regional series, with unfilled places reverting to Europe; this is a simulation allocation, not a claimed final 2027 nomination list. Regional results use a common finishing-point scale within their separate tables.
- Initial regional residence is assumed from nationality for legacy/generated identities. A deliberate training-base relocation changes residence and starts the six-month period. Upgrading the base in the same location does not restart that period. Citizenship and residence are otherwise separate.
- Federation good standing, parental consent and invitation acceptance are assumed, not separate administration minigames. Q Tour remains an off-tour competition in this simulation. Actual organiser exemptions for individual professionals are not modelled.
- Seniors regular events use the published £3,000 budget and £1,000 winner, with a game allocation of £500/£250/£125/£62.50 to the runner-up/semis/quarters/last 16. Membership fees, break prizes, regional currency conversion, consolation plates and supplementary junior/women's prizes are not fully modelled.
- Separate pathway standings use completed archived results only. They do not invent missing historic regional results in old saves. Exact unresolved ranking ties use recent finishes then stable name ordering. Opening carried-over senior records without archived brackets cannot be reconstructed.
- Version 3 regenerates unplayed entered draws. Completed results and active matches remain intact. Existing saved event dates and bookings are preserved; corrected dates apply to new careers and subsequently generated seasons. Updated rules and uncompleted-event prize data load on refresh.

## Primary references

- [WPBSA Q School 2026 entry pack](https://www.wpbsa.com/wp-content/uploads/8a452cf0-3e6e-11f1-be72-f1d704c67f03.pdf)
- [Asia-Oceania Q School 2026 pack](https://asia-oceania-q-school.com/Asia_Oceania_Q_School_2026_Entry_Pack_v1__1_.pdf)
- [2026/27 Q Tour Europe announcement](https://www.wpbsa.com/q-tour-europe-dates-announced-for-2026-27/)
- [Q Tour points and prize schedule](https://wpbsa.com/wp-content/uploads/WPBSA-Q-TOUR-EUROPE-2025-26-RANKING-POINTS-AND-PRIZE-MONEY-SCHEDULE.pdf)
- [Q Tour entry conditions](https://wpbsa.com/wp-content/uploads/Q-Tour-25-26-Event-7-Landywood-UK-merged.pdf)
- [Global Play-Offs criteria](https://www.wpbsa.com/spain-to-host-2026-wpbsa-q-tour-global-play-offs/)
- [PABSA North America entry pack](https://pabsa.org/wp-content/uploads/2025/10/Q-Tour-Americas-2025-26.pdf)
- [ABSC calendar and entry packs](https://absc.com.au/calendar)
- [Fred Osbourne 2026 pack](https://absc.com.au/s/2026-FRED-OSBOURNE-Q-Tour.pdf)
- [Australian Open 2026 pack](https://absc.com.au/s/2026-BOB-HAWKE-AUST-OPEN-1.pdf)
- [West Coast International 2026 pack](https://absc.com.au/s/2026-wci.pdf)
- [New Zealand Open groups and field](https://www.wpbsa.com/q-tour-asia-pacific-2026-27-event-2-tournament-information/), [knockout results](https://www.wpbsa.com/canovan-wins-maiden-q-tour-title-in-auckland/)
- [WSF Junior 2026 format](https://www.worldsnookerfederation.org/wsf-junior-womens-championships-2026-tournament-information/)
- [EBSA championship conditions](https://www.ebsa.tv/wp-content/uploads/2025/10/EBSA-Championship-Conditions-January-2025.pdf)
- [Seniors professional eligibility and prize increase](https://www.seniorssnooker.com/world-seniors-snooker-launches-new-season-with-increased-prize-money/)
- [2026/27 seniors qualification and frame rankings](https://www.seniorssnooker.com/wss-rankings-2026-27-event-one-update/)
