import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {buildSync} from 'esbuild';
import {createPlayerStartingLevelCatalog} from '../src/data/gameContent';
import {getValidatedStartingLevel} from '../src/utils/newCareerConfig';

// Durable independent-process matrix. Each child uses the same immutable engine.
const root=process.cwd();
const flag=(name:string,fallback:string)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)??fallback;
const label=flag('label','all-ages-to-65-20260912');
if(!/^[a-z0-9-]+$/i.test(label))throw new Error('Use an alphanumeric label.');
const stopAge=Number(flag('stop-age','65'));
const concurrency=Number(flag('workers','4'));
const selected=flag('ages','all');
const previous=[12,15,18,21,30,40,50];
const ages=selected==='all'?[...previous,...Array.from({length:39},(_,i)=>12+i).filter(n=>!previous.includes(n))]:selected==='previous'?previous:selected.split(',').map(Number);
if(!ages.length||new Set(ages).size!==ages.length||ages.some(a=>!Number.isInteger(a)||a<12||a>50)||!Number.isInteger(stopAge)||stopAge>100||stopAge<=Math.max(...ages)||!Number.isInteger(concurrency)||concurrency<1||concurrency>8)throw new Error('Invalid matrix configuration.');
const dir=path.join(root,'artifacts',label);fs.mkdirSync(dir,{recursive:true});
const manifestPath=path.join(dir,'manifest.json');
const bundle=path.join(root,'artifacts',label+'-engine.mjs');
const sha=(s:string|Buffer)=>crypto.createHash('sha256').update(s).digest('hex');
type Job={id:string;age:number;path:string;requestedPath?:string;seed:number;years:number;status:string;pid?:number;started?:string;finished?:string;seconds?:number;progress?:string;args?:string[];exitCode?:number|null;error?:string;result?:{jsonPath:string;seasonsCompleted:number;issues:string[]};};
const startingPath=(a:number)=>a<15?'start-club-junior':a<18?'start-national-youth':a<21?'start-elite-amateur':a<25?'start-q-tour':a<35?'start-rookie-pro':a<45?'start-top-64':'start-masters';
const jobs:Job[]=ages.flatMap(age=>[104729,130363].map(seed=>({id:`age${age}-${seed}`,age,path:getValidatedStartingLevel(createPlayerStartingLevelCatalog,age,startingPath(age)).id,requestedPath:startingPath(age),seed,years:stopAge-age,status:'queued'})));
let manifest:{label:string;started:string;finished?:string;sourceCommit:string;bundleSha:string;stopAge:number;agePolicy:string;concurrency:number;jobs:Job[];sources:Record<string,string>};
if(fs.existsSync(manifestPath)){
 manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(sha(fs.readFileSync(bundle))!==manifest.bundleSha)throw new Error('Frozen engine changed; use a new label.');
 for(const job of manifest.jobs){if(job.status==='running')throw new Error('A job was left running. Check its PID before changing its status to queued.');}
}else{
 const build=buildSync({entryPoints:['scripts/simulateFiveSeasons.ts'],bundle:true,platform:'node',format:'esm',packages:'external',metafile:true,outfile:bundle});
 const sources=Object.fromEntries(Object.keys(build.metafile!.inputs).filter(p=>fs.existsSync(p)).map(p=>[p,sha(fs.readFileSync(p))]));
 manifest={label,started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),bundleSha:sha(fs.readFileSync(bundle)),stopAge,agePolicy:`Stop the audit at the first checkpoint aged ${stopAge}; do not force the game retirement flag.`,concurrency,jobs,sources};
}
function save(){const text=JSON.stringify(manifest,null,2);for(let attempt=0;attempt<50;attempt++){try{fs.writeFileSync(manifestPath+'.tmp',text);fs.renameSync(manifestPath+'.tmp',manifestPath);return}catch(e){if(attempt===49)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,20)}}}
save();
const common=['--support-profile=middle','--manager-policy=balanced','--rotate-training','--season-life','--live-match-audit','--world-audit','--century-audit','--skip-player-snapshots','--skip-shared-audits','--export-final-save','--progress',`--stop-at-age=${stopAge}`,`--audit-label=${label}`];
async function run(job:Job){
 job.status='running';job.started=new Date().toISOString();job.args=[bundle,`--seasons=${job.years}`,`--seed=${job.seed}`,`--start-age=${job.age}`,`--starting-level-id=${job.path}`,`--scenario-label=${job.id}`,...common];save();
 await new Promise<void>(resolve=>{
  const out=fs.createWriteStream(path.join(dir,job.id+'.stdout.log')),err=fs.createWriteStream(path.join(dir,job.id+'.stderr.log'));let tail='';
  const child=spawn(process.execPath,job.args!,{cwd:root,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=8192'},stdio:['ignore','pipe','pipe']});job.pid=child.pid;save();console.log('START',job.id,job.years+' seasons','PID',job.pid);
  child.stdout.on('data',b=>{out.write(b);tail=(tail+String(b)).slice(-4000000)});
  child.stderr.on('data',b=>{err.write(b);job.progress=String(b).trim().slice(-500);save()});
  child.on('error',e=>{job.error=String(e)});
  child.on('close',code=>{out.end();err.end();job.exitCode=code;job.finished=new Date().toISOString();job.seconds=(Date.parse(job.finished)-Date.parse(job.started!))/1000;
   try{const index=tail.lastIndexOf('\n{');job.result=JSON.parse(tail.slice(index>=0?index+1:0));const report=JSON.parse(fs.readFileSync(path.resolve(job.result!.jsonPath),'utf8'));job.status=code===0&&report.longCareerAudit.ageLimitReached&&report.finalPlayer.age===stopAge?'completed':'incomplete';}catch(e){job.status='failed';job.error=String(e)}
   save();console.log('END',job.id,job.status,Math.round(job.seconds)+'s');resolve();
  });
 });
}
const queue=manifest.jobs.filter(j=>j.status==='queued');let cursor=0;
async function worker(){while(cursor<queue.length)await run(queue[cursor++])}
await Promise.all(Array.from({length:concurrency},worker));manifest.finished=new Date().toISOString();save();console.log('MATRIX COMPLETE',manifest.jobs.filter(j=>j.status==='completed').length+'/'+manifest.jobs.length);
