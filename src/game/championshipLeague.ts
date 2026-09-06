import type { BracketMatchup, BracketPlayer, BracketRound, Tournament } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';

export const GROUP_STAGES = ['Stage One Groups', 'Stage Two Groups', 'Stage Three Groups'];
export const isChampionshipLeague = (event: Tournament) => resolveTournamentFormat(event).id === 'championshipLeagueRanking';
export const isGroupDraw = (draw: BracketRound[]) => Boolean(draw[0]?.matches.some(m => m.group));
export const fixtureComplete = (m: BracketMatchup) => typeof m.top.score === 'number' && typeof m.bottom.score === 'number';
const clean = (p: BracketPlayer): BracketPlayer => ({ ...p, score: undefined });
const pairs = [[0, 3], [1, 2], [0, 2], [1, 3], [0, 1], [2, 3]];

export function createGroupStage(label: string, entrants: BracketPlayer[]): BracketRound {
  const count = entrants.length / 4;
  const ordered = [...entrants].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  const matches: BracketMatchup[] = [];
  for (let g = 0; g < count; g++) {
    const players = [ordered[g], ordered[count * 2 - 1 - g], ordered[count * 2 + g], ordered[count * 4 - 1 - g]];
    pairs.forEach(([a, b], index) => matches.push({ id: label + ':' + (g + 1) + ':' + index, group: 'Group ' + (g + 1), top: clean(players[a]), bottom: clean(players[b]), placeholder: false }));
  }
  return { label, matches };
}
export function createChampionshipDraw(entrants: BracketPlayer[]): BracketRound[] {
  return [createGroupStage(GROUP_STAGES[0], entrants), ...GROUP_STAGES.slice(1).map(label => ({ label, matches: [] })), { label: 'Final', matches: [] }];
}
export function groupTable(matches: BracketMatchup[], rule: BracketRound['groupRule'] = 'ranking', tieOrder: string[] = []) {
  const players = [...new Map(matches.flatMap(m => [m.top, m.bottom]).map(p => [p.name, p])).values()];
  const rows = players.map(p => {
    let played = 0, won = 0, drawn = 0, lost = 0, framesFor = 0, framesAgainst = 0;
    const breaks: number[] = [];
    for (const m of matches.filter(fixtureComplete)) {
      const top = m.top.name === p.name;
      if (!top && m.bottom.name !== p.name) continue;
      const own = (top ? m.top.score : m.bottom.score)!, other = (top ? m.bottom.score : m.top.score)!;
      played++; framesFor += own; framesAgainst += other;
      if (own > other) won++; else if (own === other) drawn++; else lost++;
      breaks.push(...(top ? m.topBreaks ?? [] : m.bottomBreaks ?? []));
    }
    return { ...clean(p), played, won, drawn, lost, framesFor, framesAgainst, difference: framesFor - framesAgainst, points: won * (rule === 'ranking' ? 3 : 1) + drawn, breaks: breaks.sort((a,b) => b-a) };
  });
  if (rule === 'winsFrames') return rows.sort((a, b) => b.won - a.won || b.framesFor - a.framesFor || a.framesAgainst - b.framesAgainst || (b.breaks[0] ?? 0) - (a.breaks[0] ?? 0));
  rows.sort((a,b) => b.points-a.points || b.difference-a.difference);
  // Apply head-to-head/mini-table only among players tied on points and frames.
  for (let i = 0; i < rows.length;) {
    let end = i + 1;
    while (end < rows.length && rows[end].points === rows[i].points && rows[end].difference === rows[i].difference) end++;
    const tied = rows.slice(i,end), names = new Set(tied.map(p => p.name));
    const mini = (name: string) => matches.filter(m => fixtureComplete(m) && names.has(m.top.name) && names.has(m.bottom.name)).reduce((r,m) => {
      if (m.top.name !== name && m.bottom.name !== name) return r;
      const top = m.top.name === name, own = (top ? m.top.score : m.bottom.score)!, other = (top ? m.bottom.score : m.top.score)!;
      return { points: r.points + (own > other ? 3 : own === other ? 1 : 0), difference: r.difference + own - other };
    }, { points: 0, difference: 0 });
    tied.sort((a,b) => {
      const x=mini(a.name), y=mini(b.name);
      if(y.points!==x.points) return y.points-x.points;
      if(y.difference!==x.difference) return y.difference-x.difference;
      if (rule === 'amateur') return (tieOrder.indexOf(a.name) < 0 ? players.findIndex(p => p.name === a.name) : tieOrder.indexOf(a.name)) - (tieOrder.indexOf(b.name) < 0 ? players.findIndex(p => p.name === b.name) : tieOrder.indexOf(b.name));
      for(let j=0;j<Math.max(a.breaks.length,b.breaks.length);j++) if((a.breaks[j]??0)!==(b.breaks[j]??0)) return (b.breaks[j]??0)-(a.breaks[j]??0);
      // Stable draw order only if every recorded sporting tie-break is equal.
      return players.findIndex(p=>p.name===a.name)-players.findIndex(p=>p.name===b.name);
    });
    rows.splice(i,end-i,...tied); i=end;
  }
  return rows;
}
export function groupsInRound(round?: BracketRound) {
  return [...new Set(round?.matches.map(m => m.group).filter((g): g is string => Boolean(g)) ?? [])].map(name => ({ name, matches: round!.matches.filter(m => m.group === name) }));
}
export function nextGroupFixture(draw: BracketRound[], round: string, player: string) {
  return draw.find(r=>r.label===round)?.matches.find(m => !fixtureComplete(m) && (m.top.name===player || m.bottom.name===player)) ?? null;
}
export function groupFrameOrder(chance: number, random = Math.random) {
  const order: boolean[]=[]; let a=0,b=0;
  while(a+b<4 && a<3 && b<3) { const won=random()<chance; order.push(won); if(won) a++; else b++; }
  return order;
}
function cpuFixture(m: BracketMatchup, final: boolean, random: () => number): BracketMatchup {
  const chance=Math.max(.18,Math.min(.82,.5+(m.bottom.rank-m.top.rank)*.003+((m.top.developmentEdge??0)-(m.bottom.developmentEdge??0))/100));
  const order=final ? (()=>{const o:boolean[]=[];let a=0,b=0;while(a<3&&b<3){const won=random()<chance;o.push(won);if(won)a++;else b++;}return o;})() : groupFrameOrder(chance, random);
  const a=order.filter(Boolean).length,b=order.length-a;
  const breaks=(wins:number)=> Array.from({length:wins},()=>Math.round(35+random()*100)).sort((x,y)=>y-x);
  return {...m,top:{...m.top,score:a},bottom:{...m.bottom,score:b},topBreaks:breaks(a),bottomBreaks:breaks(b)};
}
function seedNext(draw: BracketRound[], stage: number) {
  const round=draw[stage];
  if(stage>=3 || !round.matches.length || !round.matches.every(fixtureComplete) || draw[stage+1].matches.length) return;
  const winners=groupsInRound(round).map(g=>clean(groupTable(g.matches)[0]));
  draw[stage+1]=stage===2 ? {label:'Final',matches:[{id:'championship-final',top:winners[0],bottom:winners[1]}]} : createGroupStage(GROUP_STAGES[stage+1],winners);
}
export function resolveChampionshipStage(draw: BracketRound[], label: string, random = Math.random) {
  const i=draw.findIndex(r=>r.label===label); if(i<0)return draw;
  draw[i]={...draw[i],matches:draw[i].matches.map(m=>fixtureComplete(m)?m:cpuFixture(m,i===3,random))};
  seedNext(draw,i); return draw;
}
export function applyGroupResult(source: BracketRound[], round: string, player: string, opponent: string, playerFrames: number, opponentFrames: number, playerBreaks: number[], opponentBreaks: number[]) {
  const draw=source.map(r=>({...r,matches:r.matches.map(m=>({...m,top:{...m.top},bottom:{...m.bottom}}))}));
  const i=draw.findIndex(r=>r.label===round), fixture=nextGroupFixture(draw,round,player);
  if(i<0 || !fixture || ![fixture.top.name,fixture.bottom.name].includes(opponent)) return {draw, nextRound: round};
  const ownGroup=draw[i].matches.filter(m=>m.group===fixture.group);
  const matchday=Math.floor(ownGroup.findIndex(m=>m.id===fixture.id)/2);
  draw[i].matches=draw[i].matches.map(m=> {
    if(m.id===fixture.id) {const top=m.top.name===player;return {...m,top:{...m.top,score:top?playerFrames:opponentFrames},bottom:{...m.bottom,score:top?opponentFrames:playerFrames},topBreaks:top?playerBreaks:opponentBreaks,bottomBreaks:top?opponentBreaks:playerBreaks};}
    const local=draw[i].matches.filter(n=>n.group===m.group).findIndex(n=>n.id===m.id);
    return !fixtureComplete(m) && Math.floor(local/2)<=matchday ? cpuFixture(m,false,Math.random) : m;
  });
  if(nextGroupFixture(draw,round,player)) return {draw,nextRound:round};
  resolveChampionshipStage(draw,round);
  const next=draw[i+1];
  return {draw,nextRound:next?.matches.some(m=>m.top.name===player||m.bottom.name===player)?next.label:null};
}
export function championshipEarnings(draw: BracketRound[], player: string) {
  const awards=[[3000,2000,1000,0],[4000,3000,2000,1000],[6000,4000,2000,1000]];
  let total=0;
  draw.slice(0,3).forEach((round,i)=> {
    const group=groupsInRound(round).find(g=>g.matches.some(m=>m.top.name===player||m.bottom.name===player));
    if(group?.matches.every(fixtureComplete)) total+=awards[i][groupTable(group.matches).findIndex(p=>p.name===player)]??0;
  });
  const final=draw[3]?.matches[0];
  if(final && fixtureComplete(final) && (final.top.name===player||final.bottom.name===player)) {
    const winner=final.top.score!>final.bottom.score! ? final.top.name:final.bottom.name;
    total+=winner===player?20000:10000;
  }
  return total;
}

/** Ties still unresolved after wins, frame difference and the tied-player mini-table. */
export function unresolvedAmateurTies(matches: BracketMatchup[]) {
  const rows = groupTable(matches, 'amateur'), clusters = new Map<string, typeof rows>();
  for (const row of rows) { const key = row.points + ':' + row.difference; clusters.set(key, [...(clusters.get(key) ?? []), row]); }
  return [...clusters.values()].flatMap(cluster => {
    if (cluster.length < 2) return [];
    const names = new Set(cluster.map(p => p.name)), mini = new Map<string, string[]>();
    for (const p of cluster) {
      let wins = 0, difference = 0;
      for (const m of matches.filter(fixtureComplete)) {
        if (!names.has(m.top.name) || !names.has(m.bottom.name) || (m.top.name !== p.name && m.bottom.name !== p.name)) continue;
        const a = m.top.name === p.name ? m.top.score! : m.bottom.score!, b = m.top.name === p.name ? m.bottom.score! : m.top.score!;
        wins += a > b ? 1 : 0; difference += a - b;
      }
      const key = wins + ':' + difference; mini.set(key, [...(mini.get(key) ?? []), p.name]);
    }
    return [...mini.values()].filter(names => names.length > 1);
  });
}
