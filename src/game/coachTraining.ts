import type { Coach } from '../types/game';

/** The same specialisms and rates power training settlement and staff descriptions. */
export const COACH_TRAINING_SKILLS: Record<Coach['type'], readonly string[]> = {
  Technical: ['Long Potting', 'Cue Ball Control', 'Consistency', 'Hand Steadiness'],
  'Break Building': ['Break Building', 'Cue Ball Control'],
  'Cue Action': ['Consistency', 'Cue Ball Control', 'Hand Steadiness'],
  Tactical: ['Safety Play', 'Composure'],
  Mental: ['Focus', 'Composure', 'Resilience', 'Big Match Nerve', 'Professionalism'],
  Fitness: ['Stamina', 'Balance', 'Recovery Rate', 'Shoulder Health'],
};
export function coachTrainingBonus(coach: Pick<Coach, 'type' | 'level' | 'compatibility'>, skill?: string) {
  if (skill && !COACH_TRAINING_SKILLS[coach.type]?.includes(skill)) return 0;
  return (coach.level === 'Elite' ? 0.15 : coach.level === 'High' ? 0.1 : 0.05) * (0.75 + coach.compatibility / 400);
}
