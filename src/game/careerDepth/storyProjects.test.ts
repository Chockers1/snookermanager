import { describe, expect, it } from 'vitest';
import { storyProjectFixture } from '../../../test-support/storyProjectFixture';
import { careerDepthAction } from './index';
import { requiredDecisionBlocker } from '../requiredDecision';
import { resolveStory } from './careerStories';
import { effectiveCareerAttributes } from './developmentProjects';
const fixture = storyProjectFixture();

describe('project choices inside story messages', () => {
  it('keeps progress and resolves the decision without completing unearned training weeks', () => {
    const before = structuredClone(fixture.state);
    const next = careerDepthAction(before, { type: 'decision', id: fixture.story.id, choice: 'continue' });
    expect(requiredDecisionBlocker(next)).toBeNull();
    expect(next.careerDepth!.project).toEqual(before.careerDepth!.project);
    expect(next.careerDepth!.project).toMatchObject({ status: 'active', completedWeeks: 2 });
    expect(next.attributes).toEqual(before.attributes); expect(next.currentDate).toBe(before.currentDate);
  });
  it('atomically archives cancellation and starts the replacement without changing earned attributes or cash', () => {
    const before = structuredClone(fixture.state);
    const action = { type: 'decision' as const, id: fixture.story.id, choice: 'technique' as const, replaceProjectId: before.careerDepth!.project!.id };
    const next = careerDepthAction(before, action);
    expect(requiredDecisionBlocker(next)).toBeNull();
    expect(next.careerDepth!.project).toMatchObject({ kind: 'cue-action', status: 'active', completedWeeks: 0 });
    expect(next.careerDepth!.projectHistory.at(-1)).toMatchObject({ id: action.replaceProjectId, status: 'cancelled', completedWeeks: 2 });
    expect(next.careerDepth!.stories[0].updates.join(' ')).toContain('earned attribute gains retained');
    expect(next.attributes).toEqual(before.attributes); expect(next.player.cash).toBe(before.player.cash);
    expect(next.finance).toEqual(before.finance); expect(next.currentDate).toBe(before.currentDate);
    expect(effectiveCareerAttributes(next, next.attributes).technical.Consistency).toBe(next.attributes.technical.Consistency - 2);
    const reloaded = JSON.parse(JSON.stringify(next));
    expect(careerDepthAction(reloaded, action).careerDepth).toEqual(reloaded.careerDepth);
    expect(before).toEqual(fixture.state);
  });
  it('rejects stale project references, expired decisions and missing coaches before cancellation', () => {
    const before = structuredClone(fixture.state);
    expect(resolveStory(before, fixture.story.id, 'technique', 'wrong-project').careerDepth).toEqual(before.careerDepth);
    expect(resolveStory(before, fixture.story.id, 'technique').careerDepth).toEqual(before.careerDepth);
    const expired = { ...before, currentDate: '2100-01-01' };
    expect(resolveStory(expired, fixture.story.id, 'technique', before.careerDepth!.project!.id).careerDepth).toEqual(before.careerDepth);
    const television = { ...before, coachContracts: [], careerDepth: { ...before.careerDepth!, stories: [{ ...fixture.story, kind: 'television' as const }] } };
    expect(resolveStory(television, fixture.story.id, 'coach-prep', before.careerDepth!.project!.id).careerDepth).toEqual(television.careerDepth);
  });
});
