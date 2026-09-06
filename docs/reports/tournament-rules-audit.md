# Tournament round and frame audit

Reviewed 6 September 2026. Covers all 104 events in the game's authored 2026/27 calendar and all 62 profiles. This replaces the earlier definition-only format audit.

The initial inventory found 358 event-round entries without an explicit frame count. Every playable round now has one. Tests build and finish all calendar draws, check every score against the live match planner, count all entrants and terminal qualification places, and reject unresolved opponents or phantom rounds. Further tests cover fixed seed protection, attached qualifiers, group survival, live special formats and reloads.

Further non-main-tour entry, qualification and finance corrections are detailed in [the pathway audit](pathway-rules-audit.md).

## Corrected behaviour

- Complete frame sequences, including World 19/25/25/33/35, UK qualifying 11 throughout, World qualifying 19 throughout, Shanghai opening 11, Tour Championship opening 19, and World Grand Prix opening 9.
- Home Nations quarter-finals use 11 frames for the announced 2026/27 change. Wuhan uses tiered qualifying; Xi'an uses WST's anticipated equivalent structure and remains marked provisional.
- Attached English/Welsh qualifiers stop after two rounds for 32 places. International and World Open qualifiers each play one round, over 11 and 9 frames respectively, for 64 places. Main draws use their recorded qualifiers.
- Q School stops at the UK/Europe quarter-finals (four card winners) or Asia-Oceania semi-finals (two). The Order of Merit review has no matches. Global Play-Offs have three separate eight-player card sections, with 9/11/19-frame matches.
- Tiered feeders preserve the bracket's seed protection. British Open and Shoot Out redraw each round. World and UK qualifiers are drawn into protected main-draw seed positions.
- Ranking Championship League has 32, eight and two groups, then a final. Invitational League has seven rolling groups and a Winners Group, each with 21 league fixtures, two semi-finals and a final. Tables and next fixtures persist after individual losses.
- WSF and EBSA use group stages followed by knockout play. The club league has a full round robin. Junior and amateur authored events honour their individual advertised frame lengths.
- Shoot Out uses a ten-minute simulated clock, 15/10-second shot limits, ball in hand after fouls and blue-ball ties. World Seniors uses black-ball deciding frames. Riyadh offers the golden ball after a 147. The authored junior handicap grants the lower seed two points per rank-place gap, capped at 28 per frame.
- Best-of-seven matches have no mid-session interval. Live and quick simulations share special rules. The Hub exposes the actual round table rather than an independent description.

## Scope and remaining abstractions

This is an audit of the game's event formats and round simulation, not certification that it reproduces every tournament regulation or the complete real 2026/27 calendar. The existing calendar names, dates, venues, nomination/selection model and most prize schedules remain authored game data. Saudi uses the latest available edition's match format; retaining the event does not assert a current-season booking. Xi'an is provisional in the cited announcement. Future changes must update the rules matrix.

WSF/EBSA accepted fields are fixed at 64 or 128 in this game, with groups of four and two qualifiers. Real fields and some WSF knockout lengths depend on accepted entries. Q Tour Europe uses 192 accepted entrants to support its 64 protected seeds and one preliminary round; UK Q School uses 128 accepted entrants. Regional Q Tour and generic federation events use explicitly authored rules rather than claiming one worldwide uniform format. Invitation and wildcard rosters remain simulated rather than official entry lists.

Ranking/invitational group tables use recorded breaks and stable saved order when every stored sporting tie-break remains equal. Amateur ties unresolved by wins, frame difference and head-to-head use saved best-of-five re-spotted-black play-offs, shown alongside the table. The game does not store a complete archive of every break needed for every possible successive-highest-break tie. Shoot Out cushion/foul decisions are statistical, as is the existing shot engine; there is no table-geometry referee simulation. Golden-ball promotional bonus money is not added by this frame-rules change.

Unplayed entered saves upgrade to the new draw rules. Completed results and a match already in progress are preserved; this does not retroactively reconstruct an old played knockout as a group campaign. Exact real-world group fixture dates and held-over qualifying schedules are not reconstructed: attached International/World Open qualifiers are consolidated in their qualifying event. Hotel dates continue to use the authored event window.

## Primary references

