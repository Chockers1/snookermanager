import type { TournamentFormatProfile as Profile } from './tournamentFormats';

type Rules = Partial<Profile> & { roundStructure: string[]; roundBestOf: Record<string, number> };
const KO = ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'];
const Q = ['Qualifying Round 1', 'Qualifying Round 2', 'Qualifying Round 3', 'Qualifying Round 4'];
const rounds = (labels: string[], lengths: number | number[], extra: Partial<Profile> = {}): Rules => ({
  ...extra, roundStructure: labels, roundBestOf: Object.fromEntries(labels.map((r, i) => [r, typeof lengths === 'number' ? lengths : lengths[i]])),
});
const knockout = (field: number, lengths: number | number[], extra: Partial<Profile> = {}) => rounds(KO.slice(7 - Math.log2(field)), lengths, { fieldSize: field, ...extra });
const tiered = (length = 9) => rounds([...Q.slice(0, 3), ...KO.slice(2)], [length, length, length, length, length, length, 11, 19], {
  fieldSize: 128, entryTiers: [{ through: 32, round: Q[2] }, { through: 64, round: Q[1] }],
  seedingModel: 'Seeds 65+ start Q1; seeds 33-64 enter Q2; top 32 enter Q3. Top 16 Q3 matches are held over.',
});
const amateurGroups = (field: number, youth = false) => rounds(['Group Stage', ...KO.slice(7 - Math.log2(field / 2))],
  [5, ...KO.slice(7 - Math.log2(field / 2)).map(r => r === 'Final' ? youth ? 7 : 9 : youth && /Last/.test(r) ? 5 : 7)],
  { fieldSize: field, groupMode: 'amateur', seedingModel: 'Groups of four; top two advance to a seeded knockout.', sourceStatus: 'Published format with a fixed accepted field in the game' });
const homeMain = knockout(64, [7, 7, 7, 11, 11, 17]);
const inviteStages = Array.from({ length: 8 }, (_, i) => i === 7 ? 'Winners Group' : `Group ${i + 1}`).flatMap(g => [g, `${g} Semi Final`, g === 'Winners Group' ? 'Final' : `${g} Final`]);

/** Explicit gameplay lengths. Future unpublished details retain the latest published baseline.
 * Sources and game-authored exceptions are recorded in docs/reports/tournament-rules-audit.md.
 */
