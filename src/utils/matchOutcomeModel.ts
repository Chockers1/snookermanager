export const EXPECTED_WIN_RATE_BANDS = {
  youth: { min: 0.35, normal: 0.5, elite: 0.75 },
  amateur: { min: 0.3, normal: 0.5, elite: 0.75 },
  qTour: { min: 0.25, normal: 0.45, elite: 0.7 },
  rookiePro: { min: 0.15, normal: 0.3, elite: 0.5 },
  bottomTour65to128: { min: 0.15, normal: 0.3, elite: 0.45 },
  top64: { min: 0.3, normal: 0.45, elite: 0.6 },
  top32: { min: 0.4, normal: 0.55, elite: 0.68 },
  top16: { min: 0.5, normal: 0.62, elite: 0.75 },
  top4: { min: 0.6, normal: 0.7, elite: 0.82 },
  worldChampion: { min: 0.65, normal: 0.75, elite: 0.88 },
} as const

export type ExpectedWinRateTier = keyof typeof EXPECTED_WIN_RATE_BANDS

export type OpponentRankBand = 'Top 16' | 'Top 32' | 'Top 64' | '65-128' | 'Q Tour/amateur' | 'youth'

type ExpectedWinRateContext = {
  worldRank?: number | null
  competitiveStatus?: string | null
  careerPhase?: string | null
  hasTourCard?: boolean
}

export function getExpectedWinRateTier(context: ExpectedWinRateContext): ExpectedWinRateTier {
  const worldRank = context.worldRank ?? null
  const status = `${context.competitiveStatus ?? ''}`.toLowerCase()
  const phase = `${context.careerPhase ?? ''}`.toLowerCase()

  if (phase.includes('youth')) return 'youth'
  if (phase.includes('amateur')) return 'amateur'
  if (phase.includes('q tour') || status.includes('q tour')) return 'qTour'
  if (status.includes('world champion') || phase.includes('world champion')) return 'worldChampion'

  if (worldRank != null && Number.isFinite(worldRank)) {
    if (worldRank <= 1 && (status.includes('world champion') || status.includes('champion'))) return 'worldChampion'
    if (worldRank <= 4) return 'top4'
    if (worldRank <= 16) return 'top16'
    if (worldRank <= 32) return 'top32'
    if (worldRank <= 64) return 'top64'
    if (worldRank <= 128 && context.hasTourCard !== false) return 'bottomTour65to128'
  }

  if (status.includes('rookie')) return 'rookiePro'
  if (context.hasTourCard) return 'bottomTour65to128'
  return 'amateur'
}

export function getExpectedWinRateBand(context: ExpectedWinRateContext) {
  return EXPECTED_WIN_RATE_BANDS[getExpectedWinRateTier(context)]
}

export function getOpponentRankBand(opponentRanking?: number | null, tournamentClass?: string | null): OpponentRankBand {
  const normalizedClass = `${tournamentClass ?? ''}`.toLowerCase()

  if (normalizedClass === 'youth') return 'youth'
  if (['amateur', 'qtour', 'qschool'].includes(normalizedClass)) return 'Q Tour/amateur'

  if (opponentRanking == null || !Number.isFinite(opponentRanking)) {
    return normalizedClass === 'youth' ? 'youth' : 'Q Tour/amateur'
  }

  if (opponentRanking <= 16) return 'Top 16'
  if (opponentRanking <= 32) return 'Top 32'
  if (opponentRanking <= 64) return 'Top 64'
  if (opponentRanking <= 128) return '65-128'
  return 'Q Tour/amateur'
}

export function getRoundDifficultyBonus(round: string, tournamentClass?: string | null) {
  const normalizedRound = `${round}`.toLowerCase()
  const normalizedClass = `${tournamentClass ?? ''}`.toLowerCase().replace(/[^a-z]/g, '')
  const eliteEvent = ['eliteinvitational', 'worldchampionshipmain', 'ukmajor'].includes(normalizedClass)

  if (normalizedRound.includes('final')) return eliteEvent ? 18 : 13
  if (normalizedRound.includes('semi')) return eliteEvent ? 12 : 9
  if (normalizedRound.includes('quarter')) return eliteEvent ? 8 : 6
  if (normalizedRound.includes('last 16')) return eliteEvent ? 4 : 2
  return eliteEvent ? 3 : 1
}

export function getRoundPressureMultiplier(round: string, tournamentClass?: string | null) {
  const normalizedRound = `${round}`.toLowerCase()
  const normalizedClass = `${tournamentClass ?? ''}`.toLowerCase().replace(/[^a-z]/g, '')
  const eliteEvent = ['eliteinvitational', 'worldchampionshipmain', 'ukmajor'].includes(normalizedClass)

  if (normalizedRound.includes('final')) return eliteEvent ? 1.6 : 1.35
  if (normalizedRound.includes('semi')) return eliteEvent ? 1.3 : 1.15
  if (normalizedRound.includes('quarter')) return eliteEvent ? 1.15 : 1.05
  return eliteEvent ? 1.05 : 1
}

function combination(total: number, chosen: number) {
  if (chosen < 0 || chosen > total) return 0
  if (chosen === 0 || chosen === total) return 1

  const k = Math.min(chosen, total - chosen)
  let result = 1
  for (let index = 1; index <= k; index += 1) {
    result = (result * (total - k + index)) / index
  }
  return result
}

export function getMatchWinProbabilityFromFrameWinProbability(frameWinProbability: number, bestOf: number) {
  const frameProbability = Math.max(0.001, Math.min(0.999, frameWinProbability / 100))
  const framesNeeded = Math.ceil(bestOf / 2)
  let totalProbability = 0

  for (let wins = framesNeeded; wins <= bestOf; wins += 1) {
    totalProbability += combination(bestOf, wins) * (frameProbability ** wins) * ((1 - frameProbability) ** (bestOf - wins))
  }

  return totalProbability * 100
}

export function convertMatchWinProbabilityToFrameWinProbability(matchWinProbability: number, bestOf: number) {
  const targetProbability = Math.max(0.1, Math.min(99.9, matchWinProbability))
  let low = 0.1
  let high = 99.9

  for (let index = 0; index < 28; index += 1) {
    const mid = (low + high) / 2
    const resolvedProbability = getMatchWinProbabilityFromFrameWinProbability(mid, bestOf)

    if (resolvedProbability < targetProbability) {
      low = mid
    } else {
      high = mid
    }
  }

  return (low + high) / 2
}