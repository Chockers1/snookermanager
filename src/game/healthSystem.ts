export type TreatmentEffect = {
  id: string
  title: string
  cost: number
  fatigue: number
  strain: number
  burnout: number
  injuryWeeks: number
}

export const treatmentEffects: TreatmentEffect[] = [
  { id: 'treat-1', title: 'Rest', cost: 0, fatigue: 12, strain: 14, burnout: 10, injuryWeeks: 1 },
  { id: 'treat-2', title: 'Physio Treatment', cost: 180, fatigue: 9, strain: 28, burnout: 4, injuryWeeks: 2 },
  { id: 'treat-3', title: 'Reduced Training', cost: 50, fatigue: 7, strain: 18, burnout: 8, injuryWeeks: 1 },
  { id: 'treat-4', title: 'Fitness Plan', cost: 150, fatigue: 6, strain: 12, burnout: 5, injuryWeeks: 1 },
  { id: 'treat-5', title: 'Medical Review', cost: 120, fatigue: 5, strain: 20, burnout: 6, injuryWeeks: 2 },
]

export function getTreatmentEffect(optionId?: string) {
  return treatmentEffects.find((item) => item.id === optionId) ?? treatmentEffects[0]
}
