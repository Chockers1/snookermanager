import { describe, expect, it } from 'vitest';
import { seasonEntryFixture } from '../../test-support/seasonEntryFixture';
import { enterTournamentState, getNextEligibleTournament, getTournamentEntryAccess, repairGameState, withdrawTournamentState, bookTravelState } from '../hooks/useGameState';

describe('season-two tournament entry',()=>{
  it('keeps rank 18 and the accepted Shanghai entry after the first zero-win season record is created',()=>{
    const state=seasonEntryFixture(),shanghai=state.tournaments.find(t=>t.name==='Shanghai Masters')!;
    expect(getTournamentEntryAccess(state,shanghai).allowed).toBe(true);
    const entered=enterTournamentState(state,shanghai.id);
    expect(entered.careerSystems.pro.worldRank).toBe(18);
    expect(entered.player.careerStage).toBe('Top 32 Professional');
    expect(entered.history.tournamentHistory.find(h=>h.season==='2027/28')?.wins).toBe(0);
    expect(getTournamentEntryAccess(entered,shanghai)).toMatchObject({allowed:true,accessBand:'top32'});
    expect(getNextEligibleTournament(entered)?.id).toBe(shanghai.id);
    const reloaded=repairGameState(JSON.parse(JSON.stringify(entered)));
    expect(reloaded.tournamentProgress.draw).toEqual(entered.tournamentProgress.draw);
    expect(getNextEligibleTournament(reloaded)?.id).toBe(shanghai.id);
    const saudi=entered.tournaments.find(t=>t.name==='Saudi Arabia Masters')!;
    expect(enterTournamentState(entered,saudi.id).lastAction).toContain('Withdraw from or finish Shanghai');
    const switched=enterTournamentState(withdrawTournamentState(entered,shanghai.id),saudi.id);
    expect(switched.tournamentProgress.tournamentId).toBe(saudi.id);
    expect(switched.tournamentProgress.currentRound).toBe('Round 3');
    expect(switched.player.careerStage).toBe('Top 32 Professional');
  });
  it('keeps an established draw visible and its booking intact if entry eligibility changes',()=>{
    const state=seasonEntryFixture(),shanghai=state.tournaments.find(t=>t.name==='Shanghai Masters')!;
    const entered=bookTravelState(enterTournamentState(state,shanghai.id),shanghai.id);
    entered.careerSystems.pro.worldRank=70;entered.player.worldRanking=70;
    expect(getTournamentEntryAccess(entered,shanghai).allowed).toBe(false);
    expect(getNextEligibleTournament(entered)?.id).toBe(shanghai.id);
    const restored=repairGameState(entered);
    expect(restored.tournamentProgress.draw).toEqual(entered.tournamentProgress.draw);
    expect(restored.travel.bookings[shanghai.id]).toEqual(entered.travel.bookings[shanghai.id]);
    expect(getNextEligibleTournament(restored)?.id).toBe(shanghai.id);
    const withdrawn=withdrawTournamentState(restored,shanghai.id);
    expect(withdrawn.tournamentProgress.tournamentId).toBeNull();
    expect(withdrawn.tournaments.find(t=>t.id===shanghai.id)?.status).toBe('Available');
  });
});
