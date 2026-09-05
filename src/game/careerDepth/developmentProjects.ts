import type { GameState } from '../../hooks/useGameState';
import type { PlayerAttributes, TrainingPlannerDay } from '../../types/game';
import { bounded, careerMessage, depthOf, plusDays } from './shared';
import type { ProjectKind } from './types';

export const PROJECTS: Record<ProjectKind, { name: string; weeks: number; sessions: string[]; skills: string[] }> = {
  'long-pot': { name: 'Long-pot reliability', weeks: 4, sessions: ['Long Pot Routine', 'Line-Up Drill'], skills: ['Long Potting', 'Consistency'] },
  safety: { name: 'Dependable opening safety', weeks: 4, sessions: ['Safety Exchanges'], skills: ['Safety Play', 'Cue Ball Control'] },
  'cue-action': { name: 'Repeatable cue action', weeks: 6, sessions: ['Line-Up Drill', 'Long Pot Routine'], skills: ['Consistency', 'Cue Ball Control'] },
  stamina: { name: 'Long-match stamina', weeks: 6, sessions: ['Fitness'], skills: ['Stamina', 'Recovery Rate'] },
  pressure: { name: 'Pressure-management programme', weeks: 4, sessions: ['Mental Training', 'Review'], skills: ['Composure', 'Focus'] },
};
export function startProject(state: GameState, kind: ProjectKind): GameState {
  const d = depthOf(state);
  if (!PROJECTS[kind] || d.project?.status === 'active') return { ...state, lastAction: 'Finish or cancel your current project first.' };
  const all = { ...state.attributes.technical, ...state.attributes.mental, ...state.attributes.physical };
  return { ...state, careerDepth: { ...d, project: {
    id: `${state.currentDate}:${kind}:${d.projectHistory.length}`, kind, startedDate: state.currentDate,
    reviewDate: plusDays(state.currentDate, PROJECTS[kind].weeks * 7), completedWeeks: 0,
    status: 'active', baseline: Object.fromEntries(PROJECTS[kind].skills.map(s => [s, all[s] ?? 0])), evidenceMatches: 0,
    note: 'Complete at least three relevant sessions per training week. Competition or injury pauses progress.',
  } }, lastAction: `Started ${PROJECTS[kind].name}. Select relevant sessions in your timetable.` };
}
export function partnerAvailable(state: GameState) {
  const id = depthOf(state).partnerId;
  const partner = state.worldPlayers.find(p => p.id === id);
  if (!partner || partner.retired || partner.injuryWeeks) return false;
  // A shared event week is competition, not a second training opportunity.
  return !state.trainingPlan.some(d => d.competitionName || [d.morning, d.afternoon, d.evening].some(c => c.category === 'Travel'));
}
export function developmentTrainingBonus(state: GameState, plan: TrainingPlannerDay[], skill?: string) {
  const p = depthOf(state).project;
  if (state.health.activeIssue || state.trainingCondition.injuryWeeks > 0 || plan.some(d => d.competitionName)) return 1;
  const cells = plan.flatMap(d => [d.morning, d.afternoon, d.evening]);
  const project = p?.status === 'active' && (!skill || PROJECTS[p.kind].skills.includes(skill)) && cells.filter(c => PROJECTS[p.kind].sessions.includes(c.title)).length >= 3;
  const partner = partnerAvailable(state) && (!skill || skill === (depthOf(state).partnerFocus ?? 'Long Potting')) && cells.some(c => c.subtitle.startsWith('Practice partner:'));
  return 1 + Math.min(0.1, (project ? 0.05 : 0) + (partner ? 0.05 : 0));
}
export function protectPartnerSessions(state: GameState, plan: TrainingPlannerDay[]): TrainingPlannerDay[] {
  if (!partnerAvailable(state)) return plan;
  const partner = state.worldPlayers.find(p => p.id === depthOf(state).partnerId)!;
  const skill = depthOf(state).partnerFocus ?? 'Long Potting';
  const title = skill === 'Safety Play' ? 'Safety Exchanges' : skill === 'Break Building' ? 'Break Building' : skill === 'Cue Ball Control' ? 'Line-Up Drill' : 'Long Pot Routine';
  let assigned = false;
  return plan.map(day => {
    if (assigned || day.competitionName) return day;
    const key = (['morning', 'afternoon', 'evening'] as const).find(k => day[k].category === 'Technical');
    if (!key) return day;
    assigned = true;
    return { ...day, [key]: { ...day[key], title, subtitle: `Practice partner: ${partner.playerName} · ${skill}` } };
  });
}
export function progressDevelopment(state: GameState, plan: TrainingPlannerDay[]): GameState {
  const d = depthOf(state);
  const key = `${state.season}:${state.week}`;
  const p = d.project;
  const cells = plan.flatMap(day => [day.morning, day.afternoon, day.evening]);
  const protectedWeek = Boolean(state.health.activeIssue || state.trainingCondition.injuryWeeks > 0 || plan.some(day => day.competitionName));
  const relevant = p ? cells.filter(c => PROJECTS[p.kind].sessions.includes(c.title)).length : 0;
  const earned = !protectedWeek && relevant >= 3;
  let project = p;
  if (p?.status === 'active' && p.lastWeek !== key) {
    const weeks = p.completedWeeks + Number(earned);
    const complete = weeks >= PROJECTS[p.kind].weeks;
    project = { ...p, completedWeeks: weeks, lastWeek: key, status: complete ? 'completed' : 'active',
      reviewDate: earned ? p.reviewDate : plusDays(p.reviewDate, 7),
      note: complete ? 'Project complete. Attribute gains came from training; no completion bonus was added.' :
        protectedWeek ? 'Paused for competition or injury.' : earned ? 'Relevant training week completed.' : 'Paused: fewer than three relevant sessions.' };
  }
  const coaches = { ...d.coachRelationships };
  for (const contract of state.coachContracts) {
    const old = coaches[contract.coachId] ?? { trust: 55, note: 'Building understanding' };
    if (old.lastWeek === key) continue;
    const overload = state.trainingCondition.strain >= 70 || state.trainingCondition.burnout >= 70;
    const delta = protectedWeek ? 0 : overload ? -3 : p?.status === 'active' ? earned ? 2 : -1 : 0;
    coaches[contract.coachId] = { ...old, trust: bounded(old.trust + delta, 25, 90), lastWeek: key,
      note: protectedWeek ? 'Competition and recovery commitments respected.' : overload ? 'Reduce overload before pushing development.' : earned ? 'Agreed development sessions completed.' : 'Review the agreed project sessions.' };
  }
  const sharedSessions = cells.filter(c => c.subtitle.startsWith('Practice partner:')).length;
  const practiceHistory = { ...d.practiceHistory };
  if (d.partnerId && sharedSessions && !protectedWeek) practiceHistory[d.partnerId] = {
    sessions: (practiceHistory[d.partnerId]?.sessions ?? 0) + sharedSessions,
    lastDate: state.currentDate, skill: d.partnerFocus ?? 'Long Potting',
  };
  let next: GameState = { ...state, careerDepth: { ...d, project, coachRelationships: coaches, practiceHistory,
    trainingWeeks: d.trainingWeeks + 1,
    projectHistory: project?.status === 'completed' && p?.status === 'active' ? [...d.projectHistory, project] : d.projectHistory } };
  if (project?.status === 'completed' && p?.status === 'active') next = careerMessage(next, `project:${project.id}`, `${PROJECTS[project.kind].name} complete`, project.note, '/training');
  return next;
}
export function effectiveCareerAttributes(state: GameState, attributes: PlayerAttributes): PlayerAttributes {
  const p = depthOf(state).project;
  if (p?.kind !== 'cue-action' || p.status !== 'active' || p.completedWeeks >= 2) return attributes;
  return { ...attributes, technical: { ...attributes.technical, Consistency: bounded((attributes.technical.Consistency ?? 50) - 2) } };
}

export function recordProjectOutcome(state: GameState, attributes: PlayerAttributes) {
  const d = depthOf(state), p = d.project;
  if (!p || p.status !== 'completed' || p.closingAttributes) return d;
  const all = { ...attributes.technical, ...attributes.mental, ...attributes.physical };
  const project = { ...p, closingAttributes: Object.fromEntries(Object.keys(p.baseline).map(skill => [skill, all[skill] ?? p.baseline[skill]])) };
  return { ...d, project, projectHistory: d.projectHistory.map(item => item.id === p.id ? project : item) };
}
