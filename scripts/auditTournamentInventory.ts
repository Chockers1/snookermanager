import { detailedTournamentCatalog } from '../src/data/pathwayCalendarData';
import { resolveTournamentFormat, getPlayableRounds, getBestOfForRound, TOURNAMENT_FORMATS } from '../src/data/tournamentFormats';
import { mkdirSync, writeFileSync } from 'node:fs';
const events = detailedTournamentCatalog.map(t => {
  const f = resolveTournamentFormat(t);
  return { id: t.id, name: t.name, formatId: f.id, field: f.fieldSize, structure: f.groupMode ?? (f.qualifiers ? `${f.qualifiers} qualification places` : 'knockout'),
    notes: f.sourceStatus ?? 'Published baseline / authored calendar; see scope notes',
    rounds: getPlayableRounds(f).map(r => ({ round: r, explicit: f.roundBestOf?.[r] ?? null, actual: getBestOfForRound(t, r, -1) })) };
});
const missing = events.flatMap(t => t.rounds.filter(r => r.explicit === null || r.actual < 1));
if (missing.length) throw new Error(`${missing.length} rounds lack explicit rules`);
mkdirSync('artifacts', { recursive: true }); mkdirSync('docs/reports', { recursive: true });
writeFileSync('artifacts/tournament-format-inventory.json', JSON.stringify(events, null, 2));
const header = `# Tournament round and frame audit

Reviewed 6 September 2026. Covers all ${events.length} events in the game's authored 2026/27 calendar and all ${Object.keys(TOURNAMENT_FORMATS).length} profiles. This replaces the earlier definition-only format audit.

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
`;
const table = events.map(e => `| ${e.id} · ${e.name} | ${e.field ?? '—'} | ${e.structure} | ${e.rounds.map(r => `${r.round}: ${r.actual}`).join('; ') || 'No matches'} |`).join('\n');
writeFileSync('docs/reports/tournament-rules-audit.md', header + table + '\n');
console.log(JSON.stringify({ events: events.length, profiles: Object.keys(TOURNAMENT_FORMATS).length, rounds: events.reduce((n, e) => n + e.rounds.length, 0), missing: missing.length }));