export const auditedRules = {
  juniorLocal: knockout(16, [3, 5, 5, 7]),
  juniorRegional: knockout(32, [3, 3, 5, 5, 7]),
  juniorNational: knockout(32, [5, 5, 5, 5, 7]),
  juniorInvitationalCup: knockout(16, [5, 5, 5, 7]),
  juniorSeasonFinals: knockout(16, [5, 5, 5, 7]),
  juniorLeague: rounds(['League'], 3, { fieldSize: 16, groupMode: 'league', sourceStatus: 'Game-authored club competition' }),
  amateurOpen: knockout(32, [5, 5, 5, 7, 7]),
  amateurSeries: knockout(64, [5, 5, 5, 5, 7, 7]),
  amateurChampionship: knockout(64, [5, 5, 5, 7, 7, 9]),
  eliteAmateur: knockout(32, [5, 5, 7, 7, 9]),
  amateurTourFinals: knockout(16, [5, 7, 7, 9]),
  wsfJuniorChampionship: amateurGroups(64),
  wsfOpenChampionship: amateurGroups(128),
  ebsaYouthChampionship: amateurGroups(64, true),
  ebsaCardRoute: amateurGroups(128),
  federationCardRoute: knockout(64, [5, 5, 5, 7, 7, 9], { sourceStatus: 'Game-authored regional nomination event; federation formats vary' }),
  qTourRegular: rounds(['Preliminary Rounds', ...KO], [5, 7, 7, 7, 7, 7, 7, 7], { fieldSize: 192, entryTiers: [{ through: 64, round: 'Last 128' }] }),
  qTourEuropeEvent: rounds(['Preliminary Rounds', ...KO], [5, 7, 7, 7, 7, 7, 7, 7], { fieldSize: 192, entryTiers: [{ through: 64, round: 'Last 128' }], sourceStatus: 'Published match rules; 192 accepted entrants in the game' }),
  qTourRegionalEvent: knockout(128, [7, 7, 7, 7, 7, 7, 9], { sourceStatus: 'Game-authored regional schedule; local formats vary' }),
  qTourPlayoff: rounds(['Quarter Final', 'Semi Final', 'Final'], [9, 11, 19], { fieldSize: 24, qualifiers: 3 }),
  qSchoolEvent: rounds(KO.slice(0, 5), 7, { fieldSize: 128, qualifiers: 4 }),
  qSchoolUkEuropeEvent: rounds(KO.slice(0, 5), 7, { fieldSize: 128, qualifiers: 4, sourceStatus: 'Published card-winning round; 128 accepted entrants in the game' }),
  qSchoolAsiaOceaniaEvent: rounds(KO.slice(0, 6), 7, { fieldSize: 128, qualifiers: 2 }),
  qSchoolReview: rounds([], []),
  rookieQualifier: knockout(64, [7, 7, 7, 7, 7, 9]),
  proQualifier: rounds(Q.slice(0, 2), 7, { fieldSize: 96, seedOffset: 32, qualifiers: 32, entryTiers: [{ through: 64, round: Q[1] }], seedingModel: 'Seeds 65-128 play Q1; seeds 33-64 enter Q2 for 32 main-draw places.' }),
  internationalQualifier: rounds(['Qualifying Round'], 11, { fieldSize: 128, qualifiers: 64, seedOffset: 0, entryTiers: [], seedingModel: 'One qualifying match for a place in the Last 64.' }),
  worldOpenQualifier: rounds(['Qualifying Round'], 9, { fieldSize: 128, qualifiers: 64, seedOffset: 0, entryTiers: [], seedingModel: 'One qualifying match for a place in the Last 64.' }),
  standardRanking: knockout(64, [7, 7, 7, 9, 11, 19]),
  championshipLeagueRanking: rounds(['Stage One Groups', 'Stage Two Groups', 'Stage Three Groups', 'Final'], [4, 4, 4, 5], { groupMode: 'ranking' }),
  saudiArabiaMasters: rounds(['Round 1', 'Round 2', 'Round 3', 'Round 4', ...KO.slice(2)], [7, 7, 7, 9, 9, 11, 11, 11, 19]),
  wuhanOpen: tiered(),
  britishOpen: knockout(128, [7, 7, 7, 7, 9, 11, 19], { drawPolicy: 'randomEachRound' }),
  xianGrandPrix: { ...tiered(), sourceStatus: 'WST anticipated 2026/27 format; provisional' },
  homeNationsRanking: rounds([...Q.slice(0, 2), ...KO.slice(1)], [7, 7, 7, 7, 7, 11, 11, 17], { fieldSize: 128, entryTiers: [{ through: 32, round: 'Last 64' }, { through: 64, round: Q[1] }] }),
  homeNationsMain: { ...homeMain, entryTiers: [], seedingModel: 'Top 32 and the 32 winners of the attached qualifier.' },
  internationalRanking: knockout(64, [9, 9, 9, 9, 11, 19]),
  internationalChampionship: knockout(64, [11, 11, 11, 11, 17, 19], { entryTiers: [], seedingModel: '64 winners of the attached one-round qualifier. Held-over qualifiers are consolidated in the qualifying event.' }),
  ukMajorQualifying: rounds(Q, 11, { qualifiers: 16, seedOffset: 16 }),
  ukMajor: knockout(32, [11, 11, 11, 11, 19]),
  mastersInvitational: knockout(16, [11, 11, 11, 19]),
  shanghaiMasters: rounds(['Round 1', ...KO.slice(3)], [11, 11, 11, 19, 21]),
  riyadhSeasonChampionship: rounds(['Preliminary Round', 'Quarter Final Play-in', 'Quarter Final', 'Semi Final', 'Final'], [7, 7, 7, 7, 9], { specialRules: ['goldenBall'] }),
  shootOut: knockout(128, 1, { drawPolicy: 'randomEachRound', specialRules: ['shootOut'] }),
  germanMasters: tiered(),
  worldOpen: knockout(64, [9, 9, 9, 9, 11, 19], { entryTiers: [], seedingModel: '64 winners of the attached one-round qualifier. Held-over qualifiers are consolidated in the qualifying event.' }),
  worldChampionshipQualifying: rounds([...Q.slice(0, 3), 'Judgement Day'], 19, { qualifiers: 16, seedOffset: 16 }),
  worldChampionshipMain: knockout(32, [19, 25, 25, 33, 35]),
  playersSeriesTop32: knockout(32, [9, 9, 9, 11, 19]),
  playersSeriesTop16: knockout(16, [11, 11, 11, 19]),
  tourChampionshipTop8: rounds(['Round One', 'Quarter Final', 'Semi Final', 'Final'], 19),
  championOfChampions: rounds(['Group Semi Final', 'Group Final', 'Semi Final', 'Final'], [7, 11, 11, 19]),
  championshipLeagueInvitational: rounds(inviteStages, 5, { groupMode: 'invitational', entryTiers: [], fieldSize: 25 }),
  eliteInvitational: knockout(16, [11, 11, 11, 19]),
  eliteInvitationalQualifier: knockout(32, [7, 7, 9, 11, 11]),
  seniorRegularEvent: knockout(64, 7),
  britishSeniorsOpen: knockout(8, [7, 9, 13]),
  seniorGoldenTicket: knockout(16, 7),
  worldSeniorsChampionship: rounds(['Round One', ...KO.slice(3)], [7, 7, 7, 13, 19], { specialRules: ['blackBallDecider'] }),
  seniorEvent: knockout(16, 7),
  legendsEvent: knockout(16, 7),
  exhibition: knockout(16, [3, 3, 3, 5]),
} satisfies Record<string, Rules>;