- [WST: 2026/27 China formats](https://www.wst.tv/news/2026/june/03/china-formats-this-season-explained/)
- [WST: Home Nations quarter-finals increase](https://www.wst.tv/news/2026/june/26/home-nations-quarter-finals-change-to-best-of-11/)
- [WST: World Grand Prix match lengths](https://www.wst.tv/news/2025/december/03/format-change-for-2026-world-grand-prix-in-hong-kong-with-longer-matches/)
- [WST: Tour Championship schedule and format](https://www.wst.tv/news/2026/march/23/sportsbet-io-tour-championship-match-schedule-confirmed/)
- [WST: World Championship draw](https://www.wst.tv/news/2026/april/14/Halo-World-Championship-2026--The-Draw/)
- [WST: British Open lengths](https://www.wst.tv/news/2023/april/07/cazoo-british-open-moves-to-cheltenham/)
- [WST: British Open random draw](https://www.wst.tv/news/2022/march/30/cazoo-to-sponsor-snookers-british-open/)
- [WST: German Masters qualifying](https://www.wst.tv/news/2026/january/05/machineseeker-german-masters-qualifying-day-one/)
- [Championship League: ranking format](https://championshipleaguesnooker.co.uk/ranking/championship-league-snooker-2026/)
- [Championship League: invitational rules and prizes](https://championshipleaguesnooker.co.uk/invitational/)
- [WPBSA: Q Tour Europe 2026/27](https://www.wpbsa.com/q-tour-europe-dates-announced-for-2026-27/)
- [WPBSA: Q Tour preliminary and main-stage lengths](https://wpbsa.com/wp-content/uploads/Q-Tour-25-26-Event-7-Landywood-UK-merged.pdf)
- [WPBSA: Global Play-Offs](https://www.wpbsa.com/spain-to-host-2026-wpbsa-q-tour-global-play-offs/)
- [WPBSA: Q School cards](https://www.wpbsa.com/q-school-2026-entry-deadline-thursday/)
- [EBSA: championship conditions](https://www.ebsa.tv/wp-content/uploads/2025/10/EBSA-Championship-Conditions-January-2025.pdf)
- [EBSA: U18 final format](https://www.ebsa.tv/u18-european-championship-final-moldova-versus-poland/)
- [EBSA: U21 final](https://www.ebsa.tv/anton-kazakov-is-the-european-u21-champion/)
- [WSF: championship invitation](https://worldsnookerfederation.org/wp-content/uploads/WSF-Invitation-Letter-Bulgaria-2026.pdf)
- [WSF: junior knockout results](https://www.worldsnookerfederation.org/junior-semis-set-in-sofia/)
- [World Seniors: lengths, byes and black-ball deciders](https://www.seniorssnooker.com/draw-format-details-confirmed-for-2026-jenningsbet-world-seniors-snooker-championship/)
- [WST: Riyadh lengths and golden ball](https://www.wst.tv/news/2025/november/10/turki-alalshikh-announces-ticket-launch-for-the-riyadh-season-world-snooker-championship-2025/)
- [WPBSA: playing rules including Shoot Out](https://wpbsa.com/wp-content/uploads/Rulebook-Website-Updated-May-2022.pdf)

## Every calendar event

Numbers below are maximum frames for the named round; 4 denotes a drawn group format, not first to two. Administrative entries have no playing rounds.

| Event | Field | Structure | Round-by-round frames |
|---|---:|---|---|
| pc-01 · Summer Junior Club League | 16 | league | League: 3 |
| pc-02 · Saturday Junior Handicap | 16 | knockout | Last 16: 3; Quarter Final: 3; Semi Final: 3; Final: 3 |
| pc-03 · Local Under-16 Open | 16 | knockout | Last 16: 3; Quarter Final: 3; Semi Final: 3; Final: 3 |
| pc-04 · Town Junior Championship | 16 | knockout | Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-05 · Christmas Club Classic | 16 | knockout | Last 16: 3; Quarter Final: 3; Semi Final: 3; Final: 3 |
| pc-06 · Winter Junior League Finals | 16 | knockout | Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 7 |
| pc-07 · Local Champion of Champions | 16 | knockout | Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-08 · Regional Junior Series 1 | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-09 · County Under-18 Open | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-10 · Regional Junior Series 2 | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-11 · Regional Youth Masters | 16 | knockout | Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-12 · County Youth Championship | 32 | knockout | Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-13 · Regional Junior Series Finals | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-14 · National Under-16 Championship | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-15 · National Junior Series 1 | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-16 · National Under-18 Open | 32 | knockout | Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-17 · Junior Invitational Cup | 16 | knockout | Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-18 · National Junior Series 2 | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-19 · National Under-21 Championship | 32 | knockout | Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-20 · Summer Amateur Open | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-21 · National Amateur Series 1 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-22 · Pro-Am Challenge North | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-23 · National Amateur Championship | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-24 · Elite Amateur Masters | 32 | knockout | Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-25 · Pro-Am Challenge South | 32 | knockout | Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 5 |
| pc-26 · Amateur Tour Finals | 16 | knockout | Last 16: 9; Quarter Final: 9; Semi Final: 9; Final: 9 |
| pc-95 · WSF Junior Championship | 64 | amateur | Group Stage: 5; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-96 · WSF Open Championship | 128 | amateur | Group Stage: 5; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-97 · EBSA European U16 Championship | 64 | amateur | Group Stage: 5; Last 32: 5; Last 16: 5; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-98 · EBSA European U18 Championship | 64 | amateur | Group Stage: 5; Last 32: 5; Last 16: 5; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-99 · EBSA European U21 Championship | 128 | amateur | Group Stage: 5; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-100 · EBSA European Amateur Championship | 128 | amateur | Group Stage: 5; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-101 · Asia-Pacific Federation Qualifier | 64 | knockout | Last 64: 5; Last 32: 5; Last 16: 5; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-102 · Americas Federation Qualifier | 64 | knockout | Last 64: 5; Last 32: 5; Last 16: 5; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-103 · CBSA China Tour Qualifier | 64 | knockout | Last 64: 5; Last 32: 5; Last 16: 5; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-27 · Americas - Event 1 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-28 · Asia Pacific - Event 1 | 48 | knockout | Round One: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-29 · Asia Pacific - Event 2 | 40 | amateur | Group Stage: 5; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-30 · Asia Pacific - Event 3 | 128 | knockout | Last 128: 5; Last 64: 5; Last 32: 5; Last 16: 5; Quarter Final: 5; Semi Final: 5; Final: 7 |
| pc-31 · Europe - Event 1 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-32 · Middle East - Event 1 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-33 · Middle East - Event 2 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-34 · Europe - Event 2 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-35 · Asia Pacific - Event 4 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 9; Final: 11 |
| pc-36 · Europe - Event 3 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-37 · Europe - Event 4 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-38 · Americas - Event 2 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-39 · Europe - Event 5 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-40 · Americas - Event 3 | 48 | knockout | Round One: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-41 · Middle East - Event 3 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-42 · Asia Pacific - Event 5 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-43 · Middle East - Event 4 | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-44 · Europe - Event 6 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-45 · Americas - Event 4 | 48 | knockout | Round One: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-46 · Europe - Event 7 | 192 | knockout | Preliminary Rounds: 5; Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-47 · Q Tour Global Play-Offs | 24 | 3 qualification places | Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-48 · UK / Europe Q School Event 1 | 128 | 4 qualification places | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7 |
| pc-49 · UK / Europe Q School Event 2 | 128 | 4 qualification places | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7 |
| pc-50 · Asia-Oceania Q School Event 1 | 128 | 2 qualification places | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7 |
| pc-51 · Asia-Oceania Q School Event 2 | 128 | 2 qualification places | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7 |
| pc-120 · Q School Order of Merit Review | — | knockout | No matches |
| pc-52 · Championship League | 128 | ranking | Stage One Groups: 4; Stage Two Groups: 4; Stage Three Groups: 4; Final: 5 |
| pc-53 · Shanghai Masters | 24 | knockout | Round 1: 11; Last 16: 11; Quarter Final: 11; Semi Final: 19; Final: 21 |
| pc-54 · Saudi Arabia Masters | 144 | knockout | Round 1: 7; Round 2: 7; Round 3: 7; Round 4: 9; Last 32: 9; Last 16: 11; Quarter Final: 11; Semi Final: 11; Final: 19 |
| pc-55 · Wuhan Open | 128 | knockout | Qualifying Round 1: 9; Qualifying Round 2: 9; Qualifying Round 3: 9; Last 32: 9; Last 16: 9; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-56 · English Open Qualifying | 96 | 32 qualification places | Qualifying Round 1: 7; Qualifying Round 2: 7 |
| pc-57 · English Open | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 11; Semi Final: 11; Final: 17 |
| pc-58 · British Open | 128 | knockout | Last 128: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-59 · Xi'an Grand Prix | 128 | knockout | Qualifying Round 1: 9; Qualifying Round 2: 9; Qualifying Round 3: 9; Last 32: 9; Last 16: 9; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-60 · Northern Ireland Open | 128 | knockout | Qualifying Round 1: 7; Qualifying Round 2: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 11; Semi Final: 11; Final: 17 |
| pc-61 · International Championship Qualifying | 128 | 64 qualification places | Qualifying Round: 11 |
| pc-62 · International Championship | 64 | knockout | Last 64: 11; Last 32: 11; Last 16: 11; Quarter Final: 11; Semi Final: 17; Final: 19 |
| pc-63 · Champion of Champions | 16 | knockout | Group Semi Final: 7; Group Final: 11; Semi Final: 11; Final: 19 |
| pc-64 · Riyadh Season Championship | 12 | knockout | Preliminary Round: 7; Quarter Final Play-in: 7; Quarter Final: 7; Semi Final: 7; Final: 9 |
| pc-65 · UK Championship Qualifying | 128 | 16 qualification places | Qualifying Round 1: 11; Qualifying Round 2: 11; Qualifying Round 3: 11; Qualifying Round 4: 11 |
| pc-66 · UK Championship | 32 | knockout | Last 32: 11; Last 16: 11; Quarter Final: 11; Semi Final: 11; Final: 19 |
| pc-67 · Shoot Out | 128 | knockout | Last 128: 1; Last 64: 1; Last 32: 1; Last 16: 1; Quarter Final: 1; Semi Final: 1; Final: 1 |
| pc-68 · Scottish Open | 128 | knockout | Qualifying Round 1: 7; Qualifying Round 2: 7; Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 11; Semi Final: 11; Final: 17 |
| pc-69 · Championship League Invitational | 25 | invitational | Group 1: 5; Group 1 Semi Final: 5; Group 1 Final: 5; Group 2: 5; Group 2 Semi Final: 5; Group 2 Final: 5; Group 3: 5; Group 3 Semi Final: 5; Group 3 Final: 5; Group 4: 5; Group 4 Semi Final: 5; Group 4 Final: 5; Group 5: 5; Group 5 Semi Final: 5; Group 5 Final: 5; Group 6: 5; Group 6 Semi Final: 5; Group 6 Final: 5; Group 7: 5; Group 7 Semi Final: 5; Group 7 Final: 5; Winners Group: 5; Winners Group Semi Final: 5; Final: 5 |
| pc-70 · Masters | 16 | knockout | Last 16: 11; Quarter Final: 11; Semi Final: 11; Final: 19 |
| pc-71 · German Masters | 128 | knockout | Qualifying Round 1: 9; Qualifying Round 2: 9; Qualifying Round 3: 9; Last 32: 9; Last 16: 9; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-72 · World Grand Prix | 32 | knockout | Last 32: 9; Last 16: 9; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-73 · Welsh Open Qualifying | 96 | 32 qualification places | Qualifying Round 1: 7; Qualifying Round 2: 7 |
| pc-74 · Players Championship | 16 | knockout | Last 16: 11; Quarter Final: 11; Semi Final: 11; Final: 19 |
| pc-75 · Welsh Open | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 11; Semi Final: 11; Final: 17 |
| pc-76 · World Open Qualifying | 128 | 64 qualification places | Qualifying Round: 9 |
| pc-77 · World Open | 64 | knockout | Last 64: 9; Last 32: 9; Last 16: 9; Quarter Final: 9; Semi Final: 11; Final: 19 |
| pc-78 · Tour Championship | 12 | knockout | Round One: 19; Quarter Final: 19; Semi Final: 19; Final: 19 |
| pc-79 · World Championship Qualifying | 128 | 16 qualification places | Qualifying Round 1: 19; Qualifying Round 2: 19; Qualifying Round 3: 19; Judgement Day: 19 |
| pc-80 · World Championship | 32 | knockout | Last 32: 19; Last 16: 25; Quarter Final: 25; Semi Final: 33; Final: 35 |
| pc-81 · Veteran Invitational Open | 16 | knockout | Last 16: 3; Quarter Final: 3; Semi Final: 3; Final: 5 |
| pc-82 · Legends Pro-Am Classic | 16 | knockout | Last 16: 3; Quarter Final: 3; Semi Final: 3; Final: 5 |
| pc-83 · Seniors Tour - Event 1 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-84 · Seniors Tour - Event 2 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-85 · Seniors Tour - Event 3 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-86 · Seniors Tour - Event 4 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-87 · Seniors Tour - Event 5 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-88 · British Seniors Open | 8 | knockout | Quarter Final: 7; Semi Final: 9; Final: 13 |
| pc-89 · Seniors Tour - Event 6 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-90 · Seniors Tour - Event 7 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-91 · Seniors Tour - Event 8 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-92 · Seniors Tour - Event 9 | 64 | knockout | Last 64: 7; Last 32: 7; Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-93 · World Seniors Golden Ticket Qualifier | 16 | knockout | Last 16: 7; Quarter Final: 7; Semi Final: 7; Final: 7 |
| pc-94 · World Seniors Championship | 24 | knockout | Round One: 7; Last 16: 7; Quarter Final: 7; Semi Final: 13; Final: 19 |
