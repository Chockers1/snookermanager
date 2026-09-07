import type { Tournament } from '../types/game';
import { resolveTournamentFormat } from './tournamentFormats';

// Published 2025/26 baseline, carried forward in the fictional game calendar.
// Amounts are finishing awards, not cumulative payments. See docs/tournament-prizes.md.
export type PrizeSchedule = { total: number; awards: Record<string, number>; source: string };
const seasonSource = 'https://en.wikipedia.org/wiki/2025%E2%80%9326_snooker_season#World_ranking_points';
const knockout = (total:number, winner:number, final:number, semi:number, quarter:number, last16=0, last32=0, last64=0, extra:Record<string,number> = {}, source=seasonSource):PrizeSchedule => ({total,source,awards:{Winner:winner,Final:final,'Semi Final':semi,'Quarter Final':quarter,'Last 16':last16,'Last 32':last32,'Last 64':last64,'Last 128':0,...extra}});
const home = knockout(550400,100000,45000,21000,13200,9000,5400,3600,{'Qualifying Round 1':0,'Qualifying Round 2':1000,'Qualifying Round 3':3600});
const intl = knockout(825000,175000,75000,33000,22000,14000,9000,5000);
const schedules: Record<string,PrizeSchedule> = {
  'Shanghai Masters':knockout(825000,210000,105000,70000,35000,17500,0,0,{'Last 24':10000,'Round 1':10000},'https://www.wst.tv/news/2023/august/11/ding-to-meet-si-in-shanghai/'),
  'Saudi Arabia Masters':knockout(2302000,500000,200000,100000,50000,30000,20000,0,{'Round 1':2000,'Round 2':4000,'Round 3':7000,'Round 4':11000}),
  'Wuhan Open':knockout(700000,140000,63000,30000,16000,12000,8000,4500,{'Qualifying Round 1':0,'Qualifying Round 2':0,'Qualifying Round 3':4500},'https://www.wst.tv/news/2023/august/29/wuhan-open-draw/'),
  'English Open':home, 'Northern Ireland Open':home, 'Scottish Open':home, 'Welsh Open':home, 'German Masters':home,
  'British Open':knockout(502000,100000,45000,20000,12000,9000,6000,3000),
  "Xi'an Grand Prix":knockout(850000,177000,76000,34500,22350,14000,9400,5350,{'Qualifying Round 1':0,'Qualifying Round 2':0,'Qualifying Round 3':5350}),
  'International Championship':intl, 'World Open':intl,
  'Champion of Champions':knockout(440000,150000,60000,30000,17500,12500,0,0,{'Group Semi Final':12500,'Group Final':17500},'https://en.wikipedia.org/wiki/2025_Champion_of_Champions#Prize_fund'),
  'Riyadh Season Championship':knockout(785000,250000,125000,75000,50000,0,0,0,{'Preliminary Round':5000,'Quarter Final Play-in':25000},'https://en.wikipedia.org/wiki/2025_Riyadh_Season_Snooker_Championship#Prize_money'),
  'UK Championship':knockout(1205000,250000,100000,50000,25000,15000,10000),
  'Shoot Out':knockout(171000,50000,20000,8000,4000,2000,1000,500,{'Last 128':250}),
  'Masters':knockout(1015000,350000,140000,75000,40000,25000,0,0,{},'https://en.wikipedia.org/wiki/2026_Masters_(snooker)#Prize_fund'),
  'World Grand Prix':knockout(700000,180000,80000,35000,20000,15000,10000),
  'Players Championship':knockout(500000,150000,70000,35000,20000,15000),
  'Tour Championship':knockout(500000,150000,60000,40000,30000,0,0,0,{'Round One':20000,'Last 12':20000}),
  'World Championship':knockout(2395000,500000,200000,100000,50000,30000,20000),
};
const qualifying = (total:number, awards:Record<string,number>):PrizeSchedule => ({total,awards:{Winner:0,...awards},source:seasonSource});
schedules['English Open Qualifying'] = qualifying(32000,{'Qualifying Round 1':0,'Qualifying Round 2':1000});
schedules['Welsh Open Qualifying'] = schedules['English Open Qualifying'];
schedules['International Championship Qualifying'] = qualifying(0,{'Qualifying Round':0});
schedules['World Open Qualifying'] = schedules['International Championship Qualifying'];
schedules['UK Championship Qualifying'] = qualifying(360000,{'Qualifying Round 1':0,'Qualifying Round 2':2500,'Qualifying Round 3':5000,'Qualifying Round 4':7500});
schedules['World Championship Qualifying'] = qualifying(720000,{'Qualifying Round 1':0,'Qualifying Round 2':5000,'Qualifying Round 3':10000,'Judgement Day':15000});
export function tournamentPrizeSchedule(t:Pick<Tournament,'name'>) { return schedules[t.name.replaceAll('’', "'")]; }
export function scheduledPlacementPrize(t:Tournament,round:string,champion:boolean):number|undefined {
  const schedule=tournamentPrizeSchedule(t);
  if(!schedule) return undefined;
  // Older draws can contain a removed stage. Unrecognised historical stages are
  // left to the old award rule; never map them to an unrelated later round.
  return schedule.awards[champion?'Winner':round];
}
export function withTournamentPrizes(t:Tournament):Tournament {
  const s=tournamentPrizeSchedule(t); if(!s) return t;
  const a=s.awards;
  return {...t,prizeMoney:s.total,totalPrizeFund:s.total,winnerPrize:a.Winner,runnerUpPrize:a.Final??0,semiFinalPrize:a['Semi Final']??0,quarterFinalPrize:a['Quarter Final']??0,firstRoundPrize:a[resolveTournamentFormat(t).roundStructure[0]]??0};
}
