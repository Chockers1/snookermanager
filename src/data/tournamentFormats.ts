import { auditedRules, calendarRuleOverrides } from './tournamentRules'
import type { Tournament } from '../types/game'

export type TournamentFormatProfile = {
  groupSize?: number
  groupMode?: 'ranking' | 'amateur' | 'league' | 'invitational'
  qualifiers?: number
  seedOffset?: number
  entryTiers?: { through: number; round: string }[]
  drawPolicy?: 'seeded' | 'randomEachRound'
  specialRules?: string[]
  sourceStatus?: string

  id: string
  displayName: string
  tournamentClass: string
  reportingClass: string
  eligibleBands: string[]
  fieldSize: number | null
  minFieldSize: number | null
  maxFieldSize: number | null
  seedingModel: string
  entryRoutes: string[]
  roundStructure: string[]
  frameFormat: string[]
  rankingImpact: string
  prizeTier: string
  calendarWindow: string
  validationRules: string[]
  pathwayImpact: string
  expectedPlayerVolume: string
  roundBestOf?: Partial<Record<string, number>>
  formatFamily: 'youth' | 'amateur' | 'qTour' | 'qSchool' | 'proQualifier' | 'proEvent' | 'major' | 'invitational' | 'senior' | 'exhibition' | 'administrative'
}

type TournamentFormatLookup = Pick<Tournament, 'name' | 'type' | 'eventClass' | 'rankingType' | 'stageId' | 'formatId'>

const YOUTH_SHORT = [
  'Early rounds: best of 3',
  'Quarter-finals: best of 5',
  'Semi-finals: best of 5',
  'Final: best of 7',
]

const YOUTH_NATIONAL = [
  'Early rounds: best of 5',
  'Quarter-finals: best of 5',
  'Semi-finals: best of 5',
  'Final: best of 7',
]

const AMATEUR_STANDARD = [
  'Early rounds: best of 5',
  'Semi-finals: best of 7',
  'Final: best of 7 or 9',
]

const AMATEUR_ELITE = [
  'Early rounds: best of 5',
  'Quarter-finals: best of 7',
  'Semi-finals: best of 7',
  'Final: best of 9',
]

const WSF_OPEN_FORMAT = [
  'Open amateur championship route for eligible non-tour players',
  'Straight knockout with international amateur field',
  'Champion earns a two-year World Snooker Tour card',
  'Early rounds: best of 5 or 7',
  'Final: best of 9',
]

const WSF_JUNIOR_FORMAT = [
  'Junior amateur championship route for eligible non-tour players',
  'Straight knockout with international under-21 field',
  'Champion earns a two-year World Snooker Tour card',
  'Early rounds: best of 5',
  'Final: best of 7 or 9',
]

const EBSA_YOUTH_FORMAT = [
  'European age-group amateur championship',
  'Under-age eligibility applies at entry',
  'Builds federation recognition, amateur ranking strength, and Q Tour readiness',
  'Knockout matches normally best of 5 or 7',
]

const EBSA_CARD_ROUTE_FORMAT = [
  'European amateur championship route for eligible non-tour players',
  'Recognized federation qualification pathway',
  'Champion or nominated route winner can earn a two-year World Snooker Tour card',
  'Early rounds: best of 5 or 7',
  'Final: best of 9',
]

const FEDERATION_CARD_ROUTE_FORMAT = [
  'Regional federation qualification route for eligible non-tour players',
  'Open to the relevant regional amateur pathway',
  'Winner or federation nominee can earn a two-year World Snooker Tour card',
  'Knockout matches normally best of 5 or 7',
]

const Q_TOUR_FORMAT = [
  'Season-long second-tier pathway for eligible non-tour players',
  'Q Tour Europe has seven ranking events',
  'Top-ranked eligible Q Tour Europe player earns a two-year World Snooker Tour card',
  'Leading European and regional players qualify for the Q Tour Global Play-Off',
]

const Q_TOUR_EUROPE_FORMAT = [
  'Q Tour Europe ranking event',
  'Top 64 seeds enter at the Last 128 stage',
  'Event 1 seeds are based on the Q School Europe Order of Merit',
  'Events 2-7 seeds are based on the Q Tour Europe ranking list',
  'Preliminary rounds up to and including Last 256: best of 5',
  'Last 128 through Final: best of 7',
]

const Q_TOUR_REGIONAL_FORMAT = [
  'Regional Q Tour event feeding the Global Play-Off pathway',
  'Regional series include Americas, Asia-Pacific, and Middle East events',
  'Leading regional players qualify for the Q Tour Global Play-Off',
  'Regional eligibility and residency rules apply outside Europe',
  'Knockout match lengths vary by regional event rules, normally best of 7 or 9',
]

const Q_TOUR_GLOBAL_PLAYOFF_FORMAT = [
  '24-player Q Tour Global Play-Off',
  'Three sections of eight players',
  'Each section winner earns a two-year World Snooker Tour card',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final / card-winning match: best of 19',
]

const Q_SCHOOL_FORMAT = [
  'Direct professional-tour qualifying route for non-tour players',
  'All rounds: best of 7',
  'Card-winning round depends on route',
  'Q School Order of Merit uses frame wins for top-up and seeding value',
]

const Q_SCHOOL_UK_EUROPE_FORMAT = [
  'UK / Europe Q School direct professional-tour qualifying event',
  'Two separate knockout events at Mattioli Arena, Leicester',
  'No listed maximum field; draw size depends on accepted entries',
  '64 seeded players protected apart until the Last 64',
  'Four semi-finalists in each event earn two-year World Snooker Tour cards',
  'Players who win a card in Event 1 are removed from Event 2',
  'All matches: best of 7',
]

const Q_SCHOOL_ASIA_OCEANIA_FORMAT = [
  'Asia-Oceania Q School regional professional-tour qualifying event',
  'Two separate knockout events at Kiatthada Billiards & Snooker Club, Bangkok',
  'Maximum field: 128 players',
  'Citizens of Asian and Oceania countries only',
  'Two finalists in each event earn two-year World Snooker Tour cards',
  'No normal seeding; dropped-off tour players are kept apart in opening rounds',
  'All matches: best of 7',
]

const QUALIFIER_FORMAT = [
  'Early rounds: best of 7',
  'Final qualifying round: best of 9',
]

const CHAMPIONSHIP_LEAGUE_RANKING_FORMAT = [
  'Stage One: 32 groups of four, best of 4',
  'Stage Two: eight groups of four, best of 4',
  'Stage Three: two groups of four, best of 4',
  'Final: best of 5',
]

const STANDARD_RANKING_FORMAT = [
  'Early rounds: best of 7',
  'Last 32 / Last 16: best of 7 or 9',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 17 or 19',
]

const HOME_NATIONS_FORMAT = [
  'Qualifying round 1: seeds 65-96 versus 97+',
  'Qualifying round 2: winners versus seeds 33-64',
  'Last 64: top 32 enter',
  'Last 64 to Last 16: best of 7',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 17',
]

