import type { Tournament } from '../types/game'

type TournamentFormatProfile = {
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

const Q_TOUR_FORMAT = [
  'Early rounds: best of 5',
  'Last 16 / Quarter-finals: best of 7',
  'Semi-finals: best of 7',
  'Final: best of 9',
]

const Q_SCHOOL_FORMAT = [
  'All rounds: best of 7',
  'Final / card match: best of 7 or 9',
]

const QUALIFIER_FORMAT = [
  'Early rounds: best of 7',
  'Final qualifying round: best of 9',
]

const STANDARD_RANKING_FORMAT = [
  'Early rounds: best of 7',
  'Last 32 / Last 16: best of 7 or 9',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 17 or 19',
]

const HOME_NATIONS_FORMAT = [
  'Early rounds: best of 7',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 17',
]

const INTERNATIONAL_RANKING_FORMAT = [
  'Early rounds: best of 9',
  'Quarter-finals: best of 9',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const UK_MAJOR_FORMAT = [
  'Early rounds: best of 11',
  'Quarter-finals: best of 11',
  'Semi-finals: best of 11 or 17',
  'Final: best of 19',
]

const MASTERS_FORMAT = [
  'First round: best of 11',
  'Quarter-finals: best of 11',
  'Semi-finals: best of 11',
  'Final: best of 19',
]

const WORLD_QUALIFYING_FORMAT = [
  'Early qualifying: best of 11',
  'Judgement Day: best of 19',
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

const SENIOR_FORMAT = [
  'Early rounds: best of 5',
  'Semi-finals: best of 7',
  'Final: best of 9',
]

const EXHIBITION_FORMAT = [
  'Short format',
  'Best of 3, 5, or shootout style',
  'No normal ranking impact',
]

export const TOURNAMENT_FORMATS = {
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
  qTourRegular: {
    id: 'qTourRegular',
    displayName: 'Q Tour Regular Event',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour', 'Amateur', 'Youth', 'Q School'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 64,
    seedingModel: 'Seed by Q Tour ranking and amateur ranking; protect top Q Tour players early.',
    entryRoutes: ['Q Tour season entry', 'Off-tour amateur pathway access'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_TOUR_FORMAT,
    rankingImpact: 'Q Tour ranking only; no normal world ranking points.',
    prizeTier: 'Q Tour standard',
    calendarWindow: 'August-April Q Tour pathway',
    validationRules: ['Must be off-tour only', 'Should be 64 players'],
    pathwayImpact: 'Feeds Q Tour ranking, Q School seeding, and direct card routes.',
    expectedPlayerVolume: '64 Q Tour entrants',
    formatFamily: 'qTour',
  },
  qTourPlayoff: {
    id: 'qTourPlayoff',
    displayName: 'Q Tour Global Play-Off',
    tournamentClass: 'Q Tour Event',
    reportingClass: 'Q Tour',
    eligibleBands: ['Q Tour'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 16,
    seedingModel: 'Seed by Q Tour order of merit and regional performance.',
    entryRoutes: ['Q Tour playoff qualification'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: [
      'Early rounds: best of 7',
      'Semi-finals: best of 7',
      'Final: best of 9',
    ],
    rankingImpact: 'Q Tour ranking and direct card route only.',
    prizeTier: 'Q Tour playoff',
    calendarWindow: 'Late-season Q Tour playoff',
    validationRules: ['Must be off-tour only', 'Should be 16 players'],
    pathwayImpact: 'Awards playoff prestige and direct tour-card leverage.',
    expectedPlayerVolume: '16 Q Tour qualifiers',
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
    seedingModel: 'Seed by Q Tour order, amateur ranking, former pro status, and Q School score.',
    entryRoutes: ['Q School campaign eligibility', 'Direct playoff route where used'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: Q_SCHOOL_FORMAT,
    rankingImpact: 'Q School order of merit only; no normal world ranking points.',
    prizeTier: 'Q School',
    calendarWindow: 'May-June qualification block',
    validationRules: ['Should be 128 players unless intentionally reduced', 'Must not award normal world ranking points'],
    pathwayImpact: 'Awards tour cards or order-of-merit advancement.',
    expectedPlayerVolume: '128 Q School entrants',
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
    seedingModel: 'Top 16 protected; broader full-field access than short-field invitationals.',
    entryRoutes: ['Main-tour field or 64 main draw plus qualifiers'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: HOME_NATIONS_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with pro prize money.',
    prizeTier: 'Home Nations',
    calendarWindow: 'Autumn professional ranking block',
    validationRules: ['Should be 64-128 players', 'Must award world ranking points'],
    pathwayImpact: 'Supports broad main-tour participation and ranking churn.',
    expectedPlayerVolume: '64 main draw plus qualifiers or 128 full field',
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
    formatFamily: 'proEvent',
  },
  ukMajorQualifying: {
    id: 'ukMajorQualifying',
    displayName: 'UK Major Qualifying',
    tournamentClass: 'Professional Qualifier',
    reportingClass: 'qualifying',
    eligibleBands: ['Top 17-128', 'Bottom Tour 65-128', 'Rookie Pro'],
    fieldSize: 128,
    minFieldSize: 96,
    maxFieldSize: 128,
    seedingModel: 'Seed by world ranking with top 16 or top 32 protected into later stages or main draw.',
    entryRoutes: ['UK major qualifying route'],
    roundStructure: ['Last 128', 'Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: UK_MAJOR_FORMAT,
    rankingImpact: 'World ranking and one-year route points into the UK major.',
    prizeTier: 'Major qualifier',
    calendarWindow: 'Pre-UK major qualifying block',
    validationRules: ['Should be 96-128 players', 'Must stay pro-only'],
    pathwayImpact: 'Feeds the UK major main draw and survival prestige.',
    expectedPlayerVolume: '96-128 professional qualifiers',
    formatFamily: 'proQualifier',
  },
  ukMajor: {
    id: 'ukMajor',
    displayName: 'UK-style Major',
    tournamentClass: 'UK-style Major',
    reportingClass: 'major',
    eligibleBands: ['Main Tour'],
    fieldSize: 64,
    minFieldSize: 64,
    maxFieldSize: 128,
    seedingModel: 'Top 16 or Top 32 seeded; lower ranks qualify through attached qualifiers.',
    entryRoutes: ['Main draw qualification from qualifiers or direct seeds'],
    roundStructure: ['Last 64', 'Last 32', 'Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: UK_MAJOR_FORMAT,
    rankingImpact: 'World ranking and one-year ranking points with major prestige.',
    prizeTier: 'Triple Crown style major',
    calendarWindow: 'December major slot',
    validationRules: ['Should keep a 64-player main draw or explicit 128 route', 'Must award ranking points'],
    pathwayImpact: 'Major prestige, ranking, reputation, and sponsor lift.',
    expectedPlayerVolume: '64 main draw or 128 total route',
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
    formatFamily: 'major',
  },
  worldChampionshipQualifying: {
    id: 'worldChampionshipQualifying',
    displayName: 'World Championship Qualifying',
    tournamentClass: 'World Championship Qualifying',
    reportingClass: 'qualifying',
    eligibleBands: ['Top 17-128'],
    fieldSize: 112,
    minFieldSize: 112,
    maxFieldSize: 112,
    seedingModel: 'Seed by world ranking with top 16 protected directly into the main draw.',
    entryRoutes: ['World Championship qualifying route'],
    roundStructure: ['Qualifying Round 1', 'Qualifying Round 2', 'Qualifying Round 3', 'Judgement Day'],
    frameFormat: WORLD_QUALIFYING_FORMAT,
    rankingImpact: 'World ranking route event; qualifying does not count as main draw entry.',
    prizeTier: 'World qualifying',
    calendarWindow: 'Late-season World Championship qualification block',
    validationRules: ['Must keep top 16 protected', 'Must not count as World main draw entry'],
    pathwayImpact: 'Only route for ranks 17-128 into the World main draw.',
    expectedPlayerVolume: '112 qualifiers for 16 World spots',
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
    formatFamily: 'major',
  },
  tourChampionshipTop8: {
    id: 'tourChampionshipTop8',
    displayName: 'Tour Championship Top 8/12',
    tournamentClass: 'Players Series',
    reportingClass: 'major',
    eligibleBands: ['Top 8', 'Top 12'],
    fieldSize: 8,
    minFieldSize: 8,
    maxFieldSize: 12,
    seedingModel: 'Seed by one-year ranking.',
    entryRoutes: ['One-year ranking top 8 or top 12'],
    roundStructure: ['Quarter Final', 'Semi Final', 'Final'],
    frameFormat: TOUR_CHAMPIONSHIP_FORMAT,
    rankingImpact: 'High-prestige one-year ranking finale with major-style reputation.',
    prizeTier: 'Players Series finale',
    calendarWindow: 'Late-season elite finale',
    validationRules: ['Should be 8-12 players', 'Must be one-year ranking qualified'],
    pathwayImpact: 'Elite short-field prestige and title weight.',
    expectedPlayerVolume: '8-12 one-year ranking qualifiers',
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
  seniorEvent: {
    id: 'seniorEvent',
    displayName: 'Senior Event',
    tournamentClass: 'Senior Event',
    reportingClass: 'senior',
    eligibleBands: ['Senior/Legend'],
    fieldSize: 16,
    minFieldSize: 16,
    maxFieldSize: 32,
    seedingModel: 'Seed by senior ranking, reputation, and legacy titles.',
    entryRoutes: ['Senior tour qualification or invite'],
    roundStructure: ['Last 16', 'Quarter Final', 'Semi Final', 'Final'],
    frameFormat: SENIOR_FORMAT,
    rankingImpact: 'Senior ranking only; no normal world ranking points.',
    prizeTier: 'Senior tour',
    calendarWindow: 'Season-long senior circuit',
    validationRules: ['Should be 16-32 players', 'Must remain senior-only'],
    pathwayImpact: 'Supports late-career prestige and legacy competition.',
    expectedPlayerVolume: '16-32 senior entrants',
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

export type TournamentFormatId = keyof typeof TOURNAMENT_FORMATS
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[TournamentFormatId]

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function inferTournamentFormatId(tournament: TournamentFormatLookup): TournamentFormatId {
  const name = tournament.name.toLowerCase()

  if (/world championship qualifying/.test(name)) return 'worldChampionshipQualifying'
  if (/world championship/.test(name) && !/seniors world championship/.test(name) && !/qualifying/.test(name)) return 'worldChampionshipMain'
  if (tournament.type === 'Q School' && /order of merit review/.test(name)) return 'qSchoolReview'
  if (tournament.type === 'Q School') return 'qSchoolEvent'
  if (tournament.type === 'Q Tour' && /play off|play-off|playoff/.test(name)) return 'qTourPlayoff'
  if (tournament.type === 'Q Tour') return 'qTourRegular'
  if (/rookie pro qualifier/.test(name)) return 'rookieQualifier'
  if (/uk major qualifying/.test(name)) return 'ukMajorQualifying'
  if (/elite invitational qualifier/.test(name)) return 'eliteInvitationalQualifier'
  if (/uk major/.test(name) && !/qualifying/.test(name)) return 'ukMajor'
  if (/world grand prix/.test(name)) return 'playersSeriesTop32'
  if (/players championship/.test(name)) return 'playersSeriesTop16'
  if (/tour championship/.test(name)) return 'tourChampionshipTop8'
  if (/champion of champions/.test(name) && tournament.type !== 'Junior') return 'championOfChampions'
  if (/masters-style|german-style masters/.test(name)) return 'mastersInvitational'
  if (tournament.type === 'Invitational' && /elite season opener/.test(name)) return 'eliteInvitational'
  if (tournament.type === 'Invitational') return 'eliteInvitational'
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
    if (/cup|invitational/.test(name)) return 'juniorInvitationalCup'
    return 'juniorNational'
  }

  if (tournament.type === 'Amateur') {
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
    if (/uk major/.test(name)) return 'ukMajor'
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
  const formatId = getTournamentFormat(tournament.formatId)?.id ?? inferTournamentFormatId(tournament)
  return TOURNAMENT_FORMATS[formatId as TournamentFormatId]
}

export function getConfiguredFieldSizeLabel(format: TournamentFormat) {
  return format.fieldSize == null ? 'n/a' : `${format.fieldSize}`
}

export function getExpectedFieldSizeLabel(format: TournamentFormat) {
  if (format.minFieldSize == null && format.maxFieldSize == null) return 'administrative'
  if (format.minFieldSize === format.maxFieldSize) return `${format.minFieldSize}`
  return `${format.minFieldSize}-${format.maxFieldSize}`
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