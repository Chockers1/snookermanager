import { Link } from 'react-router-dom';
import type { ActionBlocker } from '../../hooks/useGameState';

export function ActionBlockerNotice({ blocker }: { blocker: ActionBlocker | null }) {
  if (!blocker) return null;
  return <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
    <p>{blocker.reason}</p>
    <Link className="mt-1 inline-block font-semibold underline underline-offset-2" to={blocker.route}>{blocker.label} →</Link>
  </div>;
}
