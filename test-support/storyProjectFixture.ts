import { requiredDecisionFixture } from './requiredDecisionFixture';
import { startProject } from '../src/game/careerDepth/developmentProjects';
export function storyProjectFixture() {
  const fixture = requiredDecisionFixture();
  const state = startProject(fixture.state, 'long-pot');
  state.careerDepth!.project!.completedWeeks = 2;
  const story = { ...fixture.story, kind: 'early-exits' as const, title: 'Time to reassess your approach?', evidence: 'Opening-match elimination in three consecutive recorded events.' };
  state.careerDepth!.stories = [story];
  state.inbox = state.inbox.map(m => m.id === story.id ? { ...m, subject: story.title, preview: story.evidence } : m);
  return { ...fixture, state, story };
}
