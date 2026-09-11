import { leagueFixture } from './leagueFixture';
import { initializeCareerDepth } from '../src/game/careerDepth';
import { plusDays } from '../src/game/careerDepth/shared';
export function requiredDecisionFixture() {
  const { state, event } = leagueFixture();
  state.firstWeekGuide!.dismissed = true;
  const story = {
    id: 'story:deciders:required-test', kind: 'deciders' as const,
    title: 'Turning deciding frames around', evidence: 'Three recent deciding-frame losses. Choose how to respond.',
    createdDate: state.currentDate, expiresDate: plusDays(state.currentDate, 14),
    updates: [], status: 'pending' as const, matchCount: 0, trainingWeeks: 0,
  };
  state.careerDepth = { ...state.careerDepth!, stories: [story] };
  return { state: initializeCareerDepth(state), event: state.tournaments.find(t => t.id === event.id)!, story };
}
