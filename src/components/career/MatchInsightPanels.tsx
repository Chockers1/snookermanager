import { Link } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { getNextEligibleTournament } from '../../hooks/useGameState';
import { matchDebrief, matchObjectives, coachingAdvice, type PersonalMatchObjective } from '../../game/matchInsights';
import type { Match, Tournament } from '../../types/game';
import { depthOf } from '../../game/careerDepth/shared';

export function ObjectivesPanel({ opponentRank, bestOf, objectives }: { opponentRank: number; bestOf: number; objectives?: PersonalMatchObjective[] }) {
  const { gameState } = useGame();
  const goals = objectives ?? matchObjectives(gameState, opponentRank, bestOf);
  return <section aria-label="Personal match objectives" className="shrink-0 rounded-lg border border-green-500/25 bg-green-500/5 px-3 py-2">
    <p className="text-xs font-semibold text-green-400">Personal match objectives</p>
    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white">{goals.map(g => <span key={g.id}>{g.label}</span>)}</div>
    <p className="mt-1 text-[10px] text-gray-400">Locked when play starts · complete all for +1 confidence, even in defeat. No penalty for missing a target.</p>
  </section>;
}
export function CoachAdvicePanel({ opponent = '', tournament, onUsePlan }: { opponent?: string; tournament?: Tournament; onUsePlan?: (plan: 'Attack' | 'Balanced' | 'Safety') => void }) {
  const { gameState } = useGame();
  const advice = coachingAdvice(gameState, opponent, tournament ?? getNextEligibleTournament(gameState));
  return <details className="shrink-0 rounded-lg border border-border bg-surface text-xs">
    <summary className="cursor-pointer px-3 py-2 font-semibold text-white">{advice.coach} · Tactical & scheduling advice</summary>
    <div className="space-y-3 border-t border-border p-3 text-gray-300">
      {opponent && <div><p className="font-semibold text-green-400">Suggested approach: {advice.tactic}</p><p className="mt-1">{advice.tactical}</p><p className="mt-1 text-[10px] text-gray-500">{advice.evidence}</p>{onUsePlan && <button type="button" className="btn-secondary mt-2 text-xs" onClick={() => onUsePlan(advice.tactic)}>Use coach’s approach</button>}</div>}
      <p>{advice.schedule}</p>
      <div className="flex flex-wrap gap-3"><Link className="text-green-400" to="/calendar">Review calendar</Link><Link className="text-green-400" to="/training">Open training planner</Link></div>
    </div>
  </details>;
}
export function MatchReviewPanel({ match }: { match: Match }) {
  const { gameState, actOnCareer } = useGame();
  const review = match.debrief ?? matchDebrief(gameState, match);
  const project = depthOf(gameState).project;
  return <section aria-label="Match review and development" className="card p-4">
    <h2 className="text-base font-semibold text-white">{review.headline}</h2>
    <div className="mt-3 grid gap-4 lg:grid-cols-2">
      <div><h3 className="text-xs font-semibold text-green-400">What the match showed</h3><ul className="mt-2 list-disc space-y-2 pl-4 text-xs text-gray-300">{review.evidence.map(line => <li key={line}>{line}</li>)}</ul><p className="mt-2 text-[10px] text-gray-500">Potting and safety rates are simulation estimates. They guide training; they do not prove why every frame was lost.</p></div>
      <div><h3 className="text-xs font-semibold text-green-400">{review.training.title}</h3><p className="mt-2 text-xs text-gray-300">{review.training.reason}</p><p className="mt-2 text-xs text-gray-400">{review.training.sessions} Keep event and travel days protected.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={project?.status === 'active'} className="btn-primary text-xs" onClick={() => actOnCareer({ type: 'project', kind: review.training.kind })}>{project?.status === 'active' ? 'Development project already active' : 'Start recommended project'}</button><Link to="/training" className="btn-secondary text-xs">Choose training sessions</Link></div></div>
    </div>
    <div className="mt-4 border-t border-border pt-3"><h3 className="text-xs font-semibold text-white">Personal objective review</h3>{match.objectives?.length ? <div className="mt-2 flex flex-wrap gap-3">{match.objectives.map(goal => <p key={goal.id} className={goal.achieved ? 'text-xs text-green-400' : 'text-xs text-gray-400'}>{goal.achieved ? 'Achieved' : 'Not reached'} · {goal.label} · Recorded: {goal.actual}</p>)}</div> : <p className="mt-1 text-xs text-gray-500">No pre-match objectives were recorded for this older match.</p>}{review.confidenceBonus > 0 && <p className="mt-2 text-xs text-green-400">+{review.confidenceBonus} confidence · {review.bonusReason}</p>}</div>
  </section>;
}
