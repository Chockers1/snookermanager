import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { getCalendarModelSummary } from './calendarModel'

type ManagedSupportProfile = 'worst' | 'middle' | 'best'

type SeasonTournament = {
  name: string
  type: string
  result: string
}

type PlayerEventSummary = {
  totalTournamentsEntered: number
  rankingEventsEntered: number
  qualifiersEntered: number
  majorsEntered: number
  worldChampionshipMainDrawEntered: boolean
  worldChampionshipQualifyingEntered: boolean
  eliteInvitationalsEntered: number
  playersSeriesEntered: number
  qTourEventsEntered: number
  qSchoolEventsEntered: number
  amateurEventsEntered: number
  youthEventsEntered: number
  seniorEventsEntered: number
}

type SeasonReport = {
  season: string
  playerAtNextSeasonOpen: {
    age: number
  }
  pathway: {
    nextSeasonOpen: {
      hasTourCard: boolean
      worldRank: number | null
    }
  }
  calendar: {
    validationWarnings: string[]
  }
  playerEntries: PlayerEventSummary
  performance: {
    matchesPlayed: number
    closingRanking: number
    closingRankingLabel: string
  }
  tournaments: SeasonTournament[]
}

type SimulationReport = {
  finalPlayer: {
    competitiveStatus: string
    worldRanking: number | null
  }
  supportMetrics: {
    finalCompetitiveStatus: string
  } | null
  seasons: SeasonReport[]
}

type PlayerSnapshotRow = {
  name: string
  season: string
  isHumanPlayer: boolean
  isOnMainTour: boolean
  isTourCardHolder: boolean
  tourCardSource: string | null
  tourCardYear: number
  actualCircuit: string
  worldRank: number | null
  eventAccessBand: string
  enteredEventsCount: number | null
  rankingEventsEntered: number | null
  majorEventsEntered: number | null
  worldChampionshipMainDrawEntered: boolean | null
  worldChampionshipQualifyingEntered: boolean | null
  qTourEventsEntered: number | null
  qSchoolEventsEntered: number | null
  qualifierEventsEntered: number | null
}

