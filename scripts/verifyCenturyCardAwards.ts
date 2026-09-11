import fs from 'node:fs';
import path from 'node:path';
import {pathwayCardAwards} from '../src/game/pathwayRules';
import {tournamentCatalog} from '../src/data/gameContent';
import type {GameState} from '../src/hooks/useGameState';
import type {BracketRound,Tournament} from '../src/types/game';
const source=process.argv[2],out=process.argv[3]??'artifacts/century-20260911/report';
if(!source)throw new Error('Supply annual world evidence directory');
const rows:{season:string;name:string;route:string;card:boolean;cardSource?:string}[]=[];
for(const f of fs.readdirSync(source).filter(x=>/^\d{4}-\d{2}\.json$/.test(x)).sort()){
 const d=JSON.parse(fs.readFileSync(path.join(source,f),'utf8')) as {season:string;events:{id:string;name:string;type:Tournament['type'];date:string;ranking:boolean;bracket:BracketRound[]}[];roster:{name:string;card:boolean;cardSource:string}[]};
 const events=Object.fromEntries(d.events.map(e=>[e.id,{key:e.id,tournamentId:e.id,name:e.name,season:d.season,completedOn:e.date,ranking:e.ranking,bracket:e.bracket,applied:true,eventType:e.type,tourCircuit:tournamentCatalog.find(t=>t.id===e.id)?.tourCircuit}]));
 const ledger={version:1,initializedOn:'2026-01-01',processedThrough:'9999-12-31',earnings:[],events,legacyEventKeys:[],revisions:[],seedings:{},movementWorld:{},movementOneYear:{}} as NonNullable<GameState['rollingRankings']>;
 const awards=pathwayCardAwards({season:d.season,tournaments:tournamentCatalog,rollingRankings:ledger});
 for(const [name,route]of awards){const p=d.roster.find(p=>p.name===name);rows.push({season:d.season,name,route,card:!!p?.card,cardSource:p?.cardSource});}
}
const summary={seasons:new Set(rows.map(r=>r.season)).size,awards:rows.length,byRoute:Object.fromEntries([...new Set(rows.map(r=>r.route))].map(k=>[k,rows.filter(r=>r.route===k).length])),missing:rows.filter(r=>!r.card),note:'Recomputed published qualification awards using current configured pathway rules and original complete annual brackets, then checked next-season cards. This verifies allocation, not independently researched real-world eligibility.'};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'all-card-awards.json'),JSON.stringify({summary,rows},null,2));
const quote=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';fs.writeFileSync(path.join(out,'all-card-awards.csv'),[['Season','Player','Earned route','Next-season card','Recorded source'],...rows.map(r=>[r.season,r.name,r.route,r.card,r.cardSource])].map(r=>r.map(quote).join(',')).join('\n'));
console.log(JSON.stringify(summary,null,2));
