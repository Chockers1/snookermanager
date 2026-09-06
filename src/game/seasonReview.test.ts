import { describe, it, expect } from 'vitest';
import { createStarterState, finishSeasonState, advanceWeekState, startNextSeasonState, getNextEligibleTournament, repairGameState } from '../hooks/useGameState';
import { recordedSeasonWinners } from './seasonReview';
import { initializeCareerDepth } from './careerDepth';
import { rankingEventKey } from './rollingRankings';
function runIn() {
  const state = initializeCareerDepth(createStarterState());
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Skipped' }));
  state.currentDate = '2027-04-17';
  state.careerDepth!.nextSettlementDate = '2027-04-20';
  return state;
}
describe('season completion', () => {
  it('finishes free weeks exactly at June 30, preserves settlement behaviour and unlocks a fresh calendar', () => {
    const initial = runIn();
    const completed = finishSeasonState(initial);
    expect(completed.currentDate).toBe('2027-06-30');
    expect(completed.seasonReview?.pending).toBe(true);
    expect(completed.seasonReview?.completedSeason.season).toBe(initial.season);
    let stepped = initial;
    for (let i=0; i<100 && !stepped.seasonReview?.pending; i++) stepped = advanceWeekState(stepped);
    expect(completed.player.cash).toBe(stepped.player.cash);
    expect(completed.week).toBe(stepped.week);
    expect(completed.seasonReview?.finalRankings).toEqual(stepped.seasonReview?.finalRankings);
    expect(completed.history.seasonRecords).toHaveLength(1);
    const reloaded = repairGameState(JSON.parse(JSON.stringify(completed)));
    expect(reloaded.seasonReview).toEqual(completed.seasonReview);
    const next = startNextSeasonState(reloaded);
    expect(next.seasonReview).toBeNull();
    const email = next.inbox.find(m => m.seasonReport);
    expect(email?.seasonReport?.record).toEqual(completed.seasonReview?.completedSeason);
    expect(email?.seasonReport?.closingCash).toBe(completed.player.cash);
    expect(email?.seasonReport?.majorWinners).toEqual(completed.seasonReview?.majorWinners);
    expect(email?.seasonReport?.decision).toEqual(completed.seasonReview?.careerDecision);
    expect(next.season).toBe('2027/28');
    const briefing = next.inbox.find(m => m.seasonStartReport);
    expect(briefing?.seasonStartReport?.season).toBe('2027/28');
    expect(briefing?.seasonStartReport?.lastSeason?.matches).toBe(completed.seasonReview?.completedSeason.matchesPlayed);
    expect(briefing?.actionRoute).toBe('/calendar');
    expect(getNextEligibleTournament(next)).toBeDefined();
    expect(finishSeasonState(completed).history.seasonRecords).toHaveLength(1);
  }, 30000);
  it('pauses for eligible events and career decisions without advancing or spending', () => {
    const available = createStarterState();
    const paused = finishSeasonState(available);
    expect(paused.currentDate).toBe(available.currentDate);
    expect(paused.player.cash).toBe(available.player.cash);
    expect(paused.lastAction).toContain('Play or skip');
    const state = runIn();
    state.careerDepth!.stories.push({ id:'decision', kind:'early-exits', title:'Review approach', evidence:'Three exits', createdDate:state.currentDate, expiresDate:'2027-05-01', updates:[], status:'pending', matchCount:0, trainingWeeks:0 });
    const decision = finishSeasonState(state);
    expect(decision.currentDate).toBe(state.currentDate);
    expect(decision.lastAction).toContain('inbox');
  });
  it('reports actual final winners, excludes qualifiers and leaves absent old results unknown', () => {
    const state = runIn();
    const event = state.tournaments.find(t => t.name === 'World Championship')!;
    const key = rankingEventKey(event);
    state.rollingRankings!.events[key] = { key, tournamentId:event.id, name:event.name, season:state.season, completedOn:event.endDate!, ranking:true, applied:true, bracket:[{ label:'Final', matches:[{ id:'final-test', top:{ name:'Recorded Champion', nation:'ENG', rank:22, score:18 }, bottom:{ name:'Finalist', nation:'ENG', rank:1, score:15 } }] }] };
    const winners = recordedSeasonWinners(state);
    expect(winners.find(w => w.tournamentName === event.name)?.winner).toBe('Recorded Champion');
    expect(winners.some(w => /qualif/i.test(w.tournamentName))).toBe(false);
    expect(winners.find(w => w.tournamentName === 'Masters')?.winner).toBe('Not recorded in this save');
    const complete = finishSeasonState(state);
    expect(complete.seasonReview?.majorWinners.find(w => w.tournamentName === event.name)?.winner).toBe('Recorded Champion');
  }, 30000);
});
