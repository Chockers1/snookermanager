export type CpuRetirementProfile = {
  alreadyRetired: boolean
  nextAge: number
  hasTourCard: boolean
  worldRank: number
  recentWins: number
  recentLosses: number
  recentTitles: number
}

export function shouldRetireCpuPlayer(profile: CpuRetirementProfile) {
  if (profile.alreadyRetired) return true
  if (profile.nextAge >= 70) return true
  if (profile.nextAge < 55) return false

  const recentMatches = profile.recentWins + profile.recentLosses
  const stillCompetitive = profile.hasTourCard
    && profile.worldRank <= 64
    && (profile.recentTitles > 0 || profile.recentWins >= 5 || (recentMatches >= 8 && profile.recentWins / recentMatches >= 0.42))

  if (stillCompetitive) return profile.nextAge >= 64
  if (!profile.hasTourCard && profile.recentTitles === 0) return profile.nextAge >= 58
  return profile.nextAge >= 61 && profile.recentWins < 4
}
