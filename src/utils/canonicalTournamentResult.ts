import type { Tournament } from '../types/game'
import { getExpectedRoundRecord, getTournamentResultExpectation, normalizeTournamentRoundLabel, resolveTournamentFormat } from '../data/tournamentFormats'

type TournamentFormatLookup = Pick<Tournament, 'name' | 'type' | 'eventClass' | 'rankingType' | 'stageId' | 'formatId'>

export type CanonicalTournamentResult = {
  tournamentId: string
  tournamentName: string
  fieldSize: number | null
  roundReached: string
  resultLabel: string
  matchesPlayed: number
  wins: number
  losses: number
  isTitle: boolean
  isFinal: boolean
  isSemiFinal: boolean
  isQuarterFinal: boolean
  isDeepRun: boolean
  isRankingTitle: boolean
  isMajorTitle: boolean
  isWorldTitle: boolean
  prizeMoney: number
  rankingPoints: number
  levelBucket?: string
  reportingClass?: string
}

type CanonicalTournamentResultOptions = {
  tournamentId: string
  tournamentName: string
  resultLabel: string
  prizeMoney?: number
  rankingPoints?: number
  playedRounds?: string[]
  levelBucket?: string
  reportingClass?: string
  isRankingTitle?: boolean
  isMajorTitle?: boolean
  isWorldTitle?: boolean
}

const NON_COMPETITIVE_RESULT_LABELS = [
  'Skipped',
  'Entered',
  'Travel booked',
  'Season ended before completion',
  'High-cost event not entered',
  'Completed',
] as const

/** Describe the best recorded finish without confusing a semi-final with a final. */
export function getBestRecordedFinish(results: ReadonlyArray<{ result: string }>) {
  const tiers: Array<[RegExp, string]> = [
    [/\b(winner|champion)\b/i, 'Winner'],
    [/^(?:lost in |reached )?final$|^runner[- ]?up$/i, 'Final'],
    [/semi[- ]?final/i, 'Semi Final'],
    [/quarter[- ]?final/i, 'Quarter Final'],
    [/last 16/i, 'Last 16'],
  ]
  for (const [pattern, label] of tiers) {
    if (results.some((entry) => pattern.test(entry.result))) return label
  }
  return 'No main draw win'
}

export function isNonCompetitiveTournamentResult(resultLabel: string) {
  return NON_COMPETITIVE_RESULT_LABELS.some((label) => label.toLowerCase() === resultLabel.trim().toLowerCase())
}

function getCanonicalRoundReached(tournament: TournamentFormatLookup, resultLabel: string) {
  if (isNonCompetitiveTournamentResult(resultLabel)) {
    return resultLabel
  }

  const expectation = getTournamentResultExpectation(tournament, resultLabel)
  return expectation?.roundReached ?? resultLabel
}

export function getCanonicalFinishFlags(roundReached: string, resultLabel: string) {
  const normalizedRound = normalizeTournamentRoundLabel(roundReached)
  const isTitle = /winner|champion/i.test(resultLabel)
  const isFinal = isTitle || normalizedRound === 'final'
  const isSemiFinal = isFinal || normalizedRound === 'semi final'
  const isQuarterFinal = isSemiFinal || normalizedRound === 'quarter final'
  const isDeepRun = isQuarterFinal

  return {
    isTitle,
    isFinal,
    isSemiFinal,
    isQuarterFinal,
    isDeepRun,
  }
}

export function buildCanonicalTournamentResult(
  tournament: TournamentFormatLookup,
  options: CanonicalTournamentResultOptions,
): CanonicalTournamentResult {
  const format = resolveTournamentFormat(tournament)
  const fieldSize = format.fieldSize ?? null
  const resultLabel = options.resultLabel
  const roundReached = getCanonicalRoundReached(tournament, resultLabel)
  const roundRecord = isNonCompetitiveTournamentResult(resultLabel)
    ? null
    : getExpectedRoundRecord(fieldSize, resultLabel)
  const finishFlags = getCanonicalFinishFlags(roundReached, resultLabel)
  const zeroOutAwards = isNonCompetitiveTournamentResult(resultLabel)
    && /skipped|high-cost event not entered|entered|travel booked|season ended before completion|completed/i.test(resultLabel)
  const playedRoundResults = options.playedRounds
    ?.map((round) => {
      const match = round.match(/^(.+?):\s+(Won|Lost|Drawn)\b/i)
      return match?.[1] && match[2] ? { round: match[1].trim(), result: match[2] } : null
    })
    .filter((round): round is { round: string, result: string } => round != null) ?? []
  const playedRoundWins = playedRoundResults.filter((round) => round.result === 'Won').length
  const playedRoundLosses = playedRoundResults.filter((round) => round.result === 'Lost').length
  const playedRoundReached = playedRoundResults.at(-1)?.round ?? roundReached
  const playedRoundFlags = playedRoundResults.length > 0
    ? getCanonicalFinishFlags(playedRoundReached, resultLabel)
    : finishFlags

  return {
    tournamentId: options.tournamentId,
    tournamentName: options.tournamentName,
    fieldSize,
    roundReached: playedRoundReached,
    resultLabel,
    matchesPlayed: playedRoundResults.length > 0 ? playedRoundResults.length : roundRecord?.expectedMatches ?? 0,
    wins: playedRoundResults.length > 0 ? playedRoundWins : roundRecord?.expectedWins ?? 0,
    losses: playedRoundResults.length > 0 ? playedRoundLosses : roundRecord?.expectedLosses ?? 0,
    isTitle: playedRoundFlags.isTitle,
    isFinal: playedRoundFlags.isFinal,
    isSemiFinal: playedRoundFlags.isSemiFinal,
    isQuarterFinal: playedRoundFlags.isQuarterFinal,
    isDeepRun: playedRoundFlags.isDeepRun,
    isRankingTitle: playedRoundFlags.isTitle && Boolean(options.isRankingTitle),
    isMajorTitle: playedRoundFlags.isTitle && Boolean(options.isMajorTitle),
    isWorldTitle: playedRoundFlags.isTitle && Boolean(options.isWorldTitle),
    prizeMoney: zeroOutAwards ? 0 : (options.prizeMoney ?? 0),
    rankingPoints: zeroOutAwards ? 0 : (options.rankingPoints ?? 0),
    levelBucket: options.levelBucket,
    reportingClass: options.reportingClass,
  }
}
