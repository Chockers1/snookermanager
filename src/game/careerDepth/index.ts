import type { GameState } from '../../hooks/useGameState';
import { realismBoundary } from '../realism';
import type { CareerDepthAction } from './types';
import { careerMessage, createCareerDepth, depthOf, pendingStory, plusDays, uniqueOpponentId } from './shared';
import { reconcileStories, resolveStory } from './careerStories';
import { scheduleCommitment, settleCommitments } from './commitments';
import { startProject } from './developmentProjects';
import { approveSchedule, runScheduleAssistance } from './seasonPlanning';
import { partnerCandidates, recordEncounter, reviewCoachPlan } from './relationships';

export function initializeCareerDepth(state: GameState): GameState {
  if (state.careerDepth?.version === 1) return state;
  let next: GameState = { ...state, careerDepth: createCareerDepth(state), matches: state.matches.map(m => ({ ...m, opponentId: m.opponentId ?? uniqueOpponentId(state, m.opponentName) })) };
  // Reconstruct reliable H2H only. Never replay historical money or stories.
  for (const match of [...next.matches].reverse()) next = recordEncounter(next, match);
  return next;
}
export function reconcileCareerDepth(state: GameState): GameState {
  let next = reconcileStories(settleCommitments(initializeCareerDepth(state)));
  const d = depthOf(next);
  const partner = next.worldPlayers.find(p => p.id === d.partnerId);
  if (d.partnerId && (!partner || partner.retired)) {
    next = { ...next, careerDepth: { ...d, partnerId: null } };
    next = careerMessage(next, `partner-retired:${d.partnerId}`, 'Practice partnership ended', 'Your practice partner has retired or left the available player pool. Your shared career history is retained.', '/training');
  }
  const story = pendingStory(next);
  if (story) next = careerMessage(next, story.id, story.title, story.evidence);
  return next;
}
export function careerDepthAction(state: GameState, action: CareerDepthAction): GameState {
  state = initializeCareerDepth(state);
  const d = depthOf(state);
  switch (action.type) {
    case 'project': return startProject(state, action.kind);
    case 'cancel-project': return { ...state, careerDepth: { ...d, project: null,
      projectHistory: d.project?.status === 'active' ? [...d.projectHistory, { ...d.project, status: 'cancelled', note: 'Cancelled without a permanent attribute penalty.' }] : d.projectHistory }, lastAction: 'Project cancelled; temporary cue-action penalty removed.' };
    case 'partner':
      if (action.id && !partnerCandidates(state).some(p => p.id === action.id)) return { ...state, lastAction: 'This player is not available as a practice partner.' };
      return { ...state, careerDepth: { ...d, partnerId: action.id }, lastAction: action.id ? 'Practice partner selected. One existing technical session each free week becomes a shared session.' : 'Practice partnership ended.' };
    case 'partner-focus':
      if (!['Long Potting', 'Break Building', 'Cue Ball Control', 'Safety Play'].includes(action.skill)) return state;
      return { ...state, careerDepth: { ...d, partnerFocus: action.skill }, lastAction: `Shared practice now targets ${action.skill}.` };
    case 'coach-review': return reviewCoachPlan(state, action.id);
    case 'decision': return resolveStory(state, action.id, action.choice);
    case 'commitment': return scheduleCommitment(state, action.kind, action.startDate);
    case 'cancel-commitment': {
      const c = d.commitments.find(c => c.id === action.id && c.status === 'scheduled');
      if (!c || state.currentDate >= c.startDate) return { ...state, lastAction: 'Only future commitments can be cancelled.' };
      return { ...state, careerDepth: { ...d, commitments: d.commitments.map(c => c.id === action.id ? { ...c, status: 'cancelled' } : c) }, lastAction: 'Commitment cancelled. Upfront booking costs are non-refundable; no appearance income will be paid.' };
    }
    case 'strategy': return { ...state, careerDepth: { ...d, strategy: action.strategy, targets: [...new Set(action.targets)].slice(0, 3), schedule: null }, lastAction: 'Strategy updated. Approve a new six-week schedule before assistance resumes.' };
    case 'approve-schedule': return approveSchedule(state, action.eventIds, action.cap, action.reserve);
    case 'pause-schedule': return { ...state, careerDepth: { ...d, schedule: d.schedule ? { ...d.schedule, enabled: false, pauseReason: 'Paused by player.' } : null }, lastAction: 'Schedule assistance paused.' };
    case 'run-assistance': return runScheduleAssistance(state);
  }
}
export function nextCareerBoundary(state: GameState) {
  const d = depthOf(state);
  const dates = [d.nextSettlementDate];
  const realismDate = realismBoundary(state);
  if (realismDate) dates.push(realismDate);
  for (const c of d.commitments.filter(c => c.status === 'scheduled')) dates.push(c.startDate, plusDays(c.endDate, 1));
  for (const s of d.stories) if (s.status === 'resolved' && !s.reviewed && s.reviewDate) dates.push(s.reviewDate);
  for (const t of state.tournaments) if (t.status === 'Entered') dates.push(t.startDate);
  return dates.filter(date => date > state.currentDate).sort()[0] ?? plusDays(state.currentDate, 7);
}
