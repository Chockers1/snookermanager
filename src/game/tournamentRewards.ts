import type { GameState } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
export function tournamentRewards(state:GameState,event:Pick<Tournament,'id'|'name'|'startDate'> & Partial<Tournament>) {
 const entry=state.history.tournamentHistory.find(e=>e.tournamentId===event.id&&e.startDate===event.startDate);
 const ledger=state.rollingRankings?.events[event.id+':'+event.startDate];
 const earning=state.rollingRankings?.earnings.find(e=>e.eventKey===event.id+':'+event.startDate&&e.playerName===state.player.fullName);
 const world=event.rankingType==='World Ranking'||event.rankingType==='One-Year'||ledger?.ranking===true;
 const exhibition=(entry?.eventType??event.type)==='Exhibition';
 const qualifier=(entry?.eventType??event.type)==='Q School'||/qualif(?:ier|ication|ying)|play[ -]?off/i.test(event.name);
 const result=entry?.result??'Not played';const completed=entry?.status==='Completed'&&result!=='Completed'&&!/Skipped|not entered/i.test(result);
 const type=exhibition?'Exhibition achievement':qualifier?'Qualification achievement':world?'Ranking title':'Non-ranking title';
 const publication=earning?.earnedOn??ledger?.completedOn??entry?.endDate??event.endDate??event.startDate;
 const credit=earning?.amount??(completed?entry?.rankingPoints:undefined);
 return {result,completed,prize:completed && entry?.recoveredFromLedger?.prizeKnown !== false ? entry?.prizeMoney:undefined,winnerPrize:event.winnerPrize,
  credit:exhibition?0:credit,world,publication,rankingLabel:world?'World and one-year rankings':exhibition?'No ranking credit':event.rankingType??'Circuit standings',
  creditStatus:exhibition?'Result date: '+publication+' · no ranking publication':world?(publication>state.currentDate?'Publishes '+publication:'Published '+publication):'Result date: '+publication,
  trophy:completed?(result==='Winner'?type:'No trophy for this finish'):'Winner earns: '+type,
  explanation:exhibition?'Prize money and an exhibition achievement; no competitive or ranking title.':qualifier?'Qualification and tour-card places are achievements, separate from tournament titles.':world?'Ranking credit follows the finishing award. Protected seeds and qualifying rules can exclude first-match losses.':'This event does not award world-ranking earnings.'};
}
export function exhibitionAchievements(state:GameState) {
 return state.history.tournamentHistory.filter(e=>e.status==='Completed'&&e.result==='Winner'&&e.eventType==='Exhibition').map(e=>({id:e.season+':'+e.tournamentId,date:e.endDate??e.startDate,name:e.tournamentName,season:e.season,prize:e.prizeMoney,opponent:e.roundResults?.at(-1)?.opponentName,score:e.roundResults?.at(-1)?e.roundResults.at(-1)!.playerFrames+'–'+e.roundResults.at(-1)!.opponentFrames:undefined})).filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i);
}
