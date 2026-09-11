import fs from 'node:fs';
import {playerDecline,applySeasonalAgeRegression,annualDecline} from '../src/game/playerAgeing';
import type {PlayerAttributes} from '../src/types/game';
const initial:PlayerAttributes={technical:{'Long Potting':94,'Break Building':94,'Cue Ball Control':94,'Safety Play':94,Consistency:94},mental:{Composure:94,Focus:94,Resilience:94,Professionalism:94,'Big Match Nerve':94},physical:{Stamina:94,Balance:94,'Shoulder Health':94,'Hand Steadiness':94,'Recovery Rate':94}};
const rating=(a:PlayerAttributes)=>Object.values(a.technical).reduce((n,v)=>n+v,0)/5*.46+Object.values(a.mental).reduce((n,v)=>n+v,0)/5*.34+Object.values(a.physical).reduce((n,v)=>n+v,0)/5*.2;
const rows=[];let largestError=0;
for(let seed=0;seed<1200;seed++){
 const profile=playerDecline({id:'human'},seed);let attributes=initial,cpu=94;
 for(let age=30;age<=60;age++){
  if(age%5===0)rows.push({seed,age,...profile,human:rating(attributes),cpu});
  const single=applySeasonalAgeRegression(initial,age,profile);largestError=Math.max(largestError,Math.abs(rating(initial)-rating(single)-annualDecline(age,profile)));
  attributes=applySeasonalAgeRegression(attributes,age,profile);cpu=Math.max(35,cpu-annualDecline(age,profile));
 }
}
const summary=[30,35,40,45,50,55,60].map(age=>{const data=rows.filter(r=>r.age===age).map(r=>r.human).sort((a,b)=>a-b);return{age,min:data[0],median:data[Math.floor(data.length/2)],max:data.at(-1)}});
const result={profiles:1200,design:'Controlled attribute experiment, initial 94 in every attribute at age 30, no training, equipment, personality or match modifiers. Tests ageing parity and variation, not championship win rates.',largestSingleSeasonParityError:largestError,summary,rows};
fs.mkdirSync('artifacts/retirement-fixes',{recursive:true});fs.writeFileSync('artifacts/retirement-fixes/ageing-parity.json',JSON.stringify(result,null,2));console.log({profiles:1200,largestError,summary});
