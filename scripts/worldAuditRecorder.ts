import fs from 'node:fs';
import path from 'node:path';
import type { GameState } from '../src/hooks/useGameState';
import { getBestOfForRound, resolveTournamentFormat } from '../src/data/tournamentFormats';

export function recordWorldAudit(directory: string, opening: GameState, closing: GameState, next: GameState) {
  fs.mkdirSync(directory, { recursive: true });
  const season = opening.season;
  const events = Object.values(next.rollingRankings?.events ?? {}).filter(e => e.season === season);
  const beforeByName = new Map(opening.worldPlayers.map(p => [p.playerName, p]));
  const afterByName = new Map(next.worldPlayers.map(p => [p.playerName, p]));
  const issues: { kind:string; detail:string }[] = [];
  const add = (kind:string, detail:string) => issues.push({kind,detail});
  const eventRows = events.map(event => {
    const tournament = opening.tournaments.find(t => t.id === event.tournamentId)!;
    const finalRound = event.bracket.at(-1);
    const final = finalRound?.label.toLowerCase() === 'final' && finalRound.matches.length === 1 ? finalRound.matches[0] : undefined;
    const winner = final && typeof final.top.score === 'number' && typeof final.bottom.score === 'number' && final.top.score !== final.bottom.score ? (final.top.score > final.bottom.score ? final.top.name : final.bottom.name) : null;
    const entrants = [...new Set(event.bracket.flatMap(r => r.matches.flatMap(m => [m.top.name,m.bottom.name])).filter(n => n && n !== 'TBD'))];
    let scoredMatches = 0;
    for (const round of event.bracket) for (const match of round.matches) {
      if (match.placeholder) continue;
      const a = match.top.score, b = match.bottom.score;
      if (typeof a !== 'number' || typeof b !== 'number') { add('unresolved-match', event.name + ': ' + round.label + ' / ' + match.top.name + ' vs ' + match.bottom.name); continue; }
      scoredMatches++;
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) add('invalid-score',event.name + ': ' + a + '-' + b);
      if (!match.group && !round.groupRule && tournament) {
        const bestOf = round.bestOf ?? getBestOfForRound(tournament,round.label,7);
        if (Math.max(a,b) !== Math.ceil(bestOf/2) || a === b) add('frame-format',event.name + ' / ' + round.label + ': ' + a + '-' + b + ', best of ' + bestOf);
      }
    }
    const retiredEntrants = entrants.filter(name => beforeByName.get(name)?.retired);
    if (retiredEntrants.length) add('retired-entry',event.name + ': ' + retiredEntrants.join(', '));
    return { id:event.tournamentId,name:event.name,type:tournament?.type,format:tournament && resolveTournamentFormat(tournament).id,ranking:event.ranking,date:event.completedOn,entrants:entrants.length,scoredMatches,winner,final:final ? final.top.name + ' ' + final.top.score + '–' + final.bottom.score + ' ' + final.bottom.name : null,rounds:event.bracket.map(r=>({label:r.label,bestOf:r.bestOf,matches:r.matches.length})),bracket:event.bracket };
  });
  const expected = opening.tournaments.filter(t => (t.endDate ?? t.startDate) >= opening.currentDate);
  const missing = expected.filter(t => !events.some(e => e.tournamentId === t.id));
  for (const event of missing) add('missing-event', event.name);
  const roster = next.worldPlayers.map(p => {
    const old = beforeByName.get(p.playerName);
    if (old && p.age !== old.age + 1) add('age-increment',p.playerName + ': ' + old.age + ' -> ' + p.age);
    if (p.retired && p.hasTourCard) add('retired-card',p.playerName);
    for (const [key,value] of Object.entries({age:p.age,rating:p.overallRating,potential:p.developmentPotential,prize:p.totalPrizeMoney,titles:p.titles,matches:p.totalMatches})) if (value !== undefined && !Number.isFinite(value)) add('non-finite',p.playerName + ': ' + key);
    if (p.overallRating !== undefined && (p.overallRating < 0 || p.overallRating > 100)) add('rating-range',p.playerName + ': ' + p.overallRating);
    return { id:p.id,name:p.playerName,nation:p.nation,age:p.age,retired:p.retired,retiredSeason:p.retiredSeason,card:p.hasTourCard,cardSource:p.cardSource,yearsRemaining:p.yearsRemaining,rating:p.overallRating,potential:p.developmentPotential,ratingChange:old?.overallRating !== undefined && p.overallRating !== undefined ? p.overallRating-old.overallRating : null,declineProfile:p.declineProfile,skillOffsets:p.skillDevelopment?.offsets,skillFocus:p.skillDevelopment?.focus,titles:p.titles,majors:p.majorTitles,totalMatches:p.totalMatches,wins:p.wins,losses:p.losses,prize:p.totalPrizeMoney,highestBreak:p.highestBreak,seasonRecord:p.seasons.find(s=>s.season===season) };
  });
  for (const field of ['id','playerName'] as const) if (new Set(next.worldPlayers.map(p=>p[field])).size !== next.worldPlayers.length) add('duplicate-player',field);
  const rankings = next.seasonReview?.finalRankings ?? [];
  rankings.forEach((r,i) => {
    if (r.ranking !== i+1) add('ranking-order',r.playerName + ': ' + r.ranking + ' at row ' + (i+1));
    if (i && r.points > rankings[i-1].points) add('ranking-points-order',r.playerName);
    if (!afterByName.has(r.playerName)) add('missing-ranked-player',r.playerName);
  });
  const tableChecks = Object.fromEntries(Object.entries(next.competitionTables).map(([key, rows]) => {
    const retired = rows.filter(r=>afterByName.get(r.playerName)?.retired).map(r=>r.playerName);
    if (retired.length) add('retired-ranking',key + ': ' + retired.join(', '));
    if (new Set(rows.map(r=>r.playerName)).size !== rows.length) add('duplicate-ranking',key);
    return [key,{size:rows.length,top10:rows.slice(0,10),retired}];
  }));
  const report = { season,startedOn:opening.currentDate,endedOn:next.currentDate,worldSeed:next.worldSeed,expectedEvents:expected.length,events:eventRows,rankings,roster,
    human:{name:next.player.fullName,age:next.player.age,openingCash:opening.player.cash,closingCash:next.player.cash,record:next.seasonReview?.completedSeason,card:next.careerSystems.pro,retired:next.careerSystems.lateCareer.retired},
    newcomers:roster.filter(p=>!beforeByName.has(p.name)),retirements:roster.filter(p=>p.retired && !beforeByName.get(p.name)?.retired),
    cardsGained:roster.filter(p=>p.card && !beforeByName.get(p.name)?.hasTourCard),cardsLost:roster.filter(p=>!p.card && beforeByName.get(p.name)?.hasTourCard),
    closingCircuitTablesBeforeFinalAdvance:closing.competitionTables,nextSeasonTables:tableChecks,issues,
    memoryMb:Math.round(process.memoryUsage().heapUsed/1048576) };
  fs.writeFileSync(path.join(directory,season.replace('/','-')+'.json'),JSON.stringify(report));
  console.log(JSON.stringify({worldAudit:season,events:events.length,matches:eventRows.reduce((n,e)=>n+e.scoredMatches,0),worldChampion:eventRows.find(e=>e.name==='World Championship')?.winner,active:roster.filter(p=>!p.retired).length,newcomers:report.newcomers.length,retirements:report.retirements.length,cards:roster.filter(p=>p.card).length,issues:issues.length,memoryMb:report.memoryMb}));
}
