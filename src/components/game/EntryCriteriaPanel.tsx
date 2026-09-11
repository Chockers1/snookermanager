import { useGame } from '../../context/useGame';
import type { Tournament } from '../../types/game';
import { tournamentEligibility } from '../../game/tournamentEligibility';

export function EntryCriteriaPanel({ event, compact = false }: { event: Tournament; compact?: boolean }) {
  const { gameState } = useGame();
  const criteria = tournamentEligibility(gameState, event);
  const content = <>
    <p className="mt-1 text-xs leading-relaxed text-gray-300">{criteria.selection}</p>
    <p className="mt-2 text-xs text-gray-300"><span className="font-semibold">You:</span> {criteria.yourSelection} · {criteria.status}</p>
    {criteria.reason && <p className="mt-1 text-xs text-amber-200">{criteria.reason}</p>}
    {criteria.restrictions.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-gray-400">{criteria.restrictions.map(rule => <li key={rule}>{rule}</li>)}</ul>}
    <details className="mt-2 text-[11px] text-gray-400"><summary className="cursor-pointer">Draw seeding</summary><p className="mt-1">{criteria.seeding}</p></details>
  </>;
  return compact ? <details aria-label="Tournament entry criteria" className="rounded border border-border p-2 text-xs"><summary className="cursor-pointer font-semibold text-white">Entry criteria · {criteria.field}</summary>{content}</details>
    : <section aria-label="Tournament entry criteria" className="rounded border border-border p-3 text-xs"><h3 className="font-semibold text-white">Entry criteria</h3><p className="mt-1 font-semibold text-green-300">{criteria.field}</p>{content}</section>;
}
