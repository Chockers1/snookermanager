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

  return {
    tournamentId: options.tournamentId,
    tournamentName: options.tournamentName,
    fieldSize,
    roundReached,
    resultLabel,
    matchesPlayed: roundRecord?.expectedMatches ?? 0,
    wins: roundRecord?.expectedWins ?? 0,
    losses: roundRecord?.expectedLosses ?? 0,
    isTitle: finishFlags.isTitle,
    isFinal: finishFlags.isFinal,
    isSemiFinal: finishFlags.isSemiFinal,
    isQuarterFinal: finishFlags.isQuarterFinal,
    isDeepRun: finishFlags.isDeepRun,
    isRankingTitle: finishFlags.isTitle && Boolean(options.isRankingTitle),
    isMajorTitle: finishFlags.isTitle && Boolean(options.isMajorTitle),
    isWorldTitle: finishFlags.isTitle && Boolean(options.isWorldTitle),
    prizeMoney: zeroOutAwards ? 0 : (options.prizeMoney ?? 0),
    rankingPoints: zeroOutAwards ? 0 : (options.rankingPoints ?? 0),
    levelBucket: options.levelBucket,
    reportingClass: options.reportingClass,
  }
}