import type { GameState } from '../hooks/useGameState';
export type CareerDifficulty = 'relaxed'|'standard'|'demanding';
export const careerDifficulties = {
  relaxed:{label:'Relaxed',support:1.5,missedCompliance:12,missedLimit:5,description:'150% of background weekly support. Sponsor obligations cost 12 compliance when missed; five missed obligations or compliance below 40 can end a deal.'},
  standard:{label:'Standard',support:1,missedCompliance:18,missedLimit:3,description:'100% of background weekly support. Sponsor obligations cost 18 compliance when missed; three missed obligations or compliance below 40 can end a deal.'},
  demanding:{label:'Demanding',support:.75,missedCompliance:22,missedLimit:3,description:'75% of background weekly support. Sponsor obligations cost 22 compliance when missed; three missed obligations or compliance below 40 can end a deal.'},
} as const;
export function careerDifficulty(state: Pick<GameState,'difficulty'>) {return careerDifficulties[state.difficulty??'standard']??careerDifficulties.standard;}
export function backgroundWeeklySupport(state: Pick<GameState,'difficulty'|'finance'|'careerSystems'>) {
  return state.careerSystems.lateCareer.retired?0:Math.round(state.finance.baseCashFlow * (state.finance.baseCashFlow > 0 ? careerDifficulty(state).support : 1));
}
