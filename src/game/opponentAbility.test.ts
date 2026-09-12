import {createStarterState,createNewCareerState,enterTournamentState,bookTravelState,confirmTournamentPreparationState,startLiveMatchState} from '../hooks/useGameState';
import {createPlayerIdentitySeed,createPlayerSliderCatalog,createPlayerBackgroundCatalog} from '../data/gameContent';
import {getDefaultPreparationAllocations} from './tournamentPreparation';
import {reconcileRealism} from './realism';
import {describe,it,expect} from 'vitest';
import {opponentAttributes} from './opponentAbility';
import {calculateOverallRating} from '../utils/calculations';

describe('recorded opponent ability',()=>{
 it('uses actual ability in a playable junior fixture, including after reload',()=>{
  let s=createNewCareerState({fullName:'Youth Ability Test',nationality:'ENG',age:12,handedness:'Right-handed',cueStyle:createPlayerIdentitySeed.cueStyle,playingStyle:createPlayerIdentitySeed.playingStyle,personalityArchetype:createPlayerIdentitySeed.personalityArchetype,sliders:createPlayerSliderCatalog.map(x=>({...x})),backgroundId:createPlayerBackgroundCatalog[0].id,startingLevelId:'start-club-junior'});
  const event=s.tournaments.find(t=>t.name==='Summer Junior Club League')!;
  s.player.cash=10000;s.equipment=createStarterState().equipment;
  s=enterTournamentState(s,event.id);s=bookTravelState(s,event.id);s=confirmTournamentPreparationState(s,event.id,'balanced',getDefaultPreparationAllocations(),[]);
  s=reconcileRealism({...s,currentDate:event.startDate});
  s={...s,worldPlayers:s.worldPlayers.map(p=>({...p,overallRating:50,skillDevelopment:undefined}))};
  const started=startLiveMatchState(s,event.id);
  expect(started.liveMatch?.status,started.lastAction).toBe('In Progress');
  const profile=started.liveMatch!.opponentVisitProfile;
  expect(profile).toBeDefined();
  expect(profile!.breakBuilding).toBeLessThan(58);
  expect(profile!.longPotting).toBeLessThan(58);
  expect(startLiveMatchState(JSON.parse(JSON.stringify(started)),event.id).liveMatch).toEqual(started.liveMatch);
 });

 it.each([45,55,65,75,90])('preserves a rating of %s instead of promoting a circuit leader to elite ability',rating=>{
  const p={id:'junior-1',overallRating:rating};
  const attrs=opponentAttributes(p);
  expect(calculateOverallRating({attributes:attrs})).toBeCloseTo(rating,0);
  for(const group of Object.values(attrs))for(const value of Object.values(group))expect(value).toBeLessThanOrEqual(rating+7);
  expect(opponentAttributes(JSON.parse(JSON.stringify(p)))).toEqual(attrs);
 });
 it('gives different people stable strengths without replacing potential with current ability',()=>{
  const first=opponentAttributes({id:'a',overallRating:50});
  expect(opponentAttributes({id:'b',overallRating:50})).not.toEqual(first);
  expect(opponentAttributes({id:'a',overallRating:50})).toEqual(first);
 });
});