// These are authored pathway competitions: honour their individual advertised lengths.
export const calendarRuleOverrides: Record<string, Partial<Profile>> = {
  "Saturday Junior Handicap": {
    "specialRules": ["handicap"],
    "roundBestOf": {
      "Last 16": 3,
      "Quarter Final": 3,
      "Semi Final": 3,
      "Final": 3
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Local Under-16 Open": {
    "roundBestOf": {
      "Last 16": 3,
      "Quarter Final": 3,
      "Semi Final": 3,
      "Final": 3
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Town Junior Championship": {
    "roundBestOf": {
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Christmas Club Classic": {
    "roundBestOf": {
      "Last 16": 3,
      "Quarter Final": 3,
      "Semi Final": 3,
      "Final": 3
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Local Champion of Champions": {
    "roundBestOf": {
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Regional Junior Series 1": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "County Under-18 Open": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Regional Junior Series 2": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Regional Youth Masters": {
    "roundBestOf": {
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "County Youth Championship": {
    "roundBestOf": {
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Regional Junior Series Finals": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules",
    "fieldSize": 32,
    "roundStructure": [
      "Last 32",
      "Last 16",
      "Quarter Final",
      "Semi Final",
      "Final"
    ]
  },
  "National Under-16 Championship": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Junior Series 1": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Under-18 Open": {
    "roundBestOf": {
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Junior Invitational Cup": {
    "roundBestOf": {
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Junior Series 2": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Under-21 Championship": {
    "roundBestOf": {
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Summer Amateur Open": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Amateur Series 1": {
    "roundBestOf": {
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Pro-Am Challenge North": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Elite Amateur Masters": {
    "roundBestOf": {
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Pro-Am Challenge South": {
    "roundBestOf": {
      "Last 32": 5,
      "Last 16": 5,
      "Quarter Final": 5,
      "Semi Final": 5,
      "Final": 5
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Amateur Tour Finals": {
    "roundBestOf": {
      "Last 16": 9,
      "Quarter Final": 9,
      "Semi Final": 9,
      "Final": 9
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Asia Pacific - Event 3": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Middle East - Event 1": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Middle East - Event 2": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Asia Pacific - Event 4": {
    "roundBestOf": {
      "Last 128": 9,
      "Last 64": 9,
      "Last 32": 9,
      "Last 16": 9,
      "Quarter Final": 9,
      "Semi Final": 9,
      "Final": 9
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Americas - Event 3": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Middle East - Event 3": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "Middle East - Event 4": {
    "roundBestOf": {
      "Last 128": 7,
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 7
    },
    "sourceStatus": "Game-authored event rules"
  },
  "National Amateur Championship": {
    "roundBestOf": {
      "Last 64": 7,
      "Last 32": 7,
      "Last 16": 7,
      "Quarter Final": 7,
      "Semi Final": 7,
      "Final": 9
    },
    "sourceStatus": "Game-authored event rules"
  }
};

// Regional event packs override the former catch-all Q Tour format.
Object.assign(calendarRuleOverrides, {
  'Asia Pacific - Event 1': rounds(['Round One', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'], [7,7,7,7,7,9], { fieldSize: 48, entryTiers: [{ through: 16, round: 'Last 32' }], sourceStatus: 'West Coast International: published 48-player venue limit; latest match-length baseline' }),
  'Asia Pacific - Event 3': knockout(128, [5,5,5,5,5,5,7], { sourceStatus: '2026 Fred Osbourne Classic entry pack; main event only' }),
  'Asia Pacific - Event 4': knockout(128, [7,7,7,7,7,9,11], { sourceStatus: '2026 Bob Hawke Australian Open entry pack' }),
  'Americas - Event 3': rounds(['Round One', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'], 7, { fieldSize: 48, entryTiers: [{ through: 16, round: 'Last 32' }], sourceStatus: 'PABSA 2025/26 North America pack: 48 entrants, all matches best of seven; game allocates 16 first-round byes by ranking' }),
  'Americas - Event 4': rounds(['Round One', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'], 7, { fieldSize: 48, entryTiers: [{ through: 16, round: 'Last 32' }], sourceStatus: 'PABSA 2025/26 North America pack; provisional for next season' }),
});

calendarRuleOverrides['Asia Pacific - Event 2'] = rounds(['Group Stage', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'], [5,7,7,7,9], { fieldSize: 40, groupSize: 5, groupMode: 'amateur', entryTiers: [], seedingModel: 'Eight groups of five, top two to the Last 16.', sourceStatus: 'NZ Open: published group-to-knockout format and knockout lengths; game uses 40 accepted entrants and best-of-five groups' });
