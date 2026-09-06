import type { GameState } from '../../hooks/useGameState';
import type { CareerStory, StoryChoice, StoryKind } from './types';
import { careerMessage, dayNumber, depthOf, plusDays } from './shared';
import { recordEncounter, getRivalry } from './relationships';
import { startProject } from './developmentProjects';
import { commitmentQuote, scheduleCommitment } from './commitments';
import { supportedConfidence } from '../confidenceSystem';

export const STORY_CHOICES: Record<StoryKind, { id: StoryChoice; label: string; effect: string }[]> = {
  deciders: [
    { id: 'programme', label: 'Pressure programme', effect: '4 training weeks · 3 mental/review sessions per week · review in 28 days' },
    { id: 'support', label: 'Mental support session', effect: '£90 now · up to +3 confidence (diminishes at high confidence) · review in 28 days' },
    { id: 'continue', label: 'Keep my approach', effect: 'No cost or immediate penalty · review subsequent deciding frames' },
  ],
  breakthrough: [
    { id: 'exhibition', label: 'Accept paid exhibition', effect: '1 day reserved · fee paid afterwards · fatigue +6 · replaces all three training sessions' },
    { id: 'sponsor', label: 'Seek sponsor introduction', effect: 'An eligible sponsor gets a warm introduction: +5 percentage points on your next negotiation within 28 days. No guaranteed deal.' },
    { id: 'protect', label: 'Protect preparation', effect: 'No income · no added fatigue or commitments' },
  ],
  'early-exits': [
    { id: 'technique', label: 'Rebuild cue action', effect: '6 training weeks · temporary effective consistency −2 for first 2 training weeks' },
    { id: 'coach', label: 'Review coaching options', effect: 'No automatic hiring or firing · compare your staff · review in 28 days' },
    { id: 'continue', label: 'Stay with my approach', effect: 'No cost or immediate penalty · reassess after four weeks' },
  ],
  television: [
    { id: 'media', label: 'Accept media appearance', effect: '1 day reserved · appearance fee · fatigue +3 · replaces three sessions. Higher public expectations: defeats cost 1 extra confidence for 28 days.' },
    { id: 'coach-prep', label: 'Coach-managed preparation', effect: 'Protect time · start a four-week pressure programme with your current coach' },
    { id: 'protect', label: 'Decline optional media', effect: 'No fee or added pressure · keep your preparation time' },
  ],
};
export function storyCommitmentDate(state: GameState) {
  // A completed event may still have CPU rounds running; never reserve inside it.
  const eventEnd = state.tournaments.filter(t => t.status === 'Entered' || t.status === 'Completed').filter(t => t.startDate <= state.currentDate)
    .reduce((date, t) => (t.endDate ?? t.startDate) > date ? t.endDate ?? t.startDate : date, state.currentDate);
  const earliest = plusDays(eventEnd, 1);
  return state.trainingAppliedWeek === state.week && earliest < depthOf(state).nextSettlementDate ? depthOf(state).nextSettlementDate : earliest;
}
export function resolveStory(state: GameState, id: string, choice: StoryChoice): GameState {
  const story = depthOf(state).stories.find(s => s.id === id && s.status === 'pending');
  if (!story || state.currentDate > story.expiresDate || !STORY_CHOICES[story.kind].some(c => c.id === choice)) return { ...state, lastAction: 'This decision is no longer available.' };
  let next = state;
  if (choice === 'programme' || choice === 'technique' || choice === 'coach-prep') {
    if (depthOf(state).project?.status === 'active') return { ...state, lastAction: 'Finish or cancel the current development project before replacing it.' };
    if (choice === 'coach-prep' && !state.coachContracts.length) return { ...state, lastAction: 'You need an active coach for coach-managed preparation.' };
    next = startProject(state, choice === 'technique' ? 'cue-action' : 'pressure');
  }
  if (choice === 'support') {
    if (state.player.cash < 90) return { ...state, lastAction: 'Not enough cash for mental support.' };
    next = { ...state, player: { ...state.player, cash: state.player.cash - 90, confidence: supportedConfidence(state.player.confidence, 3) },
      finance: { ...state.finance, ledger: [{ id: `story:${id}:support`, date: state.currentDate, description: 'Pressure-management support', category: 'Health', amount: 90, type: 'Expense' }, ...state.finance.ledger] } };
  }
  if (choice === 'exhibition' || choice === 'media') {
    const kind = choice === 'media' ? 'appearance' : 'exhibition';
    const date = storyCommitmentDate(state);
    const quote = commitmentQuote(state, kind, date);
    next = scheduleCommitment(state, kind, date, id);
    if (!depthOf(next).commitments.some(c => c.id === quote.id && c.sourceStoryId === id)) return next;
    if (choice === 'media') next = { ...next, careerDepth: { ...depthOf(next), mediaExpectationsUntil: plusDays(next.currentDate, 28) } };
  }
  if (choice === 'sponsor') {
    const offer = next.sponsorOffers.find(o => o.status === 'Available' && o.minimumReputation <= next.player.reputation && !next.sponsors.some(s => s.name === o.name));
    if (offer) next = { ...next, careerDepth: { ...depthOf(next), commercialIntroduction: { offerId: offer.id, expiresDate: plusDays(next.currentDate, 28), used: false } } };
  }
  const d = depthOf(next);
  const selected = STORY_CHOICES[story.kind].find(c => c.id === choice)!;
  next = { ...next, careerDepth: { ...d, stories: d.stories.map(s => s.id === id ? {
    ...s, choice, status: 'resolved', resolvedDate: state.currentDate, reviewDate: plusDays(state.currentDate, 28),
    resolvedMatchIds: state.matches.map(m => m.id), trainingWeeks: d.trainingWeeks,
    updates: [...s.updates, `${state.currentDate}: ${selected.label}. ${selected.effect}`],
  } : s) }, lastAction: `${selected.label} selected. A follow-up is scheduled in four weeks.` };
  if (choice === 'sponsor') {
    const introduction = depthOf(next).commercialIntroduction;
    const offer = introduction && next.sponsorOffers.find(o => o.id === introduction.offerId);
    const detail = offer ? `${offer.name}: +5 percentage points on one negotiation before ${introduction!.expiresDate}.` : 'No eligible offer is available for an introduction at present; no contract or money changed.';
    next = careerMessage(next, `story:${id}:introduction`, 'Your commercial introduction', `${detail} A conversation is not a guaranteed contract. Existing eligibility and slot rules still apply.`, '/sponsorship');
  }
  if (choice === 'coach') next = careerMessage(next, `story:${id}:staff`, 'Coaching review requested', 'Compare your current development plan and available staff. No contract has been changed.', '/staff/coaches');
  return next;
}
export function reconcileStories(state: GameState): GameState {
  let next = state;
  let d = depthOf(next);
  const fresh = state.matches.filter(m => m.result !== 'In Progress' && !d.seenMatchIds.includes(m.id)).reverse();
  for (const match of fresh) {
    const before = getRivalry(next, match.opponentName);
    next = recordEncounter(next, match);
    const after = getRivalry(next, match.opponentName);
    if (!before?.rivalry && after?.rivalry) next = careerMessage(next, 'rivalry:' + after.opponentId, 'A rivalry is taking shape', match.opponentName + ': repeated close meetings now carry extra history. Review the head-to-head and vary familiar tactics.', '/match/result');
  }
  d = depthOf(next);
  if (fresh.length) {
    next = { ...next, careerDepth: { ...d, seenMatchIds: [...d.seenMatchIds, ...fresh.map(m => m.id)],
      project: d.project?.status === 'active' ? { ...d.project, evidenceMatches: d.project.evidenceMatches + fresh.length,
        matchEvidence: fresh.reduce((e, m) => ({ matches: e.matches + 1, pottingTotal: e.pottingTotal + m.potSuccess, safetyTotal: e.safetyTotal + m.safetySuccess,
          highestBreak: Math.max(e.highestBreak, m.highestBreak), longMatches: e.longMatches + Number(m.bestOf >= 11), longMatchWins: e.longMatchWins + Number(m.bestOf >= 11 && m.result === 'Won') }),
        d.project.matchEvidence ?? { matches: 0, pottingTotal: 0, safetyTotal: 0, highestBreak: 0, longMatches: 0, longMatchWins: 0 }) } : d.project } };
  }
  d = depthOf(next);
  for (const story of d.stories) {
    if (story.status === 'pending' && next.currentDate > story.expiresDate) {
      next = { ...next, careerDepth: { ...depthOf(next), stories: depthOf(next).stories.map(s => s.id === story.id ? { ...s, status: 'expired', updates: [...s.updates, 'Opportunity expired without a penalty.'] } : s) } };
    }
    if (story.status === 'resolved' && story.reviewDate && !story.reviewed && next.currentDate >= story.reviewDate) {
      const matches = next.matches.filter(m => m.result !== 'In Progress' && (story.resolvedMatchIds ? !story.resolvedMatchIds.includes(m.id) : m.playedOn && m.playedOn > (story.resolvedDate ?? story.createdDate)));
      const deciders = matches.filter(m => m.playerFrames + m.opponentFrames === m.bestOf);
      const text = `${matches.filter(m => m.result === 'Won').length} wins from ${matches.length} matches since your choice; ${deciders.filter(m => m.result === 'Won').length}/${deciders.length} deciding frames won. ${depthOf(next).trainingWeeks - story.trainingWeeks} training weeks completed. ${depthOf(next).project?.note ?? 'No active development project.'} ${matches.length < 5 ? 'Small sample: this does not establish a lasting performance change.' : 'Match evidence is separate from permanent training gains.'}`;
      next = { ...next, careerDepth: { ...depthOf(next), stories: depthOf(next).stories.map(s => s.id === story.id ? { ...s, reviewed: true, updates: [...s.updates, `${next.currentDate}: ${text}`] } : s) } };
      next = careerMessage(next, `review:${story.id}`, `Follow-up: ${story.title}`, text);
    }
  }
  d = depthOf(next);
  if (!fresh.length || d.stories.some(s => s.status === 'pending') || (d.lastStoryDate && dayNumber(next.currentDate) - dayNumber(d.lastStoryDate) < 28)) return next;
  const recent = next.matches.filter(m => m.result !== 'In Progress').slice(0, 10);
  const eventKey = (m: GameState['matches'][number]) => `${m.season ?? next.season}:${m.tournamentId}`;
  const eventIds = [...new Set(next.matches.map(eventKey))];
  const earlyExits = eventIds.slice(0, 3).length === 3 && eventIds.slice(0, 3).every(id => {
    const matches = next.matches.filter(m => eventKey(m) === id);
    return matches.length === 1 && matches[0].result === 'Lost';
  });
  const candidates: { kind: StoryKind; title: string; evidence: string; once: string }[] = [];
  if (recent.filter(m => m.result === 'Lost' && m.playerFrames + m.opponentFrames === m.bestOf).length >= 3) candidates.push({ kind: 'deciders', title: 'Turning deciding frames around', evidence: 'Three deciding-frame losses in your last ten matches.', once: `deciders:${recent[0]?.id}` });
  const breakthrough = fresh.find(m => m.result === 'Won' && m.opponentRanking > 0 && m.opponentRanking <= 8);
  if (breakthrough) candidates.push({ kind: 'breakthrough', title: 'A breakthrough victory', evidence: `You beat ${breakthrough.opponentName}, ranked #${breakthrough.opponentRanking} in this event's field.`, once: `breakthrough:${breakthrough.tournamentClass ?? 'career'}` });
  if (earlyExits) candidates.push({ kind: 'early-exits', title: 'Time to reassess your approach?', evidence: 'Opening-match elimination in three consecutive recorded events.', once: `exits:${eventIds[0]}` });
  const televised = fresh.find(m => (m.round === 'Quarter Final' || (m.result === 'Won' && next.tournamentProgress.tournamentId === m.tournamentId && next.tournamentProgress.currentRound === 'Quarter Final')) && next.tournaments.find(t => t.id === m.tournamentId)?.televisedRounds?.includes('Quarter Final'));
  if (televised) candidates.push({ kind: 'television', title: 'Your first televised quarter-final', evidence: `${next.tournaments.find(t => t.id === televised.tournamentId)?.name}: your first recorded televised quarter-final appearance.`, once: 'television' });
  const candidate = candidates.find(c => !d.milestones.includes(c.once));
  if (!candidate) return next;
  const story: CareerStory = { id: `story:${candidate.once}`, kind: candidate.kind, title: candidate.title, evidence: candidate.evidence,
    createdDate: next.currentDate, expiresDate: plusDays(next.currentDate, 14), status: 'pending', updates: [],
    matchCount: next.matches.length, trainingWeeks: d.trainingWeeks };
  next = { ...next, careerDepth: { ...d, stories: [...d.stories, story], lastStoryDate: next.currentDate, milestones: [...d.milestones, candidate.once] } };
  return careerMessage(next, story.id, story.title, story.evidence);
}
