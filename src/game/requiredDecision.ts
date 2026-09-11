import type { GameState } from '../hooks/useGameState';
import { pendingStory } from './careerDepth/shared';

export const REQUIRED_DECISION_EVENT = 'career-decision-required';

export function requiredDecisionBlocker(state: GameState) {
  const story = pendingStory(state);
  return story ? {
    reason: `Resolve “${story.title}” in your inbox before playing matches or changing your career.`,
    label: 'Resolve Inbox Decision',
    route: `/inbox?message=${encodeURIComponent(story.id)}`,
  } : null;
}

/** Never settle money, advance dates or reconcile history when an action is blocked. */
export function blockForRequiredDecision(state: GameState): GameState | null {
  const blocker = requiredDecisionBlocker(state);
  return blocker ? { ...state, lastAction: blocker.reason } : null;
}

// Viewing information, keeping a backup and switching careers remain available.
const availableWhileWaiting = new Set([
  'updateFirstWeekGuide', 'beginNewCareer', 'continueActiveCareer', 'startDemoCareer',
  'listSaveSlots', 'saveToSlot', 'loadSaveSlot', 'deleteSaveSlot', 'exportCareer',
  'restoreRecoverySave', 'recoverAttributeHistory', 'importCareer', 'resetCareer',
  'markInboxMessageRead', 'markAllInboxRead', 'dismissSeasonReview',
]);

/** Default-deny mutations, including future actions and live-match keyboard/timer controls. */
export function gateCareerActions<T extends object>(
  actions: T,
  getState: () => GameState,
  onBlocked: (blocker: NonNullable<ReturnType<typeof requiredDecisionBlocker>>) => void,
): T {
  return Object.fromEntries(Object.entries(actions).map(([name, action]) => [name,
    typeof action !== 'function' ? action : (...args: unknown[]) => {
      const state = getState();
      const response = args[0] as { type?: string; id?: string } | undefined;
      const answering = name === 'actOnCareer' && response?.type === 'decision'
        && response.id === pendingStory(state)?.id;
      const blocker = requiredDecisionBlocker(state);
      if (blocker && !availableWhileWaiting.has(name) && !answering) {
        onBlocked(blocker);
        return;
      }
      return Reflect.apply(action, undefined, args);
    },
  ])) as T;
}
