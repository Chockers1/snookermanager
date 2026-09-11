import type { RankedEvent, RollingRankingsState } from './rollingRankings';
// Published event maps are immutable. Weak keys release indexes with old saves.
const indexes = new WeakMap<object, { all: RankedEvent[]; seasons: Map<string, RankedEvent[]> }>();
export function indexedEvents(ledger: Pick<RollingRankingsState, 'events'> | undefined, season?: string): RankedEvent[] {
  if (!ledger) return [];
  let index = indexes.get(ledger.events);
  if (!index) {
    const all = Object.values(ledger.events).sort((a,b) => a.completedOn.localeCompare(b.completedOn));
    const seasons = new Map<string, RankedEvent[]>();
    for (const event of all) { const rows=seasons.get(event.season) ?? []; rows.push(event); seasons.set(event.season,rows); }
    index={all,seasons}; indexes.set(ledger.events,index);
  }
  return season === undefined ? index.all : index.seasons.get(season) ?? [];
}