const INTERNATIONAL_RANKING_FORMAT = [
  'Full-field first round or held-over opening match',
  'Last 128 to quarter-finals: best of 9',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const SHANGHAI_MASTERS_FORMAT = [
  '24 invited players: top 16 plus four highest Chinese outside top 16 plus four Chinese wildcards',
  'Top 8 enter at Last 16',
  'Round 1 to quarter-finals: best of 11',
  'Semi-finals: best of 19',
  'Final: best of 21',
]

const SAUDI_ARABIA_MASTERS_FORMAT = [
  '144-player route with wildcards and top-ups',
  'Round 1: seeds 81+ enter; Round 2: seeds 49-80 enter; Round 3: seeds 17-48 enter',
  'Round 4 qualifies players for Last 32; top 16 enter Last 32',
  'Rounds 1-3: best of 7; Round 4 and Last 32: best of 9',
  'Last 16 to semi-finals: best of 11',
  'Final: best of 19',
]

const BRITISH_OPEN_FORMAT = [
  '128-player full-field event',
  'Random draw every round with no seeding protection or byes',
  'Last 128 to Last 16: best of 7',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const UK_MAJOR_FORMAT = [
  'Last 32 main stage: top 16 automatic plus 16 qualifiers',
  'Last 32 to semi-finals: best of 11',
  'Quarter-finals: best of 11',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const UK_MAJOR_QUALIFYING_FORMAT = [
  '128-player qualifying draw for 16 main-stage places',
  'Qualifying round 1: seeds 81-112 versus seeds 113-144 / amateurs',
  'Qualifying round 2: winners versus seeds 49-80',
  'Qualifying round 3: winners versus seeds 17-48',
  'Qualifying round 4: winners play for 16 York places',
  'All qualifying rounds: best of 11',
]

const MASTERS_FORMAT = [
  'First round: best of 11',
  'Quarter-finals: best of 11',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const RIYADH_SEASON_FORMAT = [
  '12 invited players: defending champion, world champion, eight highest ranked, two Saudi wildcards',
  'Seeds 9-10 start against wildcards; winners play seeds 7-8; top seeds enter later',
  'All matches except final: best of 7',
  'Final: best of 9',
]

const SHOOT_OUT_FORMAT = [
  '128-player random knockout',
  'One-frame matches with a 10-minute limit',
  'Shot clock and blue-ball shoot-out rules',
]

const GERMAN_MASTERS_FORMAT = [
  '128-player tiered qualifying draw',
  'Top 32 enter qualifying round 3',
  'Top 16 qualifying round 3 matches are held over to Berlin',
  'Qualifying and round 1 to quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const WORLD_QUALIFYING_FORMAT = [
  '128-player qualifying draw for 16 Crucible places',
  'Qualifying round 1: seeds 81-112 versus seeds 113-144 / amateurs',
  'Qualifying round 2: winners versus seeds 49-80',
  'Qualifying round 3: winners versus seeds 17-48',
  'Judgement Day: winners play for 16 Crucible places',
  'All qualifying rounds: best of 19',
]

const WORLD_MAIN_FORMAT = [
  'Last 32: best of 19',
  'Last 16: best of 25',
  'Quarter-finals: best of 25',
  'Semi-finals: best of 33',
  'Final: best of 35',
]

const PLAYERS_SERIES_SHORT = [
  'Early rounds: best of 7 or 9',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const PLAYERS_SERIES_LONG = [
  'Early rounds: best of 11',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const TOUR_CHAMPIONSHIP_FORMAT = [
  '12-player one-year ranking field',
  'Seeds 1-4 receive quarter-final byes',
  'Seeds 5-8 play seeds 9-12 in round one',
  'Quarter-finals: best of 19',
  'Semi-finals: best of 19',
  'Final: best of 19',
]

const CHAMPION_OF_CHAMPIONS_FORMAT = [
  'Group semi-final: best of 7',
  'Group final: best of 11',
  'Semi-final: best of 11',
  'Final: best of 19',
]

const CHAMPIONSHIP_LEAGUE_INVITATIONAL_FORMAT = [
  '25 invited players',
  'Rolling groups of seven',
  'Group winners qualify for the Winners Group',
  'All matches: best of 5',
]

const SENIOR_FORMAT = [
  'World Seniors Tour regular ranking event',
  'Open entry for eligible off-main-tour players aged 40+',
  'Typical field: 33-57 accepted entries; game cap 128',
  'All matches: best of 7',
  'Ranking list uses frames won',
]

const BRITISH_SENIORS_OPEN_FORMAT = [
  'Eight invited senior players',
  'Quarter-finals: best of 7',
  'Semi-finals: best of 9',
  'Final: best of 13',
  'Prestige and seeding impact; no World Snooker Tour card awarded',
]

const SENIOR_GOLDEN_TICKET_FORMAT = [
  'Sixteen senior ranking-list players',
  'Winner earns the final World Seniors Championship place',
  'All matches: best of 7',
]

const WORLD_SENIORS_CHAMPIONSHIP_FORMAT = [
  'Twenty-four-player World Seniors Championship',
  'Top eight seeds enter at the Last 16 stage',
  'Other qualifiers play the opening round',
  'First round to quarter-finals: best of 7',
  'Semi-finals: best of 13',
  'Final: best of 19',
]

const EXHIBITION_FORMAT = [
  'Short format',
  'Best of 3, 5, or shootout style',
  'No normal ranking impact',
]

const ROUND_BEST_OF_STANDARD_RANKING = {
  'Last 16': 9,
  'Quarter Final': 9,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_HOME_NATIONS = {
  'Last 16': 7,
  'Quarter Final': 9,
  'Semi Final': 11,
  Final: 17,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_UK_MAJOR = {
  'Last 16': 11,
  'Quarter Final': 11,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_MASTERS = {
  'Last 16': 11,
  'Quarter Final': 11,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_WORLD_MAIN = {
  'Last 16': 25,
  'Quarter Final': 25,
  'Semi Final': 33,
  Final: 35,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_PLAYERS_TOP32 = {
  'Last 16': 9,
  'Quarter Final': 9,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_PLAYERS_TOP16 = {
  'Last 16': 11,
  'Quarter Final': 11,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_CHAMPION_OF_CHAMPIONS = {
  'Last 16': 7,
  'Quarter Final': 11,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_SHANGHAI_MASTERS = {
  'Last 16': 11,
  'Quarter Final': 11,
  'Semi Final': 19,
  Final: 21,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_SHORT_FINAL = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 7,
  Final: 9,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_SHOOT_OUT = {
  'Last 128': 1,
  'Last 64': 1,
  'Last 32': 1,
  'Last 16': 1,
  'Quarter Final': 1,
  'Semi Final': 1,
  Final: 1,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_CHAMPIONSHIP_LEAGUE = {
  'Stage One Groups': 4,
  'Stage Two Groups': 4,
  'Stage Three Groups': 4,
  'Last 16': 4,
  'Quarter Final': 4,
  'Semi Final': 4,
  Final: 5,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_Q_SCHOOL = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 7,
  Final: 7,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_Q_TOUR_EUROPE = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 7,
  Final: 7,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_Q_TOUR_REGIONAL = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 7,
  Final: 9,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_Q_TOUR_GLOBAL_PLAYOFF = {
  'Last 16': 9,
  'Quarter Final': 9,
  'Semi Final': 11,
  Final: 19,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_SENIOR_REGULAR = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 7,
  Final: 7,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_BRITISH_SENIORS_OPEN = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 9,
  Final: 13,
} satisfies Partial<Record<string, number>>

const ROUND_BEST_OF_WORLD_SENIORS = {
  'Last 16': 7,
  'Quarter Final': 7,
  'Semi Final': 13,
  Final: 19,
} satisfies Partial<Record<string, number>>

const FORMAT_PROFILES = {
  juniorLocal: {
    id: 'juniorLocal',
    displayName: 'Junior Local Event',
    tournamentClass: 'Youth Pathway Event',
    reportingClass: 'youth',
    eligibleBands: ['Youth'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by youth ranking, age group, and local reputation.',
    entryRoutes: ['Local junior entry', 'School and club league qualifiers'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: YOUTH_SHORT,
    rankingImpact: 'Youth ranking only; small confidence and reputation gains.',
    prizeTier: 'Local youth',
    calendarWindow: 'July-April youth circuit',
    validationRules: ['Must stay youth-only', 'Must not award world ranking points'],
    pathwayImpact: 'Builds junior match volume and local reputation.',
    expectedPlayerVolume: '16-player local junior field',
    formatFamily: 'youth',
  },
  juniorRegional: {
    id: 'juniorRegional',
    displayName: 'Regional Junior Event',
    tournamentClass: 'Youth Pathway Event',
    reportingClass: 'youth',
    eligibleBands: ['Youth'],
    fieldSize: 32,
    minFieldSize: 24,
    maxFieldSize: 32,
    seedingModel: 'Seed by regional youth ranking and county results.',
    entryRoutes: ['Regional ranking qualification', 'County allocations'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: YOUTH_SHORT,
    rankingImpact: 'Youth ranking only; medium confidence and reputation gains.',
    prizeTier: 'Regional youth',
    calendarWindow: 'August-April regional pathway',
    validationRules: ['Target 24-32 players', 'Must use youth frame lengths'],
    pathwayImpact: 'Feeds national youth seeding and reputation.',
    expectedPlayerVolume: '24-32 youth entrants',
    formatFamily: 'youth',
  },
  juniorNational: {
    id: 'juniorNational',
    displayName: 'National Youth Championship',
    tournamentClass: 'Youth Pathway Event',
    reportingClass: 'youth',
    eligibleBands: ['Youth'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Seed by national youth ranking, age group, and reputation.',
    entryRoutes: ['National youth ranking', 'Regional qualification'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: YOUTH_NATIONAL,
    rankingImpact: 'Youth ranking only; large confidence and reputation gains.',
    prizeTier: 'National youth',
    calendarWindow: 'August-March national pathway',
    validationRules: ['Must stay youth-only', 'Must not use pro-length finals'],
    pathwayImpact: 'Defines national youth pecking order and elite amateur readiness.',
    expectedPlayerVolume: '32 youth entrants',
    formatFamily: 'youth',
  },
  juniorInvitationalCup: {
    id: 'juniorInvitationalCup',
    displayName: 'Junior Invitational Cup',
    tournamentClass: 'Youth Pathway Event',
    reportingClass: 'youth',
    eligibleBands: ['Youth'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Invite and seed by youth ranking, titles, and reputation.',
    entryRoutes: ['Invite for event winners and top-ranked juniors'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: YOUTH_NATIONAL,
    rankingImpact: 'Youth ranking and reputation only.',
    prizeTier: 'National youth invitational',
    calendarWindow: 'December-April junior invitational window',
    validationRules: ['Must stay youth-only', 'Must remain short-format'],
    pathwayImpact: 'Rewards junior titles and boosts elite youth reputation.',
    expectedPlayerVolume: '16 invited juniors',
    formatFamily: 'youth',
  },
  juniorSeasonFinals: {
    id: 'juniorSeasonFinals',
    displayName: 'Youth Season Finals',
    tournamentClass: 'Youth Pathway Event',
    reportingClass: 'youth',
    eligibleBands: ['Youth'],
    fieldSize: 16,
    minFieldSize: 8,
    maxFieldSize: 16,
    seedingModel: 'Seed by season-long youth ranking and event results.',
    entryRoutes: ['Season-ranking qualification'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: YOUTH_NATIONAL,
    rankingImpact: 'Youth ranking and reputation only.',
    prizeTier: 'Youth finals',
    calendarWindow: 'Late-season youth finals block',
    validationRules: ['Should be 8 or 16 players', 'Must remain youth format'],
    pathwayImpact: 'Closes the youth season and seeds the next tier.',
    expectedPlayerVolume: '8-16 qualified juniors',
    formatFamily: 'youth',
  },
  amateurOpen: {
    id: 'amateurOpen',
    displayName: 'Amateur Open / Pro-Am',
    tournamentClass: 'Amateur Pathway Event',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Youth', 'Q Tour', 'Q School'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Seed by amateur ranking, recent results, and reputation.',
    entryRoutes: ['Open amateur entry', 'Pro-am invitation where applicable'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: AMATEUR_STANDARD,
    rankingImpact: 'Amateur ranking and Q Tour / Q School eligibility only.',
    prizeTier: 'National amateur',
    calendarWindow: 'Summer-spring amateur circuit',
    validationRules: ['Must not award world ranking points', 'Should stay off-tour focused'],
    pathwayImpact: 'Builds amateur ranking and off-tour pathway score.',
    expectedPlayerVolume: '32 amateur or pro-am entrants',
    formatFamily: 'amateur',
  },
  amateurSeries: {
    id: 'amateurSeries',
    displayName: 'National Amateur Series',
    tournamentClass: 'Amateur Pathway Event',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour', 'Q School'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 64,
    seedingModel: 'Seed by amateur ranking, recent results, and reputation.',
    entryRoutes: ['National amateur ranking', 'Open amateur allocation'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: AMATEUR_STANDARD,
    rankingImpact: 'Amateur ranking and off-tour pathway score only.',
    prizeTier: 'National amateur series',
    calendarWindow: 'National amateur series block',
    validationRules: ['Should be 64 players', 'Must not use pro-length finals'],
    pathwayImpact: 'Feeds elite amateur seeding and Q Tour readiness.',
    expectedPlayerVolume: '64 amateur entrants',
    formatFamily: 'amateur',
  },
  amateurChampionship: {
    id: 'amateurChampionship',
    displayName: 'National Amateur Championship',
    tournamentClass: 'Amateur Pathway Event',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour', 'Q School'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 64,
    seedingModel: 'Seed by amateur ranking, reputation, and recent championship form.',
    entryRoutes: ['National amateur championship qualification'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: AMATEUR_ELITE,
    rankingImpact: 'Amateur ranking, Q Tour seeding, and Q School score.',
    prizeTier: 'Amateur championship',
    calendarWindow: 'Late-autumn amateur major block',
    validationRules: ['Should be 64 players', 'Must remain non-world-ranking'],
    pathwayImpact: 'Major amateur prestige and Q Tour / Q School leverage.',
    expectedPlayerVolume: '64 amateur entrants',
    formatFamily: 'amateur',
  },
  eliteAmateur: {
    id: 'eliteAmateur',
    displayName: 'Elite Amateur Masters',
    tournamentClass: 'Amateur Pathway Event',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour'],
    fieldSize: 32,
    minFieldSize: 16,
    maxFieldSize: 32,
    seedingModel: 'Seed by amateur ranking, major results, and reputation.',
    entryRoutes: ['Invite top amateurs and leading Q Tour pathway players'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: AMATEUR_ELITE,
    rankingImpact: 'Amateur ranking and Q Tour / Q School pathway only.',
    prizeTier: 'Elite amateur invitational',
    calendarWindow: 'Mid-season elite amateur slot',
    validationRules: ['Should be 16-32 players', 'Must remain off-tour'],
    pathwayImpact: 'Rewards top amateur status and accelerates pre-pro progression.',
    expectedPlayerVolume: '16-32 elite amateurs',
    formatFamily: 'amateur',
  },
  amateurTourFinals: {
    id: 'amateurTourFinals',
    displayName: 'Amateur Tour Finals',
    tournamentClass: 'Amateur Pathway Event',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by amateur order of merit.',
    entryRoutes: ['Season-long amateur qualification'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: AMATEUR_ELITE,
    rankingImpact: 'Amateur ranking and pathway prestige only.',
    prizeTier: 'Amateur finals',
    calendarWindow: 'Late-season finals slot',
    validationRules: ['Must stay off-tour', 'Should be 16 players'],
    pathwayImpact: 'Closes the amateur season and feeds Q Tour / Q School seeding.',
    expectedPlayerVolume: '16 amateur finalists',
    formatFamily: 'amateur',
  },
  wsfJuniorChampionship: {
    id: 'wsfJuniorChampionship',
    displayName: 'WSF Junior Championship',
    tournamentClass: 'International Amateur Direct-Card Route',
    reportingClass: 'amateur',
    eligibleBands: ['Youth', 'Amateur', 'Q Tour'],
    fieldSize: 64,
    minFieldSize: 32,
    maxFieldSize: 128,
    seedingModel: 'Seed by junior amateur reputation, national federation standing, and recent international results.',
    entryRoutes: ['Eligible junior amateur entry', 'National federation recognition', 'International amateur acceptance'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: WSF_JUNIOR_FORMAT,
    rankingImpact: 'Amateur and youth ranking impact only; direct-card reward for the champion.',
    prizeTier: 'International amateur',
    calendarWindow: 'January international amateur block',
    validationRules: ['Must stay off-tour', 'Must ignore women route in this game model', 'Champion route can award a two-year card'],
    pathwayImpact: 'Gives elite juniors a direct World Snooker Tour card route and a major amateur reputation boost.',
    expectedPlayerVolume: '32-128 junior amateur entrants',
    formatFamily: 'amateur',
  },
  wsfOpenChampionship: {
    id: 'wsfOpenChampionship',
    displayName: 'WSF Open Championship',
    tournamentClass: 'International Amateur Direct-Card Route',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour', 'Q School'],
    fieldSize: 128,
    minFieldSize: 64,
    maxFieldSize: 256,
    seedingModel: 'Seed by international amateur ranking, Q Tour results, and federation standing.',
    entryRoutes: ['Open amateur entry for eligible non-tour players', 'National federation recognition', 'Q Tour and elite amateur entrants'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: WSF_OPEN_FORMAT,
    rankingImpact: 'Amateur pathway ranking only; direct-card reward for the champion.',
    prizeTier: 'International amateur',
    calendarWindow: 'January-February international amateur block',
    validationRules: ['Must stay off-tour', 'Must not include women route in this game model', 'Champion route can award a two-year card'],
    pathwayImpact: 'Creates a direct open amateur route to the professional tour while still improving Q Tour and Q School readiness.',
    expectedPlayerVolume: '64-256 international amateur entrants',
    formatFamily: 'amateur',
  },
  ebsaYouthChampionship: {
    id: 'ebsaYouthChampionship',
    displayName: 'EBSA Youth Championship',
    tournamentClass: 'European Amateur Youth Route',
    reportingClass: 'youth',
    eligibleBands: ['Youth', 'Amateur'],
    fieldSize: 64,
    minFieldSize: 32,
    maxFieldSize: 128,
    seedingModel: 'Seed by age-group reputation, national ranking, and federation standing.',
    entryRoutes: ['Age-group national federation entry', 'Eligible junior amateur entry'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: EBSA_YOUTH_FORMAT,
    rankingImpact: 'Youth and amateur pathway ranking only.',
    prizeTier: 'European youth amateur',
    calendarWindow: 'March EBSA championship block',
    validationRules: ['Must enforce age-group route', 'Must stay off-tour', 'Must not award normal world ranking points'],
    pathwayImpact: 'Builds European federation recognition and can lead toward U21/main amateur card routes.',
    expectedPlayerVolume: '32-128 European youth entrants',
    formatFamily: 'amateur',
  },
  ebsaCardRoute: {
    id: 'ebsaCardRoute',
    displayName: 'EBSA Direct-Card Route',
    tournamentClass: 'European Amateur Direct-Card Route',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour', 'Q School'],
    fieldSize: 128,
    minFieldSize: 64,
    maxFieldSize: 256,
    seedingModel: 'Seed by European amateur ranking, national federation status, and recent results.',
    entryRoutes: ['European amateur federation qualification', 'Eligible elite amateur entry'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: EBSA_CARD_ROUTE_FORMAT,
    rankingImpact: 'Amateur pathway ranking only; direct-card reward where WST nomination applies.',
    prizeTier: 'European amateur championship',
    calendarWindow: 'March EBSA championship block',
    validationRules: ['Must stay off-tour', 'Must not award normal world ranking points', 'Direct-card events award two-year cards through the route reward'],
    pathwayImpact: 'Adds a European federation card route alongside Q Tour and Q School.',
    expectedPlayerVolume: '64-256 European amateur entrants',
    formatFamily: 'amateur',
  },
  federationCardRoute: {
    id: 'federationCardRoute',
    displayName: 'Regional Federation Direct-Card Route',
    tournamentClass: 'Regional Amateur Direct-Card Route',
    reportingClass: 'amateur',
    eligibleBands: ['Amateur', 'Q Tour', 'Q School'],
    fieldSize: 64,
    minFieldSize: 16,
    maxFieldSize: 128,
    seedingModel: 'Seed by regional federation list, national ranking, and recent amateur results.',
    entryRoutes: ['Regional federation nomination', 'Eligible regional amateur entry', 'Q Tour regional pathway'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: FEDERATION_CARD_ROUTE_FORMAT,
    rankingImpact: 'Regional amateur pathway ranking only; direct-card reward for the route winner where applicable.',
    prizeTier: 'Regional federation qualifier',
    calendarWindow: 'Late-season federation qualification block',
    validationRules: ['Must stay off-tour', 'Must ignore women route in this game model', 'Must not award normal world ranking points'],
    pathwayImpact: 'Gives Asia-Pacific, Americas, and China-style federation pathways a player-facing route into the main tour.',
    expectedPlayerVolume: '16-128 regional amateur entrants',
    formatFamily: 'amateur',
  },
  qTourRegular: {
    id: 'qTourRegular',
    displayName: 'Q Tour Regular Event',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour', 'Amateur', 'Youth', 'Q School'],
    fieldSize: null,
    minFieldSize: 40,
    maxFieldSize: 256,
    seedingModel: 'Route-specific Q Tour seeding; Europe protects top 64 seeds into Last 128, regional routes seed by local series rules.',
    entryRoutes: ['Q Tour season entry', 'Off-tour amateur pathway access', 'Regional Q Tour eligibility'],
    roundStructure: ['Preliminary Rounds', 'Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_TOUR_FORMAT,
    rankingImpact: 'Q Tour ranking only; no normal world ranking points.',
    prizeTier: 'Q Tour standard',
    calendarWindow: 'June-March Q Tour pathway',
    validationRules: ['Must be off-tour only', 'Must feed Q Tour ranking or regional Global Play-Off qualification'],
    pathwayImpact: 'Feeds Q Tour ranking, Q Tour Global Play-Off qualification, Q School seeding, and direct card routes.',
    expectedPlayerVolume: 'Variable Q Tour field by region and entry cap',
    roundBestOf: ROUND_BEST_OF_Q_TOUR_REGIONAL,
    formatFamily: 'qTour',
  },
  qTourEuropeEvent: {
    id: 'qTourEuropeEvent',
    displayName: 'Q Tour Europe Event',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour', 'Amateur', 'Q School'],
    fieldSize: 128,
    minFieldSize: 64,
    maxFieldSize: 256,
    seedingModel: 'Top 64 seeds enter at Last 128; Event 1 seeds from Q School Europe OOM, later events from Q Tour Europe ranking.',
    entryRoutes: ['Q Tour Europe season entry', 'Eligible non-tour players in good standing'],
    roundStructure: ['Preliminary Rounds', 'Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_TOUR_EUROPE_FORMAT,
    rankingImpact: 'Q Tour Europe ranking; the top-ranked eligible player earns a two-year World Snooker Tour card.',
    prizeTier: 'Q Tour Europe',
    calendarWindow: 'June-March Q Tour Europe series',
    validationRules: ['Should have seven Europe events', 'Top 64 seeds enter at Last 128', 'Last 128 onward must be best of 7'],
    pathwayImpact: 'Season-long Europe ranking race for one automatic card plus Global Play-Off places.',
    expectedPlayerVolume: 'Up to 256 entries with 128-player main-stage structure',
    roundBestOf: ROUND_BEST_OF_Q_TOUR_EUROPE,
    formatFamily: 'qTour',
  },
  qTourRegionalEvent: {
    id: 'qTourRegionalEvent',
    displayName: 'Regional Q Tour Event',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour', 'Amateur', 'Regional Pathway'],
    fieldSize: null,
    minFieldSize: 12,
    maxFieldSize: 128,
    seedingModel: 'Regional Q Tour seeding and entry caps; leading players qualify for the Q Tour Global Play-Off.',
    entryRoutes: ['Americas Q Tour', 'Asia-Pacific Q Tour', 'Middle East Q Tour', 'Other regional federation routes'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_TOUR_REGIONAL_FORMAT,
    rankingImpact: 'Regional Q Tour ranking only; no normal world ranking points.',
    prizeTier: 'Regional Q Tour',
    calendarWindow: 'June-February regional Q Tour series',
    validationRules: ['Must be off-tour only', 'Must feed regional Global Play-Off qualification'],
    pathwayImpact: 'Regional season-long route into the 24-player Global Play-Off.',
    expectedPlayerVolume: 'Variable regional fields, up to 128',
    roundBestOf: ROUND_BEST_OF_Q_TOUR_REGIONAL,
    formatFamily: 'qTour',
  },
  qTourPlayoff: {
    id: 'qTourPlayoff',
    displayName: 'Q Tour Global Play-Off',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour'],
    fieldSize: 24,
    minFieldSize: 24,
    maxFieldSize: 24,
    seedingModel: 'Seed 24 qualifiers into three sections of eight, with section winners earning tour cards.',
    entryRoutes: ['Q Tour Europe ranking qualifiers', 'Regional Q Tour qualifiers', 'China pathway place where applicable'],
    roundStructure: ['Section Quarter Final', 'Section Semi Final', 'Section Final'],
    frameFormat: Q_TOUR_GLOBAL_PLAYOFF_FORMAT,
    rankingImpact: 'Q Tour ranking and direct card route only.',
    prizeTier: 'Q Tour playoff',
    calendarWindow: 'Late-season Q Tour playoff',
    validationRules: ['Must be off-tour only', 'Should be 24 players', 'Must award three two-year tour cards'],
    pathwayImpact: 'Awards three two-year tour cards to the winners of the three play-off sections.',
    expectedPlayerVolume: '24 Q Tour Global Play-Off qualifiers',
    roundBestOf: ROUND_BEST_OF_Q_TOUR_GLOBAL_PLAYOFF,
    formatFamily: 'qTour',
  },
  qSchoolEvent: {
    id: 'qSchoolEvent',
    displayName: 'Q School Event',
    tournamentClass: 'Q School Event',
    reportingClass: 'Q School',
    eligibleBands: ['Q School', 'Q Tour', 'Amateur'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Knockout route with route-specific seeding protection for dropped-off professionals and leading Q School Order of Merit players.',
    entryRoutes: ['Direct Q School entry for eligible non-tour players', 'Former professionals trying to regain a card', 'International and amateur entries in good standing'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_SCHOOL_FORMAT,
    rankingImpact: 'Q School Order of Merit uses frame wins for top-up and pathway seeding; no normal world ranking points.',
    prizeTier: 'Q School',
    calendarWindow: 'May-June qualification block',
    validationRules: ['Must be off-tour only', 'All matches must be best of 7', 'Must not award normal world ranking points'],
    pathwayImpact: 'Awards two-year tour cards at the route-specific card-winning round or Order-of-Merit top-up value.',
    expectedPlayerVolume: 'Route-specific Q School field',
    roundBestOf: ROUND_BEST_OF_Q_SCHOOL,
    formatFamily: 'qSchool',
  },
  qSchoolUkEuropeEvent: {
    id: 'qSchoolUkEuropeEvent',
    displayName: 'UK / Europe Q School Event',
    tournamentClass: 'Q School Event',
    reportingClass: 'Q School',
    eligibleBands: ['Q School', 'Q Tour', 'Amateur', 'Former Professional'],
    fieldSize: null,
    minFieldSize: 128,
    maxFieldSize: null,
    seedingModel: '64 seeded players, including dropped-off professionals and leading Q School OOM players, are protected apart until the Last 64.',
    entryRoutes: ['Eligible non-tour players in good standing', 'Former professionals', 'Amateurs', 'Young players', 'International players'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_SCHOOL_UK_EUROPE_FORMAT,
    rankingImpact: 'Q School Order of Merit uses frame wins for top-up and future seeding; no normal world ranking points.',
    prizeTier: 'Q School',
    calendarWindow: 'May-June UK / Europe Q School block',
    validationRules: ['Two UK / Europe events', 'Four semi-finalists per event win cards', 'All matches best of 7', 'Remove Event 1 card winners from Event 2'],
    pathwayImpact: 'Each event awards four two-year World Snooker Tour cards by winning their quarter-final.',
    expectedPlayerVolume: 'Open UK / Europe accepted-entry field with no listed maximum',
    roundBestOf: ROUND_BEST_OF_Q_SCHOOL,
    formatFamily: 'qSchool',
  },
  qSchoolAsiaOceaniaEvent: {
    id: 'qSchoolAsiaOceaniaEvent',
    displayName: 'Asia-Oceania Q School Event',
    tournamentClass: 'Q School Event',
    reportingClass: 'Q School',
    eligibleBands: ['Q School', 'Q Tour', 'Amateur', 'Asia-Oceania Regional'],
    fieldSize: 128,
    minFieldSize: 16,
    maxFieldSize: 128,
    seedingModel: 'No normal seeding; Asian and Oceanian players dropped off the main tour are placed randomly but kept apart in opening rounds.',
    entryRoutes: ['Citizens of Asian and Oceania countries only', 'Eligible regional non-tour players', 'Dropped-off regional professionals'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_SCHOOL_ASIA_OCEANIA_FORMAT,
    rankingImpact: 'Q School Order of Merit uses frame wins for top-up and future seeding; no normal world ranking points.',
    prizeTier: 'Q School',
    calendarWindow: 'May-June Asia-Oceania Q School block',
    validationRules: ['Two Asia-Oceania events', 'Two finalists per event win cards', 'Maximum 128 players', 'All matches best of 7'],
    pathwayImpact: 'Each event awards two two-year World Snooker Tour cards by winning their semi-final.',
    expectedPlayerVolume: 'Up to 128 Asia-Oceania entrants',
    roundBestOf: ROUND_BEST_OF_Q_SCHOOL,
    formatFamily: 'qSchool',
  },
  qSchoolReview: {
    id: 'qSchoolReview',
    displayName: 'Q School Order of Merit Review',
    tournamentClass: 'Q School Administrative Review',
    reportingClass: 'Q School',
    eligibleBands: ['Q School'],
    fieldSize: null,
    minFieldSize: null,
    maxFieldSize: null,
    seedingModel: 'Administrative ranking review only.',
    entryRoutes: ['Automatic from completed Q School season'],
    roundStructure: ['Administrative Review'],
    frameFormat: ['No matches played'],
    rankingImpact: 'Q School order of merit review only.',
    prizeTier: 'Administrative',
    calendarWindow: 'End-of-Q-School review window',
    validationRules: ['Must not create matches', 'Must not award normal ranking points'],
    pathwayImpact: 'Finalizes top-up carding and playoff routes.',
    expectedPlayerVolume: 'Administrative review only',
    formatFamily: 'administrative',
  },
  rookieQualifier: {
    id: 'rookieQualifier',
    displayName: 'Rookie Pro Qualifier',
    tournamentClass: 'Professional Qualifier',
    reportingClass: 'qualifying',
    eligibleBands: ['Rookie Pro', 'Bottom Tour 65-128'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 64,
    seedingModel: 'Seed by world ranking; bottom-tour and rookie routes face hard draws early.',
    entryRoutes: ['Main-tour survival route'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: QUALIFIER_FORMAT,
    rankingImpact: 'World ranking and one-year ranking route points.',
    prizeTier: 'Professional qualifier',
    calendarWindow: 'Early-season qualifier block',
    validationRules: ['Must stay pro-only', 'Should be 64 players'],
    pathwayImpact: 'Provides survival volume to rookies and bottom-tour players.',
    expectedPlayerVolume: '64 professional qualifiers',
    formatFamily: 'proQualifier',
  },
  proQualifier: {
    id: 'proQualifier',
    displayName: 'Professional Ranking Qualifier',
    tournamentClass: 'Professional Qualifier',
    reportingClass: 'qualifying',
    eligibleBands: ['Top 17-128', 'Bottom Tour 65-128', 'Rookie Pro'],
    fieldSize: 96,
    minFieldSize: 64,
    maxFieldSize: 96,
    seedingModel: 'Seed by world ranking; higher-ranked players are protected deeper.',
    entryRoutes: ['Main-tour qualifying access'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: QUALIFIER_FORMAT,
    rankingImpact: 'World ranking and one-year ranking route points.',
    prizeTier: 'Professional qualifier',
    calendarWindow: 'Season-long attached qualifier slots',
    validationRules: ['Should be 64-96 players', 'Must stay pro-only'],
    pathwayImpact: 'Feeds ranking-event main draws and survival routes.',
    expectedPlayerVolume: '64-96 professional qualifiers',
    formatFamily: 'proQualifier',
  },
  standardRanking: {
    id: 'standardRanking',
    displayName: 'Standard Ranking Event',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour', 'Top 64', 'Bottom Tour 65-128'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 128,
    seedingModel: 'Top 16 protected early; Top 32 partially protected; lower ranks can draw elite players early.',
    entryRoutes: ['Main draw from main-tour status', 'Qualifier feeders if attached'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: STANDARD_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with full prize money.',
    prizeTier: 'Ranking event',
    calendarWindow: 'Core professional season',
    validationRules: ['Must award world ranking points', 'Must use professional structure'],
    pathwayImpact: 'Main tour ranking, survival, and sponsor progression.',
    expectedPlayerVolume: '64-player main event with qualifiers or 128 full-field route',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  championshipLeagueRanking: {
    id: 'championshipLeagueRanking',
    displayName: 'Championship League Ranking Event',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Seed into 32 groups of four; group winners progress through two more group stages before the final.',
    entryRoutes: ['Main-tour field', 'Ranking-event top-ups if required'],
    roundStructure: ['Stage One Groups', 'Stage Two Groups', 'Stage Three Groups', 'Final'],
    frameFormat: CHAMPIONSHIP_LEAGUE_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with short group-match volatility.',
    prizeTier: 'Ranking event',
    calendarWindow: 'Early-season ranking block',
    validationRules: ['Should be 128 players', 'Must use group-stage short-match structure'],
    pathwayImpact: 'Broad main-tour volume and early-season ranking movement.',
    expectedPlayerVolume: '128-player group-stage ranking event',
    roundBestOf: ROUND_BEST_OF_CHAMPIONSHIP_LEAGUE,
    formatFamily: 'proEvent',
  },
  saudiArabiaMasters: {
    id: 'saudiArabiaMasters',
    displayName: 'Saudi Arabia Masters',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour', 'Wildcards', 'Top-ups'],
    fieldSize: 144,
    minFieldSize: 128,
    maxFieldSize: 144,
    seedingModel: 'Tiered entry: seeds 81+ enter round 1, 49-80 round 2, 17-48 round 3, top 16 enter Last 32.',
    entryRoutes: ['Main-tour field', 'Wildcards', 'Top-up entries'],
    roundStructure: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SAUDI_ARABIA_MASTERS_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with major-level prize pressure.',
    prizeTier: 'Premium ranking event',
    calendarWindow: 'Early-season international ranking block',
    validationRules: ['Should support 144 total entries', 'Top 16 must enter Last 32'],
    pathwayImpact: 'High-value ranking opportunity with staged protection by rank band.',
    expectedPlayerVolume: '144 total entries including wildcards and top-ups',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  wuhanOpen: {
    id: 'wuhanOpen',
    displayName: 'Wuhan Open',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour', 'Chinese Wildcards'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: '128-player field with no true automatic bye; selected opening matches may be held over.',
    entryRoutes: ['Main-tour field', 'Four Chinese wildcard entries'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: INTERNATIONAL_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points.',
    prizeTier: 'International ranking',
    calendarWindow: 'Autumn international ranking block',
    validationRules: ['Should be 128 players', 'Must not grant false top-16 automatic byes'],
    pathwayImpact: 'Full-field international ranking opportunity.',
    expectedPlayerVolume: '128 entries including four Chinese wildcards',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  britishOpen: {
    id: 'britishOpen',
    displayName: 'British Open',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Random draw every round with no seeding protection or byes.',
    entryRoutes: ['Main-tour full-field entry'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: BRITISH_OPEN_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with high draw volatility.',
    prizeTier: 'Ranking event',
    calendarWindow: 'Autumn professional ranking block',
    validationRules: ['Should randomize each round', 'Must not apply seeded byes'],
    pathwayImpact: 'Creates upset-heavy ranking churn and lower-rank opportunities.',
    expectedPlayerVolume: '128-player random-draw ranking event',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  xianGrandPrix: {
    id: 'xianGrandPrix',
    displayName: "Xi'an Grand Prix",
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: '128-player full-field route with held-over first-round handling where required.',
    entryRoutes: ['Main-tour full-field entry'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: INTERNATIONAL_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points.',
    prizeTier: 'International ranking',
    calendarWindow: 'International ranking block',
    validationRules: ['Should be 128 players', 'Must not grant automatic top-16 byes'],
    pathwayImpact: 'Full-field international ranking opportunity.',
    expectedPlayerVolume: '128-player full-field ranking event',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  homeNationsRanking: {
    id: 'homeNationsRanking',
    displayName: 'Home Nations Ranking Event',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 64,
    maxFieldSize: 128,
    seedingModel: 'Top 32 enter Last 64; seeds 65-96 face 97+ in Q1 and winners face seeds 33-64 in Q2.',
    entryRoutes: ['Top 32 direct to Last 64', 'Two-round qualifying route for lower-ranked tour players and top-ups'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: HOME_NATIONS_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with pro prize money.',
    prizeTier: 'Home Nations',
    calendarWindow: 'Autumn professional ranking block',
    validationRules: ['Should be 128 total entries', 'Top 32 must enter Last 64', 'Must award world ranking points'],
    pathwayImpact: 'Supports broad main-tour participation and ranking churn.',
    expectedPlayerVolume: '128 total entries with a Last 64 main stage',
    roundBestOf: ROUND_BEST_OF_HOME_NATIONS,
    formatFamily: 'proEvent',
  },
  internationalRanking: {
    id: 'internationalRanking',
    displayName: 'International Ranking Event',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 64,
    seedingModel: 'Seed by world ranking with top players separated early.',
    entryRoutes: ['64-player main draw fed by qualifiers'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: INTERNATIONAL_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with premium prize money.',
    prizeTier: 'International ranking',
    calendarWindow: 'Mid-season international swing',
    validationRules: ['Should be a 64-player main draw', 'Must award world ranking points'],
    pathwayImpact: 'Prestige ranking volume for established professionals.',
    expectedPlayerVolume: '64-player international main draw',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  internationalChampionship: {
    id: 'internationalChampionship',
    displayName: 'International Championship',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: '128-player route; no UK/World-style top-16 automatic main-stage bye.',
    entryRoutes: ['Main-tour full-field entry', 'Opening match to reach Last 64'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: [
      'Last 128 to quarter-finals: best of 11',
      'Semi-finals: best of 17',
      'Final: best of 19',
    ],
    rankingImpact: 'World ranking and one-year ranking points with long-match international prestige.',
    prizeTier: 'Premium international ranking',
    calendarWindow: 'Mid-season international block',
    validationRules: ['Should be 128 players', 'Must not treat top 16 as automatically qualified for a 32-player stage'],
    pathwayImpact: 'Long-format ranking opportunity for full-tour field.',
    expectedPlayerVolume: '128-player international ranking event',
    roundBestOf: {
      'Last 16': 11,
      'Quarter Final': 11,
      'Semi Final': 17,
      Final: 19,
    },
    formatFamily: 'proEvent',
  },
  ukMajorQualifying: {
    id: 'ukMajorQualifying',
    displayName: 'UK Major Qualifying',
    tournamentClass: 'Professional Qualifier',
    reportingClass: 'qualifying',
    eligibleBands: ['Top 17-128', 'Bottom Tour 65-128', 'Rookie Pro'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Top 16 automatically qualify for York Last 32; seeds 81-112 face 113-144 / amateurs, then 49-80, then 17-48, then Judgement-style card for 16 places.',
    entryRoutes: ['UK Championship four-round qualifying route'],
    roundStructure: ['Qualifying Round 1', 'Qualifying Round 2', 'Qualifying Round 3', 'Qualifying Round 4'],
    frameFormat: UK_MAJOR_QUALIFYING_FORMAT,
    rankingImpact: 'World ranking and one-year route points into the UK major.',
    prizeTier: 'Major qualifier',
    calendarWindow: 'Pre-UK major qualifying block',
    validationRules: ['Should be 128 qualifying entries', 'Top 16 must be protected into York Last 32', 'All matches best of 11'],
    pathwayImpact: 'Feeds the UK major main draw and survival prestige.',
    expectedPlayerVolume: '128 qualifiers for 16 UK Championship main-stage places',
    formatFamily: 'proQualifier',
  },
  ukMajor: {
    id: 'ukMajor',
    displayName: 'UK Championship',
    tournamentClass: 'UK Championship',
    reportingClass: 'major',
    eligibleBands: ['Main Tour'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Top 16 automatically qualify for York Last 32 and are joined by 16 qualifiers.',
    entryRoutes: ['Top 16 direct to Last 32', '16 qualifiers from UK Championship qualifying'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: UK_MAJOR_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with major prestige.',
    prizeTier: 'Triple Crown style major',
    calendarWindow: 'December major slot',
    validationRules: ['Should be 32-player main stage', 'Top 16 direct entry', 'Must award ranking points'],
    pathwayImpact: 'Major prestige, ranking, reputation, and sponsor lift.',
    expectedPlayerVolume: '32-player York main stage after 144-player total route',
    roundBestOf: ROUND_BEST_OF_UK_MAJOR,
    formatFamily: 'major',
  },
  mastersInvitational: {
    id: 'mastersInvitational',
    displayName: 'Masters-style Invitational',
    tournamentClass: 'Elite Invitational',
    reportingClass: 'major',
    eligibleBands: ['Top 16'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Top 16 seeded in a 1 v 16 style or protected bracket draw.',
    entryRoutes: ['Top 16 only'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: MASTERS_FORMAT,
    rankingImpact: 'Major prestige only; non-ranking unless explicitly overridden.',
    prizeTier: 'Elite invitational major',
    calendarWindow: 'January elite invitational slot',
    validationRules: ['Must be 16 players', 'Must not create false world ranking by itself'],
    pathwayImpact: 'Major prestige, sponsor lift, and contender status.',
    expectedPlayerVolume: '16 elite professionals',
    roundBestOf: ROUND_BEST_OF_MASTERS,
    formatFamily: 'major',
  },
  shanghaiMasters: {
    id: 'shanghaiMasters',
    displayName: 'Shanghai Masters',
    tournamentClass: 'Elite Invitational',
    reportingClass: 'invitational',
    eligibleBands: ['Top 16', 'Chinese Wildcards'],
    fieldSize: 24,
    minFieldSize: 24,
    maxFieldSize: 24,
    seedingModel: 'Top 16 plus Chinese invite routes; top 8 enter at Last 16.',
    entryRoutes: ['Top 16 world rankings', 'Four highest Chinese players outside top 16', 'Four Chinese wildcard places'],
    roundStructure: ['Round 1', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SHANGHAI_MASTERS_FORMAT,
    rankingImpact: 'Invitational prestige and sponsor value; no normal ranking points unless explicitly set.',
    prizeTier: 'Elite invitational',
    calendarWindow: 'Summer international invitational block',
    validationRules: ['Should be 24 invited players', 'Top 8 must enter at Last 16'],
    pathwayImpact: 'Elite invitation status with China-specific wildcard access.',
    expectedPlayerVolume: '24 invited players',
    roundBestOf: ROUND_BEST_OF_SHANGHAI_MASTERS,
    formatFamily: 'invitational',
  },
  riyadhSeasonChampionship: {
    id: 'riyadhSeasonChampionship',
    displayName: 'Riyadh Season Championship',
    tournamentClass: 'Elite Invitational',
    reportingClass: 'invitational',
    eligibleBands: ['Top 10', 'World Champion', 'Saudi Wildcards'],
    fieldSize: 12,
    minFieldSize: 12,
    maxFieldSize: 12,
    seedingModel: 'Seeds 9-10 begin against Saudi wildcards, winners face seeds 7-8, higher seeds enter later.',
    entryRoutes: ['Defending champion', 'World champion', 'Eight highest-ranked players', 'Two Saudi wildcards'],
    roundStructure: ['Preliminary Round', 'Quarter Final Play-In', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: RIYADH_SEASON_FORMAT,
    rankingImpact: 'Invitational prestige and prize impact; no normal ranking points unless explicitly set.',
    prizeTier: 'Elite invitational',
    calendarWindow: 'Winter invitational showcase',
    validationRules: ['Should be 12 invited players', 'Final must be best of 9'],
    pathwayImpact: 'Elite showcase with wildcard access and high sponsor value.',
    expectedPlayerVolume: '12 invited players',
    roundBestOf: ROUND_BEST_OF_SHORT_FINAL,
    formatFamily: 'invitational',
  },
  shootOut: {
    id: 'shootOut',
    displayName: 'Shoot Out',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Random knockout draw with one-frame matches and no normal qualifying draw.',
    entryRoutes: ['Main-tour full-field entry'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SHOOT_OUT_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with extreme short-format volatility.',
    prizeTier: 'Ranking event',
    calendarWindow: 'Winter short-format ranking slot',
    validationRules: ['Must use one-frame matches', 'Must not apply normal seeded qualifying assumptions'],
    pathwayImpact: 'High-variance ranking and confidence opportunity for the whole tour.',
    expectedPlayerVolume: '128-player random knockout',
    roundBestOf: ROUND_BEST_OF_SHOOT_OUT,
    formatFamily: 'proEvent',
  },
  germanMasters: {
    id: 'germanMasters',
    displayName: 'German Masters',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Tiered qualifying; top 32 enter qualifying round 3 and top 16 Q3 matches are held over.',
    entryRoutes: ['Main-tour full-field qualifying route'],
    roundStructure: ['Qualifying Round 1', 'Qualifying Round 2', 'Qualifying Round 3', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: GERMAN_MASTERS_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points.',
    prizeTier: 'European ranking event',
    calendarWindow: 'Winter European ranking block',
    validationRules: ['Should be 128-player tiered route', 'Top 32 must enter Q3', 'Top 16 Q3 matches held over'],
    pathwayImpact: 'European ranking opportunity with staged protection for high seeds.',
    expectedPlayerVolume: '128-player tiered qualifying route',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  worldOpen: {
    id: 'worldOpen',
    displayName: 'World Open',
    tournamentClass: 'Professional Ranking Event',
    reportingClass: 'ranking',
    eligibleBands: ['Main Tour'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: '128-player route with qualifiers and selected held-over matches.',
    entryRoutes: ['Main-tour full-field entry', 'Qualifier or held-over opening route'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: INTERNATIONAL_RANKING_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points.',
    prizeTier: 'International ranking',
    calendarWindow: 'Spring international ranking block',
    validationRules: ['Should be 128 players', 'Must support qualifier and held-over handling'],
    pathwayImpact: 'Full-field international ranking opportunity late in the season.',
    expectedPlayerVolume: '128-player international ranking event',
    roundBestOf: ROUND_BEST_OF_STANDARD_RANKING,
    formatFamily: 'proEvent',
  },
  worldChampionshipQualifying: {
    id: 'worldChampionshipQualifying',
    displayName: 'World Championship Qualifying',
    tournamentClass: 'World Championship Qualifying',
    reportingClass: 'qualifying',
    eligibleBands: ['Top 17-128'],
    fieldSize: 128,
    minFieldSize: 128,
    maxFieldSize: 128,
    seedingModel: 'Seed by world ranking with top 16 protected directly into the main draw.',
    entryRoutes: ['World Championship qualifying route'],
    roundStructure: ['Qualifying Round 1', 'Qualifying Round 2', 'Qualifying Round 3', 'Judgement Day'],
    frameFormat: WORLD_QUALIFYING_FORMAT,
    rankingImpact: 'World ranking route event; qualifying does not count as main draw entry.',
    prizeTier: 'World qualifying',
    calendarWindow: 'Late-season World Championship qualification block',
    validationRules: ['Must keep top 16 protected', 'Must not count as World main draw entry', 'All qualifying matches best of 19'],
    pathwayImpact: 'Only route for ranks 17-128 into the World main draw.',
    expectedPlayerVolume: '128 qualifiers for 16 World spots',
    formatFamily: 'major',
  },
  worldChampionshipMain: {
    id: 'worldChampionshipMain',
    displayName: 'World Championship Main Draw',
    tournamentClass: 'World Championship Main Draw',
    reportingClass: 'major',
    eligibleBands: ['Top 16', 'World Qualifiers'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Top 16 seeds fixed into the Last 32, with 16 qualifiers drawn against them.',
    entryRoutes: ['Top 16 direct', '16 qualifiers from World Championship qualifying'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: WORLD_MAIN_FORMAT,
    rankingImpact: 'Full world ranking, one-year ranking, major prestige, and World title stakes.',
    prizeTier: 'World Championship',
    calendarWindow: 'Season-ending World Championship',
    validationRules: ['Must be 32 players', 'Main draw only counts as World Championship entry'],
    pathwayImpact: 'Highest prestige, biggest prize fund, and World Champion status.',
    expectedPlayerVolume: '32-player World Championship main draw',
    roundBestOf: ROUND_BEST_OF_WORLD_MAIN,
    formatFamily: 'major',
  },
  playersSeriesTop32: {
    id: 'playersSeriesTop32',
    displayName: 'Players Series Top 32',
    tournamentClass: 'Players Series',
    reportingClass: 'ranking',
    eligibleBands: ['Top 32'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Seed by one-year ranking.',
    entryRoutes: ['One-year ranking top 32'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: PLAYERS_SERIES_SHORT,
    rankingImpact: 'One-year ranking qualification event with ranking prestige and prize money.',
    prizeTier: 'Players Series',
    calendarWindow: 'Late-season elite one-year series',
    validationRules: ['Must be one-year ranking qualified', 'Should be 32 players'],
    pathwayImpact: 'Elite short-field prestige for upper main-tour players.',
    expectedPlayerVolume: '32 one-year ranking qualifiers',
    roundBestOf: ROUND_BEST_OF_PLAYERS_TOP32,
    formatFamily: 'major',
  },
  playersSeriesTop16: {
    id: 'playersSeriesTop16',
    displayName: 'Players Championship Top 16',
    tournamentClass: 'Players Series',
    reportingClass: 'ranking',
    eligibleBands: ['Top 16'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by one-year ranking.',
    entryRoutes: ['One-year ranking top 16'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: PLAYERS_SERIES_LONG,
    rankingImpact: 'One-year ranking qualified event with ranking prestige and prize money.',
    prizeTier: 'Players Series',
    calendarWindow: 'Late-season top-16 one-year event',
    validationRules: ['Must be one-year ranking qualified', 'Should be 16 players'],
    pathwayImpact: 'Prestige and ranking boost for elite form players.',
    expectedPlayerVolume: '16 one-year ranking qualifiers',
    roundBestOf: ROUND_BEST_OF_PLAYERS_TOP16,
    formatFamily: 'major',
  },
  tourChampionshipTop8: {
    id: 'tourChampionshipTop8',
    displayName: 'Tour Championship Top 8/12',
    tournamentClass: 'Players Series',
    reportingClass: 'major',
    eligibleBands: ['Top 8', 'Top 12'],
    fieldSize: 12,
    minFieldSize: 12,
    maxFieldSize: 12,
    seedingModel: 'Seed by one-year ranking; seeds 1-4 receive quarter-final byes.',
    entryRoutes: ['One-year ranking top 12'],
    roundStructure: ['Round One', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: TOUR_CHAMPIONSHIP_FORMAT,
    rankingImpact: 'High-prestige one-year ranking finale with major-style reputation.',
    prizeTier: 'Players Series finale',
    calendarWindow: 'Late-season elite finale',
    validationRules: ['Should be 12 players', 'Must be one-year ranking qualified', 'All matches best of 19'],
    pathwayImpact: 'Elite short-field prestige and title weight.',
    expectedPlayerVolume: '12 one-year ranking qualifiers',
    roundBestOf: {
      'Last 16': 19,
      'Quarter Final': 19,
      'Semi Final': 19,
      Final: 19,
    },
    formatFamily: 'major',
  },
  championOfChampions: {
    id: 'championOfChampions',
    displayName: 'Champion of Champions-style Invitational',
    tournamentClass: 'Champion of Champions-style Invitational',
    reportingClass: 'invitational',
    eligibleBands: ['Top 16', 'Title Winners'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by title priority and world ranking replacements.',
    entryRoutes: ['Title winners first', 'Ranking replacements'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: CHAMPION_OF_CHAMPIONS_FORMAT,
    rankingImpact: 'Prestige and sponsor boost only; usually non-ranking.',
    prizeTier: 'Elite invitational',
    calendarWindow: 'Late-season champion invite slot',
    validationRules: ['Must remain invitational', 'Should be 16 players'],
    pathwayImpact: 'Rewards title winners and boosts elite reputation.',
    expectedPlayerVolume: '16 invited champions or replacements',
    roundBestOf: ROUND_BEST_OF_CHAMPION_OF_CHAMPIONS,
    formatFamily: 'invitational',
  },
  championshipLeagueInvitational: {
    id: 'championshipLeagueInvitational',
    displayName: 'Championship League Invitational',
    tournamentClass: 'Elite Invitational',
    reportingClass: 'invitational',
    eligibleBands: ['Top 32', 'Invited Professionals'],
    fieldSize: 25,
    minFieldSize: 25,
    maxFieldSize: 25,
    seedingModel: 'Rolling groups of seven with group winners advancing to a Winners Group.',
    entryRoutes: ['Invited professionals selected by ranking, form, and availability'],
    roundStructure: ['Group Stage', 'Winners Group'],
    frameFormat: CHAMPIONSHIP_LEAGUE_INVITATIONAL_FORMAT,
    rankingImpact: 'Invitational prize, form, confidence, and sponsor value only.',
    prizeTier: 'Invitational league',
    calendarWindow: 'Season-long invitational windows',
    validationRules: ['Should be 25 invited players', 'All matches best of 5', 'Must not behave like a normal knockout ranking event'],
    pathwayImpact: 'Provides elite match volume and form swings without ranking distortion.',
    expectedPlayerVolume: '25 invited professionals',
    roundBestOf: {
      'Last 16': 5,
      'Quarter Final': 5,
      'Semi Final': 5,
      Final: 5,
    },
    formatFamily: 'invitational',
  },
  eliteInvitational: {
    id: 'eliteInvitational',
    displayName: 'Elite Invitational',
    tournamentClass: 'Elite Invitational',
    reportingClass: 'invitational',
    eligibleBands: ['Top 16', 'Top 32'],
    fieldSize: 16,
    minFieldSize: 8,
    maxFieldSize: 16,
    seedingModel: 'Seed by world rank, titles, and invite priority.',
    entryRoutes: ['Invite top-ranked players, champions, or selected elite entries'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: MASTERS_FORMAT,
    rankingImpact: 'Prestige and sponsor boost only unless explicitly designated ranking.',
    prizeTier: 'Elite invitational',
    calendarWindow: 'Early or mid-season elite invitational slot',
    validationRules: ['Should be 8-16 players', 'Must remain restricted-field'],
    pathwayImpact: 'Builds elite reputation and sponsor interest.',
    expectedPlayerVolume: '8-16 invited elite players',
    roundBestOf: ROUND_BEST_OF_MASTERS,
    formatFamily: 'invitational',
  },
  eliteInvitationalQualifier: {
    id: 'eliteInvitationalQualifier',
    displayName: 'Elite Invitational Qualifier',
    tournamentClass: 'Invitational Qualifier',
    reportingClass: 'invitational',
    eligibleBands: ['Top 32', 'Top 64'],
    fieldSize: 32,
    minFieldSize: 32,
    maxFieldSize: 32,
    seedingModel: 'Seed by world ranking and recent title form.',
    entryRoutes: ['Restricted elite qualification route'],
    roundStructure: ['Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: [
      'Early rounds: best of 7',
      'Quarter-finals: best of 9',
      'Semi-finals: best of 11',
      'Final: best of 11',
    ],
    rankingImpact: 'Prestige route only; no normal world ranking points.',
    prizeTier: 'Elite qualifier',
    calendarWindow: 'Mid-season invitational qualification slot',
    validationRules: ['Should be 32 players', 'Must not behave like an open ranking event'],
    pathwayImpact: 'Qualifies players into elite invitationals without normal ranking-point distortion.',
    expectedPlayerVolume: '32 restricted elite qualifiers',
    formatFamily: 'invitational',
  },
  seniorRegularEvent: {
    id: 'seniorRegularEvent',
    displayName: 'World Seniors Tour Ranking Event',
    tournamentClass: 'Senior Ranking Event',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 64,
    minFieldSize: 33,
    maxFieldSize: 128,
    seedingModel: 'Seed by two-year senior ranking and Race to the Crucible position.',
    entryRoutes: ['Open senior tour entry for eligible off-main-tour 40+ players'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SENIOR_FORMAT,
    rankingImpact: 'Senior ranking only; ranking points are frames won.',
    prizeTier: 'Senior tour',
    calendarWindow: 'August-April World Seniors Tour ranking circuit',
    validationRules: ['Must be senior-only', 'Must not award a World Snooker Tour card', 'Must not admit active main-tour players in this game model'],
    pathwayImpact: 'Builds senior ranking and Race to the Crucible qualification value.',
    expectedPlayerVolume: '33-57 typical senior entrants, capped at 128',
    roundBestOf: ROUND_BEST_OF_SENIOR_REGULAR,
    formatFamily: 'senior',
  },
  britishSeniorsOpen: {
    id: 'britishSeniorsOpen',
    displayName: 'British Seniors Open',
    tournamentClass: 'Senior Invitational',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 8,
    minFieldSize: 8,
    maxFieldSize: 8,
    seedingModel: 'Invite and seed by senior ranking, legacy status, and event selection.',
    entryRoutes: ['Senior invitation or senior ranking selection'],
    roundStructure: ['Quarter Final', 'Semi Final', 'Final'],
    frameFormat: BRITISH_SENIORS_OPEN_FORMAT,
    rankingImpact: 'Senior prestige and seeding value; no normal world ranking points.',
    prizeTier: 'Senior open',
    calendarWindow: 'Late December senior showcase',
    validationRules: ['Must be 8 players', 'Must remain senior-only', 'Must not award a World Snooker Tour card'],
    pathwayImpact: 'Adds senior prestige without replacing the regular ranking-event pathway.',
    expectedPlayerVolume: '8 invited senior players',
    roundBestOf: ROUND_BEST_OF_BRITISH_SENIORS_OPEN,
    formatFamily: 'senior',
  },
  seniorGoldenTicket: {
    id: 'seniorGoldenTicket',
    displayName: 'World Seniors Golden Ticket Qualifier',
    tournamentClass: 'Senior Qualifier',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by senior ranking-list qualification.',
    entryRoutes: ['Top senior ranking-list players not otherwise qualified'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SENIOR_GOLDEN_TICKET_FORMAT,
    rankingImpact: 'Qualification route; no normal world ranking points.',
    prizeTier: 'Senior qualifier',
    calendarWindow: 'Post-tour pre-Crucible qualification slot',
    validationRules: ['Must be 16 players', 'Must remain senior-only', 'Must not award a World Snooker Tour card'],
    pathwayImpact: 'Gives senior ranking-list players a final World Seniors Championship route.',
    expectedPlayerVolume: '16 senior ranking-list qualifiers',
    roundBestOf: ROUND_BEST_OF_SENIOR_REGULAR,
    formatFamily: 'senior',
  },
  worldSeniorsChampionship: {
    id: 'worldSeniorsChampionship',
    displayName: 'World Seniors Championship',
    tournamentClass: 'Senior World Championship',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 24,
    minFieldSize: 24,
    maxFieldSize: 24,
    seedingModel: 'Top eight seeds enter at Last 16; remaining qualifiers play the opening round.',
    entryRoutes: ['Senior ranking list', 'Race to the Crucible', 'Golden Ticket winner', 'approved senior invitations'],
    roundStructure: ['Round One', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: WORLD_SENIORS_CHAMPIONSHIP_FORMAT,
    rankingImpact: 'Senior world-title prestige; no normal world ranking points.',
    prizeTier: 'Senior world championship',
    calendarWindow: 'May Crucible senior championship week',
    validationRules: ['Must be senior-only', 'Must not award a World Snooker Tour card', 'Top eight seeds should receive protection'],
    pathwayImpact: 'Defines the senior-season champion and legacy status.',
    expectedPlayerVolume: '24 qualified senior players',
    roundBestOf: ROUND_BEST_OF_WORLD_SENIORS,
    formatFamily: 'senior',
  },
  seniorEvent: {
    id: 'seniorEvent',
    displayName: 'Senior Event',
    tournamentClass: 'Senior Event',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 16,
    minFieldSize: 8,
    maxFieldSize: 32,
    seedingModel: 'Seed by senior ranking, reputation, and legacy titles.',
    entryRoutes: ['Senior tour qualification or invite'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SENIOR_FORMAT,
    rankingImpact: 'Senior ranking only; no normal world ranking points.',
    prizeTier: 'Senior tour',
    calendarWindow: 'Season-long senior circuit',
    validationRules: ['Must remain senior-only', 'Must not award a World Snooker Tour card'],
    pathwayImpact: 'Supports late-career prestige and legacy competition.',
    expectedPlayerVolume: '8-32 senior entrants',
    roundBestOf: ROUND_BEST_OF_SENIOR_REGULAR,
    formatFamily: 'senior',
  },
  legendsEvent: {
    id: 'legendsEvent',
    displayName: 'Legends / Veteran Invitational',
    tournamentClass: 'Senior Event',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 16,
    minFieldSize: 8,
    maxFieldSize: 16,
    seedingModel: 'Seed by senior reputation, titles, and invite priority.',
    entryRoutes: ['Invite former champions and veteran names'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SENIOR_FORMAT,
    rankingImpact: 'Legacy prestige only; no normal world ranking points.',
    prizeTier: 'Legends invitational',
    calendarWindow: 'Senior showcase slots',
    validationRules: ['Should be 8-16 players', 'Must remain senior/legend only'],
    pathwayImpact: 'Maintains legacy visibility and senior engagement.',
    expectedPlayerVolume: '8-16 invited legends',
    formatFamily: 'senior',
  },
  exhibition: {
    id: 'exhibition',
    displayName: 'Exhibition / Pro-Am',
    tournamentClass: 'Exhibition Event',
    reportingClass: 'invitational',
    eligibleBands: ['Mixed'],
    fieldSize: 16,
    minFieldSize: 8,
    maxFieldSize: 32,
    seedingModel: 'Seed by host preference, reputation, and entertainment value.',
    entryRoutes: ['Invite, charity, or pro-am acceptance'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: EXHIBITION_FORMAT,
    rankingImpact: 'Confidence, reputation, and sponsor value only.',
    prizeTier: 'Exhibition',
    calendarWindow: 'Fill-in showcase slots',
    validationRules: ['Must not award normal ranking points', 'Should use short format'],
    pathwayImpact: 'Promotional, sponsor, and confidence impact only.',
    expectedPlayerVolume: '8-32 invited exhibition players',
    formatFamily: 'exhibition',
  },
} satisfies Record<string, TournamentFormatProfile>

const profiles = {
  ...FORMAT_PROFILES,
  internationalQualifier: { ...FORMAT_PROFILES.proQualifier, id: 'internationalQualifier', displayName: 'International Championship Qualifying' },
  worldOpenQualifier: { ...FORMAT_PROFILES.proQualifier, id: 'worldOpenQualifier', displayName: 'World Open Qualifying' },
  homeNationsMain: { ...FORMAT_PROFILES.homeNationsRanking, id: 'homeNationsMain' },
  juniorLeague: { ...FORMAT_PROFILES.juniorLocal, id: 'juniorLeague', displayName: 'Junior Club League' },
};

// A complete, audited round table is required for every profile, including unused ones.
export const TOURNAMENT_FORMATS = Object.fromEntries(Object.entries(profiles).map(([id, profile]) => {
  const rules = auditedRules[id as keyof typeof profiles];
  const merged = { ...profile, ...rules } as TournamentFormatProfile;
  merged.frameFormat = Object.entries(merged.roundBestOf ?? {}).map(([round, bestOf]) => round + ': ' + (bestOf === 4 ? 'up to 4 frames; draws allowed' : 'best of ' + bestOf));
  return [id, merged];
})) as Record<keyof typeof profiles, TournamentFormatProfile>;

export type TournamentFormatId = keyof typeof TOURNAMENT_FORMATS
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[TournamentFormatId]

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function inferTournamentFormatId(tournament: TournamentFormatLookup): TournamentFormatId {
  const name = tournament.name.toLowerCase()

  if (/international championship.*qualif/.test(name)) return 'internationalQualifier'
  if (/world open.*qualif/.test(name)) return 'worldOpenQualifier'
  if (/english open qualifying|welsh open qualifying/.test(name)) return 'proQualifier'
  if (/^english open$|^welsh open$/.test(name)) return 'homeNationsMain'
  if (name === 'summer junior club league') return 'juniorLeague'

  if (/world championship qualifying/.test(name)) return 'worldChampionshipQualifying'
  if (/world championship/.test(name) && !/seniors world championship/.test(name) && !/qualifying/.test(name)) return 'worldChampionshipMain'
  if (tournament.type === 'Q School' && /order of merit review/.test(name)) return 'qSchoolReview'
  if (tournament.type === 'Q School' && /asia[\s/-]*oceania|asia oceania/.test(name)) return 'qSchoolAsiaOceaniaEvent'
  if (tournament.type === 'Q School' && /uk[\s/-]*europe|uk europe|europe q school/.test(name)) return 'qSchoolUkEuropeEvent'
  if (tournament.type === 'Q School') return 'qSchoolEvent'
  if (tournament.type === 'Q Tour' && /play off|play-off|playoff/.test(name)) return 'qTourPlayoff'
  if (tournament.type === 'Q Tour' && /europe\s*-\s*event|europe event/.test(name)) return 'qTourEuropeEvent'
  if (tournament.type === 'Q Tour' && /americas|asia pacific|middle east|china/.test(name)) return 'qTourRegionalEvent'
  if (tournament.type === 'Q Tour') return 'qTourRegular'
  if (/rookie pro qualifier/.test(name)) return 'rookieQualifier'
  if (/uk major qualifying|uk championship qualifying/.test(name)) return 'ukMajorQualifying'
  if (/elite invitational qualifier/.test(name)) return 'eliteInvitationalQualifier'
  if (/uk major|uk championship/.test(name) && !/qualifying/.test(name)) return 'ukMajor'
  if (/championship league invitational/.test(name)) return 'championshipLeagueInvitational'
  if (/championship league/.test(name) && tournament.type === 'Ranking') return 'championshipLeagueRanking'
  if (/shanghai masters/.test(name)) return 'shanghaiMasters'
  if (/saudi arabia masters/.test(name)) return 'saudiArabiaMasters'
  if (/wuhan open/.test(name)) return 'wuhanOpen'
  if (/british open/.test(name)) return 'britishOpen'
  if (/xi'?an grand prix|xi an grand prix/.test(name)) return 'xianGrandPrix'
  if (/international championship/.test(name)) return 'internationalChampionship'
  if (/riyadh season championship/.test(name)) return 'riyadhSeasonChampionship'
  if (/shoot out/.test(name)) return 'shootOut'
  if (/german masters/.test(name)) return 'germanMasters'
  if (/world open/.test(name)) return 'worldOpen'
  if (/world grand prix/.test(name)) return 'playersSeriesTop32'
  if (/players championship/.test(name)) return 'playersSeriesTop16'
  if (/tour championship/.test(name)) return 'tourChampionshipTop8'
  if (/champion of champions/.test(name) && tournament.type !== 'Junior') return 'championOfChampions'
  if (/masters-style/.test(name)) return 'mastersInvitational'
  if (/^masters$| the masters|masters\b/.test(name) && tournament.type === 'Invitational') return 'mastersInvitational'
  if (tournament.type === 'Invitational' && /elite season opener/.test(name)) return 'eliteInvitational'
  if (tournament.type === 'Invitational') return 'eliteInvitational'
  if (tournament.type === 'Senior' && /world seniors championship/.test(name)) return 'worldSeniorsChampionship'
  if (tournament.type === 'Senior' && /golden ticket/.test(name)) return 'seniorGoldenTicket'
  if (tournament.type === 'Senior' && /british seniors open/.test(name)) return 'britishSeniorsOpen'
  if (tournament.type === 'Senior' && /seniors tour\s*-\s*event/.test(name)) return 'seniorRegularEvent'
  if (tournament.type === 'Senior' && /world legends|veteran invitational/.test(name)) return 'legendsEvent'
  if (tournament.type === 'Senior') return 'seniorEvent'
  if (tournament.type === 'Exhibition') return 'exhibition'

  if (tournament.type === 'Junior') {
    if (/champion of champions|cup|invitational/.test(name)) return 'juniorInvitationalCup'
    if (/league finals/.test(name)) return 'juniorSeasonFinals'
    return 'juniorLocal'
  }

  if (tournament.type === 'Regional Youth') {
    if (/masters|finals/.test(name)) return 'juniorSeasonFinals'
    return 'juniorRegional'
  }

  if (tournament.type === 'National Youth') {
    if (/ebsa|european under-?16|european under-?18|european under-?21|u16|u18|u21/.test(name)) return 'ebsaYouthChampionship'
    if (/cup|invitational/.test(name)) return 'juniorInvitationalCup'
    return 'juniorNational'
  }

  if (tournament.type === 'Amateur') {
    if (/wsf junior/.test(name)) return 'wsfJuniorChampionship'
    if (/wsf open/.test(name)) return 'wsfOpenChampionship'
    if (/ebsa.*(u16|u18|under-?16|under-?18)/.test(name)) return 'ebsaYouthChampionship'
    if (/ebsa|european amateur|european u21|under-?21/.test(name)) return 'ebsaCardRoute'
    if (/federation qualifier|cbsa|asia-pacific federation|asia pacific federation|americas federation|africa federation/.test(name)) return 'federationCardRoute'
    if (/elite amateur masters/.test(name)) return 'eliteAmateur'
    if (/tour finals/.test(name)) return 'amateurTourFinals'
    if (/championship/.test(name)) return 'amateurChampionship'
    if (/series/.test(name)) return 'amateurSeries'
    return 'amateurOpen'
  }

  if (tournament.type === 'Professional Tour') {
    return 'proQualifier'
  }

  if (tournament.type === 'Major') {
    if (/tour championship/.test(name)) return 'tourChampionshipTop8'
    if (/uk major|uk championship/.test(name)) return 'ukMajor'
    if (/masters/.test(name)) return 'mastersInvitational'
  }

  if (tournament.type === 'Ranking') {
    if (/welsh|scottish|english|northern ireland/.test(name)) return 'homeNationsRanking'
    if (/international|world series|china-style/.test(name)) return 'internationalRanking'
    return 'standardRanking'
  }

  return 'standardRanking'
}

export function getTournamentFormat(formatId: string | null | undefined) {
  if (!formatId) return null
  if (!Object.prototype.hasOwnProperty.call(TOURNAMENT_FORMATS, formatId)) {
    return null
  }

  const narrowedFormatId = formatId as TournamentFormatId
  return TOURNAMENT_FORMATS[narrowedFormatId]
}

export function resolveTournamentFormat(tournament: TournamentFormatLookup) {
  const inferred = inferTournamentFormatId(tournament)
  const repaired = ['internationalQualifier', 'worldOpenQualifier', 'proQualifier', 'homeNationsMain', 'juniorLeague'].includes(inferred)
  const formatId = repaired ? inferred : getTournamentFormat(tournament.formatId)?.id ?? inferred
  const profile = TOURNAMENT_FORMATS[formatId as TournamentFormatId]
  const merged = { ...profile, ...calendarRuleOverrides[tournament.name] }
  return { ...merged, frameFormat: Object.entries(merged.roundBestOf ?? {}).map(([r, n]) => r + ': ' + (n === 4 ? 'up to 4 frames; draws allowed' : 'best of ' + n)) }
}

export function getBestOfForRound(tournament: TournamentFormatLookup, round: string, fallbackBestOf: number) {
  const format = resolveTournamentFormat(tournament) as TournamentFormatProfile
  return format.roundBestOf?.[round] ?? fallbackBestOf
}

export function getConfiguredFieldSizeLabel(format: TournamentFormat) {
  return format.fieldSize == null ? 'n/a' : `${format.fieldSize}`
}

export function getExpectedFieldSizeLabel(format: TournamentFormat) {
  const profile = format as TournamentFormatProfile
  if (profile.minFieldSize == null && profile.maxFieldSize == null) return 'administrative'
  if (profile.minFieldSize != null && profile.maxFieldSize == null) return `${profile.minFieldSize}+`
  if (profile.minFieldSize == null && profile.maxFieldSize != null) return `up to ${profile.maxFieldSize}`
  if (profile.minFieldSize === profile.maxFieldSize) return `${profile.minFieldSize}`
  return `${profile.minFieldSize}-${profile.maxFieldSize}`
}

export function getRoundStructureSummary(format: TournamentFormat) {
  return format.roundStructure.join(' -> ')
}

export function getFrameFormatSummary(format: TournamentFormat) {
  return format.frameFormat.join('; ')
}

export function getPlayableRounds(format: TournamentFormat) {
  return format.roundStructure.filter((round) => !/administrative review/i.test(round))
}

export function getRoundCount(format: TournamentFormat) {
  return getPlayableRounds(format).length
}

export function normalizeTournamentRoundLabel(value: string) {
  return normalizeLabel(value)
}

function isPowerOfTwo(value: number) {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0
}

function getRoundEntrantCount(roundReached: string) {
  const normalized = normalizeTournamentRoundLabel(roundReached)

  if (normalized === 'final') return 2
  if (normalized === 'semi final') return 4
  if (normalized === 'quarter final') return 8

  const roundMatch = normalized.match(/^last (\d+)$/)
  if (roundMatch?.[1]) {
    return Number.parseInt(roundMatch[1], 10)
  }

  return null
}

export function getExpectedRoundRecord(fieldSize: number | null | undefined, roundReached: string) {
  if (!fieldSize || !isPowerOfTwo(fieldSize)) {
    return null
  }

  const totalRounds = Math.log2(fieldSize)

  if (/winner|champion/i.test(roundReached)) {
    return {
      expectedMatches: totalRounds,
      expectedWins: totalRounds,
      expectedLosses: 0,
      isTitle: true,
      isFinal: true,
      isDeepRun: true,
    }
  }

  const lostRoundMatch = roundReached.match(/lost in (.+)$/i)
  if (lostRoundMatch?.[1]) {
    const entrantCount = getRoundEntrantCount(lostRoundMatch[1])
    if (entrantCount != null && entrantCount <= fieldSize && isPowerOfTwo(entrantCount)) {
      const expectedWins = Math.max(0, Math.log2(fieldSize) - Math.log2(entrantCount))
      return {
        expectedMatches: expectedWins + 1,
        expectedWins,
        expectedLosses: 1,
        isTitle: false,
        isFinal: entrantCount === 2,
        isDeepRun: entrantCount <= 8,
      }
    }
  }

  const advancedRoundMatch = roundReached.match(/advanced to (.+?)(?: ·|$)/i)
  if (advancedRoundMatch?.[1]) {
    const entrantCount = getRoundEntrantCount(advancedRoundMatch[1])
    if (entrantCount != null && entrantCount <= fieldSize && isPowerOfTwo(entrantCount)) {
      const expectedWins = Math.max(0, Math.log2(fieldSize) - Math.log2(entrantCount))
      return {
        expectedMatches: expectedWins,
        expectedWins,
        expectedLosses: 0,
        isTitle: false,
        isFinal: entrantCount === 2,
        isDeepRun: entrantCount <= 8,
      }
    }
  }

  return null
}

export function getTournamentResultExpectation(tournament: TournamentFormatLookup, result: string) {
  const format = resolveTournamentFormat(tournament)
  const rounds = getPlayableRounds(format)
  if (rounds.length === 0) {
    return null
  }

  const roundRecord = getExpectedRoundRecord(format.fieldSize, result)
  if (roundRecord) {
    const lostRoundMatch = result.match(/lost in (.+)$/i)
    const advancedRoundMatch = result.match(/advanced to (.+?)(?: ·|$)/i)
    const roundReached = /winner|champion/i.test(result)
      ? rounds[rounds.length - 1]
      : lostRoundMatch?.[1]
        ? rounds.find((round) => normalizeTournamentRoundLabel(round) === normalizeTournamentRoundLabel(lostRoundMatch[1])) ?? lostRoundMatch[1]
        : advancedRoundMatch?.[1]
          ? rounds.find((round) => normalizeTournamentRoundLabel(round) === normalizeTournamentRoundLabel(advancedRoundMatch[1])) ?? advancedRoundMatch[1]
          : rounds[rounds.length - 1]

    return {
      matchesPlayed: roundRecord.expectedMatches,
      wins: roundRecord.expectedWins,
      losses: roundRecord.expectedLosses,
      roundReached,
    }
  }

  if (/winner/i.test(result)) {
    return {
      matchesPlayed: rounds.length,
      wins: rounds.length,
      losses: 0,
      roundReached: rounds[rounds.length - 1],
    }
  }

  const lostRoundMatch = result.match(/lost in (.+)$/i)
  if (lostRoundMatch?.[1]) {
    const normalizedRound = normalizeTournamentRoundLabel(lostRoundMatch[1])
    const roundIndex = rounds.findIndex((round) => normalizeTournamentRoundLabel(round) === normalizedRound)
    if (roundIndex >= 0) {
      return {
        matchesPlayed: roundIndex + 1,
        wins: roundIndex,
        losses: 1,
        roundReached: rounds[roundIndex],
      }
    }
  }

  const advancedRoundMatch = result.match(/advanced to (.+?)(?: ·|$)/i)
  if (advancedRoundMatch?.[1]) {
    const normalizedRound = normalizeTournamentRoundLabel(advancedRoundMatch[1])
    const roundIndex = rounds.findIndex((round) => normalizeTournamentRoundLabel(round) === normalizedRound)
    if (roundIndex > 0) {
      return {
        matchesPlayed: roundIndex,
        wins: roundIndex,
        losses: 0,
        roundReached: rounds[roundIndex - 1],
      }
    }
  }

  return null
}

export function isYouthFormat(format: TournamentFormat) {
  return format.formatFamily === 'youth'
}

export function isProfessionalFormat(format: TournamentFormat) {
  return ['proQualifier', 'proEvent', 'major', 'invitational'].includes(format.formatFamily)
}

export function tournamentFormatSummary(tournament: TournamentFormatLookup) {
  const f = resolveTournamentFormat(tournament);
  const lengths = [...new Set(Object.values(f.roundBestOf ?? {}))].sort((a, b) => a! - b!) as number[];
  if (!lengths.length) return 'Administrative review; no matches';
  if (f.groupMode === 'ranking') return 'Groups: up to 4 frames, draws allowed · final best of 5';
  if (f.groupMode === 'invitational') return 'Rolling groups and play-offs · all matches best of 5';
  if (f.specialRules?.includes('shootOut')) return 'One frame · 10-minute limit · 15/10-second shot clock';
  return (f.groupMode === 'league' ? 'Round robin' : f.groupMode ? 'Groups and knockout' : f.qualifiers ? f.qualifiers + ' qualification places' : 'Knockout') + ' · best of ' + (lengths.length === 1 ? lengths[0] : lengths.join('/'));
}
