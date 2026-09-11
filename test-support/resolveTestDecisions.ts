import type { GameState } from '../src/hooks/useGameState';
import { careerDepthAction } from '../src/game/careerDepth';
import { pendingStory } from '../src/game/careerDepth/shared';
/** A simulated manager chooses the free response before continuing the scenario under test. */
export function resolveTestDecisions(state: GameState): GameState {
  for (let story = pendingStory(state); story; story = pendingStory(state)) {
    const next = careerDepthAction(state, { type: 'decision', id: story.id,
      choice: story.kind === 'deciders' || story.kind === 'early-exits' ? 'continue' : 'protect' });
    if (pendingStory(next)?.id === story.id) throw new Error(next.lastAction);
    state = next;
  }
  return state;
}
