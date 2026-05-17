import type { Coach, CoachContractOption } from '../types/game'

export function getCoachContractOptions(coach: Pick<Coach, 'weeklyCost'>): CoachContractOption[] {
  return [
    { label: '8 Week Trial', weeklyCost: coach.weeklyCost, totalCost: coach.weeklyCost * 8, selected: true },
    { label: '16 Week Deal', weeklyCost: Math.round(coach.weeklyCost * 0.95), totalCost: Math.round(coach.weeklyCost * 0.95) * 16 },
    { label: 'Season Contract', weeklyCost: Math.round(coach.weeklyCost * 0.9), totalCost: Math.round(coach.weeklyCost * 0.9) * 24 },
  ]
}

export function getCoachContractWeeks(contractLabel?: string) {
  if (/16/i.test(contractLabel ?? '')) return 16
  if (/season|24/i.test(contractLabel ?? '')) return 24
  return 8
}

export function getCoachSlotLimit(ranking: number, reputation: number) {
  return ranking <= 16 || reputation >= 58 ? 2 : 1
}

export function getCoachAvailability(coach: Pick<Coach, 'minimumRanking' | 'minimumReputation' | 'unlockLabel'>, ranking: number, reputation: number) {
  const minimumRanking = coach.minimumRanking ?? 999
  const minimumReputation = coach.minimumReputation ?? 0

  if (ranking > minimumRanking && reputation < minimumReputation) {
    return {
      available: false,
      reason: coach.unlockLabel ?? `Unlock at Top ${minimumRanking} or ${minimumReputation} reputation`,
    }
  }

  return { available: true, reason: 'Available now' }
}