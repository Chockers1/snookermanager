import {describe,it,expect} from 'vitest';
import {createStarterState,finishSeasonState,startNextSeasonState} from '../hooks/useGameState';
import {seasonTourChangesFixture} from '../../test-support/seasonTourChangesFixture';
import {announceSeasonTourChanges,createSeasonTourChanges,tourChangesMessage} from './seasonTourChanges';
describe('new season tour changes',()=>{
  it('reports actual transitions and does not confuse age eligibility, retirement or existing players with arrivals',()=>{
    const {after}=seasonTourChangesFixture(),report=after.tourChangesReport!;
    const names=(id:string)=>report.sections.find(s=>s.id===id)!.people.map(p=>p.name);
    expect(names('retirements')).toEqual(['Retiring Champion']);expect(names('seniors')).toEqual(['Senior Arrival']);
    expect(names('qSchool')).toEqual(['Q School Graduate']);expect(names('promotions')).toEqual(['Q Tour Graduate']);
    expect(names('youth')).toHaveLength(4);expect(names('pathway')).toEqual(['New Q School Contender']);
    expect(names('cardLosses')).toEqual(expect.arrayContaining(['Senior Arrival','Card Lost']));
    expect(report.sections.flatMap(s=>s.people).some(p=>p.name==='Still Professional'||p.name==='Already Retired')).toBe(false);
    expect(report.sections[0].people[0].detail).toContain('career-best #1');expect(report.complete).toBe(true);
  });
  it('announces Q School requalification without presenting an existing professional as a debutant',()=>{
    const {before,after}=seasonTourChangesFixture();before.worldPlayers[2].hasTourCard=true;before.worldPlayers[2].cardSource='Ranking Retained';
    const report=createSeasonTourChanges(after,before);expect(report.sections.find(s=>s.id==='qSchool')!.people[0].detail).toBe('Requalifies via Q School');
  });
  it('creates exactly one separate immutable message, even after reload or inbox trimming',()=>{
    const {after}=seasonTourChangesFixture();const state=announceSeasonTourChanges(after);
    expect(state.inbox.filter(m=>m.tourChangesReport)).toHaveLength(1);expect(state.inbox[0].sender).toBe('Tour Newsdesk');
    expect(announceSeasonTourChanges(state)).toBe(state);
    const reloaded=JSON.parse(JSON.stringify(state));const snapshot=structuredClone(reloaded.inbox[0].tourChangesReport);
    reloaded.worldPlayers=[];reloaded.currentDate='2028-03-01';expect(announceSeasonTourChanges(reloaded).inbox[0].tourChangesReport).toEqual(snapshot);
    expect(announceSeasonTourChanges({...reloaded,inbox:[]}).inbox).toEqual([]);
  });
  it('handles quiet seasons and does not send invented first-season changes',()=>{
    const {before}=seasonTourChangesFixture();const after={...before,season:'2027/28'};
    expect(createSeasonTourChanges(after,before).sections.every(s=>s.people.length===0)).toBe(true);
    const fresh=createStarterState();expect(announceSeasonTourChanges(fresh)).toBe(fresh);
  });
  it('labels legacy reconstruction as incomplete and never invents a youth intake from profiles without history',()=>{
    const {before,after}=seasonTourChangesFixture();after.tourChangesReport=undefined;
    for(const p of after.worldPlayers){const old=before.worldPlayers.find(b=>b.id===p.id);if(old)p.seasons=[{season:before.season,hasTourCard:old.hasTourCard,seniorRank:null} as typeof p.seasons[number]];}
    const report=createSeasonTourChanges(after);
    expect(report.complete).toBe(false);expect(report.sections.find(s=>s.id==='youth')!.people).toHaveLength(0);
    expect(report.sections.find(s=>s.id==='qSchool')!.people.map(p=>p.name)).toContain('Q School Graduate');
    const notified=announceSeasonTourChanges(after);expect(notified.inbox[0].tourChangesReport?.complete).toBe(false);
    expect(tourChangesMessage(report).preview).toContain('From retained records');
    const graduate=after.worldPlayers.find(p=>p.playerName==='Q School Graduate')!;
    graduate.seasons[0].hasTourCard=true;graduate.seasons[0].cardSource='Ranking Retained';
    expect(createSeasonTourChanges(after).sections.find(s=>s.id==='qSchool')!.people[0].detail).toBe('Requalifies via Q School');
  });
  it('captures the full new population at real rollover and sends the report only when the new season starts',()=>{
    const before=createStarterState();before.currentDate='2027-06-29';before.tournaments=before.tournaments.map(t=>({...t,status:'Skipped'}));
    const closed=finishSeasonState(before);
    expect(closed.tourChangesReport?.complete).toBe(true);expect(closed.tourChangesReport?.season).toBe('2027/28');expect(closed.worldPopulationSeason).toBe('2027/28');
    expect(closed.inbox.some(m=>m.id==='tour-changes:2027/28')).toBe(false);
    const next=startNextSeasonState(closed);
    const message=next.inbox.find(m=>m.id==='tour-changes:2027/28')!;expect(message.tourChangesReport).toEqual(closed.tourChangesReport);
    expect(next.inbox.some(m=>m.subject==='2027/28 season started')).toBe(true);
    expect(startNextSeasonState(next).inbox.filter(m=>m.id===message.id)).toHaveLength(1);
  },30000);
});
