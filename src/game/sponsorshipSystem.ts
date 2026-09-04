import type { Match, SponsorDeal, Tournament } from '../types/game'
import { normalizeTournamentRoundLabel } from '../data/tournamentFormats'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getSponsorPerk(category: string): NonNullable<SponsorDeal['perk']> {
  const value = category.toLowerCase()
  if (/cue|chalk|equipment|accessor/.test(value)) return 'Equipment'
  if (/travel|hotel|air|transport|logistic/.test(value)) return 'Travel'
  if (/nutrition|health|fitness|wellness|hospitality/.test(value)) return 'Recovery'
  if (/media|social|broadcast|clothing|tailor/.test(value)) return 'Publicity'
  return 'None'
}

export function getSponsorObligationProfile(sponsor: Pick<SponsorDeal, 'category' | 'brandFit' | 'risk' | 'behaviour'>) {
  const riskLoad = sponsor.risk === 'High' ? 2 : sponsor.risk === 'Medium' ? 1 : 0
  const behaviourLoad = /weekly|appearance|media|social|content|event/i.test(sponsor.behaviour ?? '') ? 1 : 0
  const fitRelief = sponsor.brandFit >= 82 ? 1 : sponsor.brandFit < 55 ? -1 : 0
  const obligationLoad = clamp(2 + riskLoad + behaviourLoad - fitRelief, 1, 5)
  return { obligationLoad, weeklyFatigueCost: Math.max(0, obligationLoad - 2), perk: getSponsorPerk(sponsor.category) }
}

export function calculateSponsorMatchBonus(
  sponsor: SponsorDeal,
  tournament: Tournament,
  match: Pick<Match, 'round' | 'result' | 'centuries' | 'highestBreak'>,
  playerRanking: number | null,
  careerCenturies = match.centuries,
) {
  const clause = sponsor.bonusClause ?? ''
  const amounts = [...clause.matchAll(/£([\d,]+)/g)].map((value) => Number(value[1].replaceAll(',', '')))
  if (amounts.length === 0 || /\bnone\b|no performance/i.test(clause)) return null
  const round = normalizeTournamentRoundLabel(match.round)
  let amount = 0
  let reason = ''

  if (/event win/i.test(clause) && match.result === 'Won' && round === 'Final') [amount, reason] = [amounts[0], 'event win']
  else if (/century break|centuries/i.test(clause) && (/per 10/i.test(clause) ? careerCenturies >= 10 : match.centuries > 0)) {
    const milestone = Math.floor(careerCenturies / 10) * 10
    amount = amounts[0] * (/per 10/i.test(clause) ? 1 : match.centuries)
    reason = /per 10/i.test(clause) ? `${milestone} career centuries` : `${match.centuries} century break${match.centuries === 1 ? '' : 's'}`
  } else if (/semi final|\bSF\b/i.test(clause) && round === 'Semi Final' && match.result === 'Won') [amount, reason] = [amounts.at(-1) ?? amounts[0], 'semi-final qualification']
  else if (/quarter final|\bQF\b/i.test(clause) && round === 'Quarter Final' && match.result === 'Won') [amount, reason] = [amounts[0], 'quarter-final qualification']
  else if (/last 16/i.test(clause) && round === 'Last 16') [amount, reason] = [amounts[0], 'Last 16 appearance']
  else if (/top 16/i.test(clause) && playerRanking != null && playerRanking <= 16) [amount, reason] = [amounts[0], 'Top 16 ranking']
  else if (/top 32/i.test(clause) && playerRanking != null && playerRanking <= 32) [amount, reason] = [amounts[0], 'Top 32 ranking']
  else if (/venue appearance|TV table appearance/i.test(clause) && round === 'Last 16') [amount, reason] = [amounts[0], /TV table/i.test(clause) ? 'televised appearance' : 'venue appearance']
  else if (/highest break/i.test(clause) && match.highestBreak >= 100) [amount, reason] = [amounts[0], 'century-high break']

  if (amount <= 0) return null
  const persistentMilestone = /Top 16 ranking|Top 32 ranking|career centuries/i.test(reason)
  return { amount, reason, key: persistentMilestone ? `career:${reason}` : `${tournament.id}:${reason}` }
}
