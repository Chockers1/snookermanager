import fs from 'node:fs';
import {createStarterState,simulateSyntheticLiveVisitMatch,type SyntheticLiveVisitMatchInput} from '../src/hooks/useGameState';
import {SIMULATION_MODE} from '../src/utils/simulationMode';

const attributes=createStarterState().attributes;
for(const group of Object.values(attributes))for(const key of Object.keys(group))group[key]=90;
const cases=[
 {name:'Matched players',confidence:75,fatigue:30,opponentConfidence:75,opponentFatigue:30,mode:'attributes'},
 {name:'Confidence advantage only',confidence:95,fatigue:30,opponentConfidence:75,opponentFatigue:30,mode:'attributes'},
 {name:'Freshness advantage only',confidence:75,fatigue:0,opponentConfidence:75,opponentFatigue:40,mode:'attributes'},
 {name:'Confidence and freshness',confidence:95,fatigue:0,opponentConfidence:75,opponentFatigue:40,mode:'attributes'},
 {name:'Opponent confidence and freshness',confidence:75,fatigue:40,opponentConfidence:95,opponentFatigue:0,mode:'attributes'},
 {name:'Rank-built opponent, equal preparation',confidence:75,fatigue:30,opponentConfidence:75,opponentFatigue:30,mode:'rankBased'},
] as const;
const rows=[];
for(const c of cases){
 let wins=0,frames=0,wonFrames=0,centuries=0;
 const n=300;
 for(let i=0;i<n;i++){
  const input:SyntheticLiveVisitMatchInput={simulationMode:SIMULATION_MODE.liveVisitCalibration,playerName:'Human',opponentName:'Opponent',bestOf:35,seed:104729+i*997,playerAttributes:attributes,opponentAttributes:attributes,opponentProfileMode:c.mode,startingPlayer:i%2?'player':'opponent',playerConfidence:c.confidence,playerFatigue:c.fatigue,opponentConfidence:c.opponentConfidence,opponentFatigue:c.opponentFatigue,playerClutch:90,opponentClutch:90,playerStrength:90,opponentStrength:90,opponentRanking:4,plannedMatchWinChance:50,playerTacticalPlan:'Balanced',opponentTacticalPlan:'Balanced'};
  const result=simulateSyntheticLiveVisitMatch(input);wins+=Number(result.playerWon);wonFrames+=result.playerFrames;frames+=result.playerFrames+result.opponentFrames;centuries+=result.playerCenturies;
 }
 const p=wins/n,z=1.96,denom=1+z*z/n,centre=(p+z*z/(2*n))/denom,margin=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/denom;
 rows.push({...c,matches:n,wins,winPercent:p*100,wilson95:[(centre-margin)*100,(centre+margin)*100],frameWinPercent:wonFrames/frames*100,centuries});
 console.log(c.name,wins+'/'+n);
}
fs.mkdirSync('artifacts/career-v012',{recursive:true});fs.writeFileSync('artifacts/career-v012/dominance-controls.json',JSON.stringify({description:'Live visit calibration, balanced tactics, alternating opening side; no career training or selection. Confidence and fatigue values are controlled inputs, not predicted match probabilities.',rows},null,2));