type AggregateMetrics = {
  worldChampionCount: number
  firstTourCardAges: number[]
  firstTop64Ages: number[]
  firstTop16Ages: number[]
  firstMajorFinalAges: number[]
  firstWorldTitleAges: number[]
  aiTop16Counts: number[]
  aiCardGainsPerSeason: number[]
  aiCardLossesPerSeason: number[]
  aiMainTourChurnPerSeason: number[]
  aiQSchoolWinnersPerSeason: number[]
  averageTournamentsPerSeason: number[]
  averageMatchesPerSeason: number[]
  averageRankingEventsPerSeason: number[]
  averageMajorsPerSeason: number[]
  averageWorldChampionshipEntries: number[]
  averageQTourQSchoolEventsBeforeTurningPro: number[]
  averageProEventsAfterTurningPro: number[]
  aiTop16EventsPerSeason: number[]
  aiTop64EventsPerSeason: number[]
  aiBottomTourEventsPerSeason: number[]
  aiQTourEventsPerSeason: number[]
  aiQSchoolEntrantsPerSeason: number[]
  calendarValidationWarnings: number[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')
const reportsDir = path.join(workspaceRoot, 'docs', 'reports')
const snapshotDir = path.join(reportsDir, 'player-snapshots')

function getProfileLabel(profile: ManagedSupportProfile) {
  if (profile === 'worst') return 'min'
  if (profile === 'best') return 'max'
  return 'middle'
}

function getReportBaseName(profile: ManagedSupportProfile, seasons = 30) {
  return `${seasons}-season-managed-youth-14-${getProfileLabel(profile)}-support-simulation`
}

function seasonToFileSlug(season: string) {
  return season.replace('/', '-')
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatAverage(values: number[]) {
  const value = average(values)
  return value == null ? 'n/a' : value.toFixed(1)
}

function buildThresholdWarnings(runs: number, aggregates: Record<ManagedSupportProfile, AggregateMetrics>) {
  const warnings: string[] = []
  const worst = aggregates.worst
  const middle = aggregates.middle
  const best = aggregates.best
  const bestAverageProEvents = average(best.averageProEventsAfterTurningPro)

  if (worst.worldChampionCount > 0) {
    warnings.push(`min profile produced ${worst.worldChampionCount}/${runs} World Champion finishes; target is 0/${runs}`)
  }

  if (middle.worldChampionCount >= 3) {
    warnings.push(`middle profile produced ${middle.worldChampionCount}/${runs} World Champion finishes; target is 0-2/${runs}`)
  }

  if (best.worldChampionCount < Math.min(runs, 3)) {
    warnings.push(`max profile produced ${best.worldChampionCount}/${runs} World Champion finishes; target is 3-${runs}/${runs}`)
  }

  if ((bestAverageProEvents ?? 0) < 8) {
    warnings.push(`World Champion profile averaged only ${formatAverage(best.averageProEventsAfterTurningPro)} pro events per season after turning pro; target is at least 8.0`)
  }

  return warnings
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function runSimulation(profile: ManagedSupportProfile) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx'
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx', 'tsx', 'scripts/simulateFiveSeasons.ts', '--seasons=30', '--managed-youth-14', `--support-profile=${profile}`]
    : ['tsx', 'scripts/simulateFiveSeasons.ts', '--seasons=30', '--managed-youth-14', `--support-profile=${profile}`]
  const result = spawnSync(
    command,
    args,
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || `Simulation failed for ${profile}`)
  }

  return readJsonFile<SimulationReport>(path.join(reportsDir, `${getReportBaseName(profile)}.json`))
}

function findFirstAge(report: SimulationReport, predicate: (season: SeasonReport) => boolean) {
  const season = report.seasons.find(predicate)
  return season?.playerAtNextSeasonOpen.age ?? null
}

function isMajorFinal(tournament: SeasonTournament) {
  return /major|world championship|tour championship|masters-style|champion of champions/i.test(`${tournament.type} ${tournament.name}`)
    && /final/i.test(tournament.result)
}

function isWorldTitle(tournament: SeasonTournament) {
  return /world championship/i.test(tournament.name) && /winner/i.test(tournament.result)
}

function collectAiMetrics(report: SimulationReport) {
  const aiTop16 = new Set<string>()
  let totalGains = 0
  let totalLosses = 0
  let totalChurn = 0
  let totalQSchoolWinners = 0
  let totalTop16Events = 0
  let totalTop16Players = 0
  let totalTop64Events = 0
  let totalTop64Players = 0
  let totalBottomTourEvents = 0
  let totalBottomTourPlayers = 0
  let totalQTourEvents = 0
  let totalQTourPlayers = 0
  let totalQSchoolEntrants = 0
  let previousRows: PlayerSnapshotRow[] | null = null

  for (const season of report.seasons) {
    const rows = readJsonFile<PlayerSnapshotRow[]>(path.join(snapshotDir, `players-${seasonToFileSlug(season.season)}.json`))
    const aiRows = rows.filter((row) => !row.isHumanPlayer)
    for (const row of aiRows) {
      if ((row.worldRank ?? 999) <= 16) {
        aiTop16.add(row.name)
      }
    }

    const top16Rows = aiRows.filter((row) => (row.worldRank ?? 999) <= 16)
    const top64Rows = aiRows.filter((row) => (row.worldRank ?? 999) <= 64)
    const bottomTourRows = aiRows.filter((row) => (row.worldRank ?? 999) >= 65 && (row.worldRank ?? 999) <= 128 && row.isOnMainTour)
    const qTourRows = aiRows.filter((row) => row.eventAccessBand === 'Q Tour')
    totalTop16Events += top16Rows.reduce((sum, row) => sum + (row.enteredEventsCount ?? 0), 0)
    totalTop16Players += top16Rows.length
    totalTop64Events += top64Rows.reduce((sum, row) => sum + (row.enteredEventsCount ?? 0), 0)
    totalTop64Players += top64Rows.length
    totalBottomTourEvents += bottomTourRows.reduce((sum, row) => sum + (row.enteredEventsCount ?? 0), 0)
    totalBottomTourPlayers += bottomTourRows.length
    totalQTourEvents += qTourRows.reduce((sum, row) => sum + (row.qTourEventsEntered ?? 0), 0)
    totalQTourPlayers += qTourRows.length
    totalQSchoolEntrants += aiRows.filter((row) => (row.qSchoolEventsEntered ?? 0) > 0).length

    const gains = aiRows.filter((row) => row.isOnMainTour && row.tourCardYear === 1).length
    const qSchoolWinners = aiRows.filter((row) => row.isOnMainTour && row.tourCardYear === 1 && row.tourCardSource === 'Q School').length
    let losses = 0
    if (previousRows) {
      const previousByName = new Map(previousRows.filter((row) => !row.isHumanPlayer).map((row) => [row.name, row]))
      losses = aiRows.filter((row) => {
        const previous = previousByName.get(row.name)
        return Boolean(previous?.isTourCardHolder) && !row.isTourCardHolder
      }).length
    }

    totalGains += gains
    totalLosses += losses
    totalChurn += gains + losses
    totalQSchoolWinners += qSchoolWinners
    previousRows = rows
  }

  const seasonCount = Math.max(1, report.seasons.length)
  return {
    aiTop16Count: aiTop16.size,
    aiCardGainsPerSeason: totalGains / seasonCount,
    aiCardLossesPerSeason: totalLosses / seasonCount,
    aiMainTourChurnPerSeason: totalChurn / seasonCount,
    aiQSchoolWinnersPerSeason: totalQSchoolWinners / seasonCount,
    aiTop16EventsPerSeason: totalTop16Players > 0 ? totalTop16Events / totalTop16Players : 0,
    aiTop64EventsPerSeason: totalTop64Players > 0 ? totalTop64Events / totalTop64Players : 0,
    aiBottomTourEventsPerSeason: totalBottomTourPlayers > 0 ? totalBottomTourEvents / totalBottomTourPlayers : 0,
    aiQTourEventsPerSeason: totalQTourPlayers > 0 ? totalQTourEvents / totalQTourPlayers : 0,
    aiQSchoolEntrantsPerSeason: totalQSchoolEntrants / seasonCount,
  }
}

function collectHumanMetrics(report: SimulationReport) {
  const averageTournamentsPerSeason = average(report.seasons.map((season) => season.playerEntries.totalTournamentsEntered)) ?? 0
  const averageMatchesPerSeason = average(report.seasons.map((season) => season.performance.matchesPlayed)) ?? 0
  const averageRankingEventsPerSeason = average(report.seasons.map((season) => season.playerEntries.rankingEventsEntered)) ?? 0
  const averageMajorsPerSeason = average(report.seasons.map((season) => season.playerEntries.majorsEntered)) ?? 0
  const averageWorldChampionshipEntries = average(report.seasons.map((season) => (season.playerEntries.worldChampionshipMainDrawEntered ? 1 : 0) + (season.playerEntries.worldChampionshipQualifyingEntered ? 1 : 0))) ?? 0
  const rowsBySeason = report.seasons.map((season) => readJsonFile<PlayerSnapshotRow[]>(path.join(snapshotDir, `players-${seasonToFileSlug(season.season)}.json`)))
  const humanRows = rowsBySeason.map((rows) => rows.find((row) => row.isHumanPlayer)).filter((row): row is PlayerSnapshotRow => row != null)
  const preProRows = humanRows.filter((row) => !row.isOnMainTour)
  const proRows = humanRows.filter((row) => row.isOnMainTour)

  return {
    averageTournamentsPerSeason,
    averageMatchesPerSeason,
    averageRankingEventsPerSeason,
    averageMajorsPerSeason,
    averageWorldChampionshipEntries,
    averageQTourQSchoolEventsBeforeTurningPro: average(preProRows.map((row) => (row.qTourEventsEntered ?? 0) + (row.qSchoolEventsEntered ?? 0))) ?? 0,
    averageProEventsAfterTurningPro: average(proRows.map((row) => row.enteredEventsCount ?? 0)) ?? 0,
    calendarValidationWarnings: report.seasons.reduce((sum, season) => sum + season.calendar.validationWarnings.length, 0),
  }
}

function buildMarkdown(runs: number, aggregates: Record<ManagedSupportProfile, AggregateMetrics>) {
  const lines: string[] = []
  const thresholdWarnings = buildThresholdWarnings(runs, aggregates)
  lines.push(`# Repeated Seed Audit (${runs} runs)`)
  lines.push('')
  lines.push(`- ${getCalendarModelSummary()}`)
  lines.push('')

  lines.push('## Threshold Checks')
  lines.push(`- min World Champion finishes target: 0/${runs} | observed ${aggregates.worst.worldChampionCount}/${runs}`)
  lines.push(`- middle World Champion finishes target: 0-2/${runs} | observed ${aggregates.middle.worldChampionCount}/${runs}`)
  lines.push(`- max World Champion finishes target: 3-${runs}/${runs} | observed ${aggregates.best.worldChampionCount}/${runs}`)
  lines.push(`- max pro events after turning pro target: >= 8.0 | observed ${formatAverage(aggregates.best.averageProEventsAfterTurningPro)}`)
  lines.push(`- Threshold warnings: ${thresholdWarnings.length === 0 ? 'none' : thresholdWarnings.join(' | ')}`)
  lines.push('')

  for (const profile of ['worst', 'middle', 'best'] as ManagedSupportProfile[]) {
    const metrics = aggregates[profile]
    lines.push(`## ${getProfileLabel(profile)}`)
    lines.push(`- World champion finishes: ${metrics.worldChampionCount}/${runs}`)
    lines.push(`- Average age of first tour card: ${formatAverage(metrics.firstTourCardAges)}`)
    lines.push(`- Average age of first top 64: ${formatAverage(metrics.firstTop64Ages)}`)
    lines.push(`- Average age of first top 16: ${formatAverage(metrics.firstTop16Ages)}`)
    lines.push(`- Average age of first major final: ${formatAverage(metrics.firstMajorFinalAges)}`)
    lines.push(`- Average age of first World Championship title: ${formatAverage(metrics.firstWorldTitleAges)}`)
    lines.push(`- Number of AI players reaching top 16: ${formatAverage(metrics.aiTop16Counts)}`)
    lines.push(`- AI card gains per season: ${formatAverage(metrics.aiCardGainsPerSeason)}`)
    lines.push(`- AI card losses per season: ${formatAverage(metrics.aiCardLossesPerSeason)}`)
    lines.push(`- Average main-tour churn per season: ${formatAverage(metrics.aiMainTourChurnPerSeason)}`)
    lines.push(`- Average Q School card winners per season: ${formatAverage(metrics.aiQSchoolWinnersPerSeason)}`)
    lines.push(`- Average tournaments per season: ${formatAverage(metrics.averageTournamentsPerSeason)}`)
    lines.push(`- Average matches per season: ${formatAverage(metrics.averageMatchesPerSeason)}`)
    lines.push(`- Average ranking events per season: ${formatAverage(metrics.averageRankingEventsPerSeason)}`)
    lines.push(`- Average majors per season: ${formatAverage(metrics.averageMajorsPerSeason)}`)
    lines.push(`- Average World Championship entries per season: ${formatAverage(metrics.averageWorldChampionshipEntries)}`)
    lines.push(`- Average Q Tour / Q School events before turning pro: ${formatAverage(metrics.averageQTourQSchoolEventsBeforeTurningPro)}`)
    lines.push(`- Average pro events after turning pro: ${formatAverage(metrics.averageProEventsAfterTurningPro)}`)
    lines.push(`- AI top-16 events per season: ${formatAverage(metrics.aiTop16EventsPerSeason)}`)
    lines.push(`- AI top-64 events per season: ${formatAverage(metrics.aiTop64EventsPerSeason)}`)
    lines.push(`- AI bottom-tour events per season: ${formatAverage(metrics.aiBottomTourEventsPerSeason)}`)
    lines.push(`- AI Q Tour events per season: ${formatAverage(metrics.aiQTourEventsPerSeason)}`)
    lines.push(`- AI Q School entrants per season: ${formatAverage(metrics.aiQSchoolEntrantsPerSeason)}`)
    lines.push(`- Calendar validation warnings across runs: ${formatAverage(metrics.calendarValidationWarnings)}`)
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function main() {
  const runsArg = process.argv.find((entry) => entry.startsWith('--runs='))
  const runs = Math.max(1, Number.parseInt(runsArg?.split('=')[1] ?? '5', 10) || 5)
  const aggregates: Record<ManagedSupportProfile, AggregateMetrics> = {
    worst: {
      worldChampionCount: 0,
      firstTourCardAges: [],
      firstTop64Ages: [],
      firstTop16Ages: [],
      firstMajorFinalAges: [],
      firstWorldTitleAges: [],
      aiTop16Counts: [],
      aiCardGainsPerSeason: [],
      aiCardLossesPerSeason: [],
      aiMainTourChurnPerSeason: [],
      aiQSchoolWinnersPerSeason: [],
      averageTournamentsPerSeason: [],
      averageMatchesPerSeason: [],
      averageRankingEventsPerSeason: [],
      averageMajorsPerSeason: [],
      averageWorldChampionshipEntries: [],
      averageQTourQSchoolEventsBeforeTurningPro: [],
      averageProEventsAfterTurningPro: [],
      aiTop16EventsPerSeason: [],
      aiTop64EventsPerSeason: [],
      aiBottomTourEventsPerSeason: [],
      aiQTourEventsPerSeason: [],
      aiQSchoolEntrantsPerSeason: [],
      calendarValidationWarnings: [],
    },
    middle: {
      worldChampionCount: 0,
      firstTourCardAges: [],
      firstTop64Ages: [],
      firstTop16Ages: [],
      firstMajorFinalAges: [],
      firstWorldTitleAges: [],
      aiTop16Counts: [],
      aiCardGainsPerSeason: [],
      aiCardLossesPerSeason: [],
      aiMainTourChurnPerSeason: [],
      aiQSchoolWinnersPerSeason: [],
      averageTournamentsPerSeason: [],
      averageMatchesPerSeason: [],
      averageRankingEventsPerSeason: [],
      averageMajorsPerSeason: [],
      averageWorldChampionshipEntries: [],
      averageQTourQSchoolEventsBeforeTurningPro: [],
      averageProEventsAfterTurningPro: [],
      aiTop16EventsPerSeason: [],
      aiTop64EventsPerSeason: [],
      aiBottomTourEventsPerSeason: [],
      aiQTourEventsPerSeason: [],
      aiQSchoolEntrantsPerSeason: [],
      calendarValidationWarnings: [],
    },
    best: {
      worldChampionCount: 0,
      firstTourCardAges: [],
      firstTop64Ages: [],
      firstTop16Ages: [],
      firstMajorFinalAges: [],
      firstWorldTitleAges: [],
      aiTop16Counts: [],
      aiCardGainsPerSeason: [],
      aiCardLossesPerSeason: [],
      aiMainTourChurnPerSeason: [],
      aiQSchoolWinnersPerSeason: [],
      averageTournamentsPerSeason: [],
      averageMatchesPerSeason: [],
      averageRankingEventsPerSeason: [],
      averageMajorsPerSeason: [],
      averageWorldChampionshipEntries: [],
      averageQTourQSchoolEventsBeforeTurningPro: [],
      averageProEventsAfterTurningPro: [],
      aiTop16EventsPerSeason: [],
      aiTop64EventsPerSeason: [],
      aiBottomTourEventsPerSeason: [],
      aiQTourEventsPerSeason: [],
      aiQSchoolEntrantsPerSeason: [],
      calendarValidationWarnings: [],
    },
  }

  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    for (const profile of ['worst', 'middle', 'best'] as ManagedSupportProfile[]) {
      const report = runSimulation(profile)
      const metrics = aggregates[profile]
      if ((report.finalPlayer.competitiveStatus || report.supportMetrics?.finalCompetitiveStatus || '').includes('World Champion')) {
        metrics.worldChampionCount += 1
      }

      const firstTourCardAge = findFirstAge(report, (season) => season.pathway.nextSeasonOpen.hasTourCard)
      const firstTop64Age = findFirstAge(report, (season) => season.pathway.nextSeasonOpen.worldRank != null && season.pathway.nextSeasonOpen.worldRank <= 64)
      const firstTop16Age = findFirstAge(report, (season) => season.pathway.nextSeasonOpen.worldRank != null && season.pathway.nextSeasonOpen.worldRank <= 16)
      const firstMajorFinalAge = findFirstAge(report, (season) => season.tournaments.some((tournament) => isMajorFinal(tournament)))
      const firstWorldTitleAge = findFirstAge(report, (season) => season.tournaments.some((tournament) => isWorldTitle(tournament)))
      if (firstTourCardAge != null) metrics.firstTourCardAges.push(firstTourCardAge)
      if (firstTop64Age != null) metrics.firstTop64Ages.push(firstTop64Age)
      if (firstTop16Age != null) metrics.firstTop16Ages.push(firstTop16Age)
      if (firstMajorFinalAge != null) metrics.firstMajorFinalAges.push(firstMajorFinalAge)
      if (firstWorldTitleAge != null) metrics.firstWorldTitleAges.push(firstWorldTitleAge)

      const aiMetrics = collectAiMetrics(report)
      const humanMetrics = collectHumanMetrics(report)
      metrics.aiTop16Counts.push(aiMetrics.aiTop16Count)
      metrics.aiCardGainsPerSeason.push(aiMetrics.aiCardGainsPerSeason)
      metrics.aiCardLossesPerSeason.push(aiMetrics.aiCardLossesPerSeason)
      metrics.aiMainTourChurnPerSeason.push(aiMetrics.aiMainTourChurnPerSeason)
      metrics.aiQSchoolWinnersPerSeason.push(aiMetrics.aiQSchoolWinnersPerSeason)
      metrics.averageTournamentsPerSeason.push(humanMetrics.averageTournamentsPerSeason)
      metrics.averageMatchesPerSeason.push(humanMetrics.averageMatchesPerSeason)
      metrics.averageRankingEventsPerSeason.push(humanMetrics.averageRankingEventsPerSeason)
      metrics.averageMajorsPerSeason.push(humanMetrics.averageMajorsPerSeason)
      metrics.averageWorldChampionshipEntries.push(humanMetrics.averageWorldChampionshipEntries)
      metrics.averageQTourQSchoolEventsBeforeTurningPro.push(humanMetrics.averageQTourQSchoolEventsBeforeTurningPro)
      metrics.averageProEventsAfterTurningPro.push(humanMetrics.averageProEventsAfterTurningPro)
      metrics.aiTop16EventsPerSeason.push(aiMetrics.aiTop16EventsPerSeason)
      metrics.aiTop64EventsPerSeason.push(aiMetrics.aiTop64EventsPerSeason)
      metrics.aiBottomTourEventsPerSeason.push(aiMetrics.aiBottomTourEventsPerSeason)
      metrics.aiQTourEventsPerSeason.push(aiMetrics.aiQTourEventsPerSeason)
      metrics.aiQSchoolEntrantsPerSeason.push(aiMetrics.aiQSchoolEntrantsPerSeason)
      metrics.calendarValidationWarnings.push(humanMetrics.calendarValidationWarnings)
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(path.join(reportsDir, 'repeated-seed-ai-balance-audit.md'), buildMarkdown(runs, aggregates))
}

main()
