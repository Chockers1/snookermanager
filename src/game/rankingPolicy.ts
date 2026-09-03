export type ProTourAccessBand = 'top16' | 'top32' | 'top64' | 'bottomTour' | 'offTour'

export function getProTourAccessBand(worldRank: number, hasTourCard: boolean): ProTourAccessBand {
  if (worldRank <= 16) return 'top16'
  if (worldRank <= 32) return 'top32'
  if (worldRank <= 64) return 'top64'
  if (worldRank <= 128 && hasTourCard) return 'bottomTour'
  return 'offTour'
}

export function getSeededProtection(accessBand: ProTourAccessBand) {
  if (accessBand === 'top16') return 3
  if (accessBand === 'top32') return 2
  if (accessBand === 'top64') return 1
  return 0
}
