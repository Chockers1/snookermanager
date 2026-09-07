import { beforeAll, describe, expect, it } from 'vitest';
import { detailedTournamentCatalog } from '../data/pathwayCalendarData';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { scheduledPlacementPrize, tournamentPrizeSchedule } from '../data/tournamentPrizes';
import { getTournamentPlacementAwards, repairGameState } from '../hooks/useGameState';
import { payoutRepairFixture } from '../../test-support/payoutRepairFixture';
import { repairTournamentPayouts } from './payoutRepair';
import { recordRankingEvent, rankingEventKey, rebuildRollingRankings } from './rollingRankings';

let fixture:ReturnType<typeof payoutRepairFixture>;
beforeAll(()=>{fixture=payoutRepairFixture();});
const fix=(s=structuredClone(fixture.state))=>repairTournamentPayouts(s,getTournamentPlacementAwards);
describe('event-specific prize schedules',()=>{
  it('defines every stage of every supported current format, including unpaid stages',()=>{
    for(const t of detailedTournamentCatalog.filter(t=>tournamentPrizeSchedule(t))) {
      for(const round of resolveTournamentFormat(t).roundStructure) expect(scheduledPlacementPrize(t,round,false),t.name+' / '+round).toBeTypeOf('number');
      expect(scheduledPlacementPrize(t,'Final',true),t.name).toBeTypeOf('number');
    }
  });
  it('pays the actual finishing stage, never the generic first-round zero',()=>{
    for(const [name,round,champion,amount] of [["Xi'an Grand Prix",'Last 16',false,14000],['International Championship','Last 32',false,9000],['Players Championship','Final',true,150000],['World Grand Prix','Semi Final',false,35000],['Wuhan Open','Semi Final',false,30000],['World Championship Qualifying','Judgement Day',false,15000],['World Championship Qualifying','Judgement Day',true,0]] as const) {
      const t=detailedTournamentCatalog.find(t=>t.name===name)!;expect(getTournamentPlacementAwards(t,round,champion).prizeMoney,name).toBe(amount);
    }
  });
});
describe('recorded payout reconciliation',()=>{
  it('repairs the human and all CPU awards without replaying results or changing publication',()=>{
    const old=fixture.state, next=fix(), name=old.player.fullName;
    expect(next.player.cash).toBe(old.player.cash-26000);expect(next.finance.cash).toBe(next.player.cash);
    expect(next.history.tournamentHistory.find(h=>h.tournamentId===fixture.event.id)?.prizeMoney).toBe(30000);
    const event=next.rollingRankings!.events[fixture.key];expect(event.bracket).toEqual(old.rollingRankings!.events[fixture.key].bracket);
    expect(event.prizeAwards?.[name]).toBe(30000);
    const final=event.bracket.at(-1)!.matches[0], winner=final.top.score!>final.bottom.score!?final.top.name:final.bottom.name;
    expect(event.prizeAwards?.[winner]).toBe(140000);
    expect(next.competitionTables.world.find(r=>r.playerName===winner)!.prizeMoney).toBe(old.competitionTables.world.find(r=>r.playerName===winner)!.prizeMoney-210000);
    for(const e of next.rollingRankings!.earnings.filter(e=>e.eventKey===fixture.key)) {
      const before=old.rollingRankings!.earnings.find(o=>o.id===e.id)!;expect(e.earnedOn).toBe(before.earnedOn);expect(e.expiresOn).toBe(before.expiresOn);
    }
    const financial=next.inbox.find(m=>m.eventFinance?.tournamentId===fixture.event.id)!.eventFinance!;
    const before=old.inbox.find(m=>m.eventFinance?.tournamentId===fixture.event.id)!.eventFinance!;
    expect(financial.prize).toBe(30000);expect(financial.costs).toBe(before.costs);expect(financial.net).toBe(before.net-26000);
    expect(next.rollingRankings!.seedings).toEqual(old.rollingRankings!.seedings);
    const published=rebuildRollingRankings(next,fixture.event.endDate!,true);
    expect(published.competitionTables.world.every((r,i,rows)=>i===0||rows[i-1].points>=r.points)).toBe(true);
  });
  it('is idempotent after serialization and full save repair, including finance transactions',()=>{
    const once=repairGameState(structuredClone(fixture.state)), twice=repairGameState(JSON.parse(JSON.stringify(once)));
    expect(twice.player.cash).toBe(once.player.cash);expect(twice.finance.ledger).toEqual(once.finance.ledger);
    expect(twice.rollingRankings!.earnings).toEqual(once.rollingRankings!.earnings);
    expect(twice.inbox.filter(m=>m.id==='payout-repair-v1')).toHaveLength(1);
  });
  it('retains original cash when a recovered history row lacks a reliable payment receipt',()=>{
    const old=structuredClone(fixture.state);old.history.tournamentHistory=old.history.tournamentHistory.map(h=>({...h,prizeMoney:0,recoveredFromLedger:{prizeKnown:false}}));
    delete old.rollingRankings!.events[fixture.key];
    const next=fix(old);expect(next.player.cash).toBe(old.player.cash);expect(next.payoutRepair!.unresolved.join(' ')).toContain('original cash receipt unavailable');

  });
  it('recovers a missing personal cash receipt from the retained full draw and old award rules',()=>{
    const old=structuredClone(fixture.state);old.history.tournamentHistory=old.history.tournamentHistory.map(h=>({...h,prizeMoney:0,recoveredFromLedger:{prizeKnown:false}}));
    delete old.rollingRankings!.events[fixture.key].prizeAwards;
    const next=fix(old);expect(next.player.cash).toBe(old.player.cash-26000);
    expect(next.history.tournamentHistory.find(h=>h.tournamentId===fixture.event.id)).toMatchObject({prizeMoney:30000,recoveredFromLedger:{prizeKnown:true}});
  });
  it('never changes one-year prize totals or ranking earnings for invitational corrections',()=>{
    let old=structuredClone(fixture.state);const t=old.tournaments.find(t=>t.name==='Masters')!, [a,b]=old.competitionTables.world.filter(r=>r.playerName!==old.player.fullName);
    const draw=[{label:'Final',matches:[{id:'masters-final',top:{name:a.playerName,rank:a.ranking,nation:'ENG',score:10},bottom:{name:b.playerName,rank:b.ranking,nation:'ENG',score:4}}]}];
    old=recordRankingEvent(old,t,draw,(_t,_r,champion)=>({prizeMoney:champion?400000:176000}));const key=rankingEventKey(t);delete old.rollingRankings!.events[key].prizeVersion;
    const without=fix(fixture.state), withMasters=fix(old);
    expect(withMasters.competitionTables.oneYear).toEqual(without.competitionTables.oneYear);
    expect(withMasters.rollingRankings!.earnings).toEqual(without.rollingRankings!.earnings);
    expect(withMasters.competitionTables.world.find(r=>r.playerName===a.playerName)!.prizeMoney).toBe(without.competitionTables.world.find(r=>r.playerName===a.playerName)!.prizeMoney-50000);
  });
  it('retains cash-only awards for protected seeded losses and Shoot Out opening losses',()=>{
    for(const [name,round,cash] of [['World Championship','Last 32',20000],['Shoot Out','Last 128',250],['Saudi Arabia Masters','Round 1',2000]] as const){
      const state=structuredClone(fixture.state), t=state.tournaments.find(t=>t.name===name)!;
      const draw=[{label:round,matches:[{id:'opening',top:{name:state.player.fullName,rank:1,nation:'ENG',score:0},bottom:{name:'Test Opponent',rank:64,nation:'ENG',score:1}}]}];
      const key=rankingEventKey(t);delete state.rollingRankings!.events[key];state.rollingRankings!.earnings=state.rollingRankings!.earnings.filter(e=>e.eventKey!==key);state.rollingRankings!.legacyEventKeys=state.rollingRankings!.legacyEventKeys.filter(k=>k!==key);
      const next=recordRankingEvent(state,t,draw,getTournamentPlacementAwards);
      expect(next.rollingRankings!.events[key].prizeAwards?.[state.player.fullName]).toBe(cash);
      expect(next.rollingRankings!.earnings.find(e=>e.eventKey===key&&e.playerName===state.player.fullName)?.amount).toBe(0);
    }
  });
});
