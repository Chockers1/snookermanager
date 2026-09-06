import { createStarterState } from '../src/hooks/useGameState';
import { recordEncounter } from '../src/game/careerDepth/relationships';
import { createCareerDepth } from '../src/game/careerDepth/shared';
export function rivalriesFixture() {
  let state = createStarterState();
  state.careerDepth = createCareerDepth(state);
  const opponents = state.worldPlayers.filter(p=>p.playerName !== state.player.fullName).slice(0,2);
  for(let i=0;i<4;i++) {
    const opponent=opponents[i===3?1:0];
    state=recordEncounter(state,{...state.matches[0], id:'rival-fixture-'+i, opponentId:opponent.id, opponentName:opponent.playerName, result:i===1?'Lost':'Won', round:'Last 16',bestOf:7, playerFrames:i===1?3:4,opponentFrames:i===1?4:3,playedOn:state.currentDate});
  }
  return {state, rival:opponents[0], newcomer:opponents[1]};
}
