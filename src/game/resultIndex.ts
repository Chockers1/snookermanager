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

/** Inclusive date window without walking decades of archived event headers. */
export function eventsBetween(ledger: Pick<RollingRankingsState,'events'>|undefined, from:string, to:string) {
  const all=indexedEvents(ledger);
  const bound=(date:string,inclusive:boolean)=>{let low=0,high=all.length;while(low<high){const middle=(low+high)>>>1;if(all[middle].completedOn<date || inclusive&&all[middle].completedOn===date)low=middle+1;else high=middle;}return low;};
  return all.slice(bound(from,false),bound(to,true));
}
