import { expect, it } from 'vitest';
import { rivalriesFixture } from '../../../test-support/rivalriesFixture';
import { rivalryRecords, rivalryStage, rivalryMeetings } from './rivalryView';
it('shows established and emerging histories without changing the career',()=>{
 const {state,rival,newcomer}=rivalriesFixture(); const before=JSON.stringify(state);
 const records=rivalryRecords(state);expect(records[0].opponentId).toBe(rival.id);
 expect(rivalryStage(records[0])).toBe('Established rivalry');expect(records[0].wins).toBe(2);expect(records[0].losses).toBe(1);
 expect(rivalryStage(records.find(r=>r.opponentId===newcomer.id)!)).toBe('First meeting');
 expect(rivalryMeetings(state,records[0])).toHaveLength(3);expect(JSON.stringify(state)).toBe(before);
});
it('preserves old head-to-head totals without inventing missing intensity or meetings',()=>{
 const {state}=rivalriesFixture(); const r=rivalryRecords(state)[0];delete r.intensity;delete r.meetings;state.history.matchLog=[];
 expect(rivalryRecords(state).find(x=>x.opponentId===r.opponentId)?.wins).toBe(2);expect(rivalryMeetings(state,r)).toEqual([]);expect(r.intensity).toBeUndefined();
});
it('uses surviving named match logs once and does not confuse duplicate player names',()=>{
 const {state,rival}=rivalriesFixture(); const r=rivalryRecords(state)[0]; const m=r.meetings![0];
 state.history.matchLog=[{id:m.id,season:state.season,date:m.date,tournamentId:'old',tournamentName:'Historic Open',eventType:'Ranking',round:m.round,opponentName:r.name,result:'Won',score:'4-3',bestOf:7,playerFrames:4,opponentFrames:3,wentToDecider:true,pressurePeak:0,prizeMoney:0,rankingPoints:0}];
 expect(rivalryMeetings(state,r)).toHaveLength(3);delete r.meetings;expect(rivalryMeetings(state,r)[0].event).toBe('Historic Open');
 state.worldPlayers.push({...rival,id:'another-same-name'});expect(rivalryMeetings(state,r)).toEqual([]);
});
