const fs = require('fs');
const path = require('path');
const source = process.argv[2];
if (!source) throw Error('Usage: node scripts/summarizeWorldAudit.cjs <world-audit-directory>');
const out = path.resolve(process.argv[3] ?? 'artifacts/century-20260911/report');
const managedPath=source.replace(/-world[\\/]?$/, '')+'.json';
const managed=fs.existsSync(managedPath)?JSON.parse(fs.readFileSync(managedPath,'utf8')):null;
fs.mkdirSync(out, {recursive:true});
const csvCell = v => '"'+String(v??'').replaceAll('"','""')+'"';
const writeCsv = (name, headings, rows) => fs.writeFileSync(path.join(out,name),[headings,...rows].map(row=>row.map(csvCell).join(',')).join('\n'));
const average = a => a.length ? a.reduce((n,x)=>n+x,0)/a.length : 0;


const majorNames = ['World Championship','UK Championship','Masters','Tour Championship','Champion of Champions'];
const seasons=[], eventCsv=[], playerCsv=[], issueCsv=[], rankingCsv=[], titleCounts=new Map(), worldCounts=new Map(), numberOnes=new Map();
let initialNames, previousRoster, expected=0, completed=0, matches=0, invalidScores=0, mismatchedRecords=0, majorCountMissing=0, breakCountMissing=0, anonymousChampions=0, anonymousTitles=0, fillerEntries=0, ageViolations=0, namedQualifications=0, missingCards=0, eventsBeyondRollover=0;
const actualTitleTotals=new Map(), actualMajorTotals=new Map(), rawIssuesByKind={};
let retiredNamedFlags=0;
for (const file of fs.readdirSync(source).filter(n=>/^\d{4}-\d{2}\.json$/.test(n)).sort()) {
 const d=JSON.parse(fs.readFileSync(path.join(source,file),'utf8'));
 for(const issue of d.issues){rawIssuesByKind[issue.kind]=(rawIssuesByKind[issue.kind]??0)+1;if(issue.kind==='retired-entry' && issue.detail.slice(issue.detail.indexOf(':')+1).split(',').some(n=>!/^Qualifier \d+$/.test(n.trim())))retiredNamedFlags++;}
 for(const row of d.rankings)rankingCsv.push([d.season,'world','Frozen closing standings',row.ranking,row.playerName,row.points]);
 for(const [circuit,rows]of Object.entries(d.closingCircuitTablesBeforeFinalAdvance))if(circuit!=='world')for(const row of rows)rankingCsv.push([d.season,circuit,'Before final calendar advance',row.ranking,row.playerName,row.points,row.eventsPlayed,row.wins,row.losses,row.titles]);
 if(!initialNames) initialNames=new Set(d.roster.filter(p=>!d.newcomers.some(n=>n.id===p.id)).map(p=>p.name));
 const roster=new Map(d.roster.map(p=>[p.name,p])), actual=new Map();
 const eventAnomalies=[], qualificationRows=[];
 const get=n=>{if(!actual.has(n))actual.set(n,{matches:0,wins:0,losses:0,draws:0,titles:0,majors:0});return actual.get(n)};
 for(const e of d.events){
  if(e.date>d.endedOn){eventsBeyondRollover++;eventAnomalies.push({kind:'event-after-rollover',detail:e.name+': official completion '+e.date+', review '+d.endedOn});}
  const names=[...new Set(e.bracket.flatMap(r=>r.matches.flatMap(m=>[m.top.name,m.bottom.name])))].filter(n=>n!=='TBD');
  const fillers=names.filter(n=>!roster.has(n) || /^Qualifier \d+$/.test(n)); fillerEntries+=fillers.length;
  if(fillers.length)eventAnomalies.push({kind:'non-persistent-entrants',detail:e.name+': '+fillers.length+' / '+names.length+' entrants, examples '+fillers.slice(0,3).join(', ')});
  if(e.winner && (!roster.has(e.winner) || /^Qualifier \d+$/.test(e.winner))){anonymousChampions++;if(e.type!=='Q School'&&e.type!=='Exhibition'&&!/qualif(?:ier|ication|ying)|play[ -]?off/i.test(e.name))anonymousTitles++;eventAnomalies.push({kind:'anonymous-champion',detail:e.name+': '+e.winner});}
  const ageLimit=/under[ -]?16|\bu16\b/i.test(e.name)?16:/under[ -]?18|\bu18\b/i.test(e.name)?18:/wsf junior/i.test(e.name)?19:/under[ -]?21|\bu21\b/i.test(e.name)?21:['Junior','Regional Youth','National Youth'].includes(e.type)?21:null;
  for(const name of names){const player=roster.get(name); if(!player || name===d.human.name)continue; const age=player.age-1;
   if((ageLimit && age>=ageLimit)||(e.type==='Senior' && age<40)){ageViolations++;eventAnomalies.push({kind:'field-age',detail:e.name+': '+name+', age '+age});}}
  const qualifiers=/^qSchool(Uk|Asia)|qTourPlayoff/.test(e.format??'')?(e.bracket.at(-1)?.matches??[]).filter(m=>typeof m.top.score==='number'&&typeof m.bottom.score==='number').map(m=>m.top.score>m.bottom.score?m.top.name:m.bottom.name):[];
  for(const name of qualifiers){const player=roster.get(name);qualificationRows.push({event:e.name,name,card:player?.card??false});if(player && !/^Qualifier \d+$/.test(name)){namedQualifications++;if(!player.card){missingCards++;eventAnomalies.push({kind:'qualifier-without-card',detail:e.name+': '+name});}}}

  eventCsv.push([d.season,e.name,e.type,e.format,e.date,e.ranking,e.entrants,e.scoredMatches,e.winner,e.final,qualifiers.join('; ')]);
  for(const r of e.bracket)for(const m of r.matches){for(const b of [...(m.topBreaks??[]),...(m.bottomBreaks??[])])if(!Number.isFinite(b)||b<0||b>155)eventAnomalies.push({kind:'invalid-recorded-break',detail:e.name+': '+b});if(m.placeholder||typeof m.top.score!=='number'||typeof m.bottom.score!=='number')continue;
   for(const [p,q] of [[m.top,m.bottom],[m.bottom,m.top]]){if(p.name==='TBD')continue;const x=get(p.name);x.matches++;if(p.score>q.score)x.wins++;else if(p.score<q.score)x.losses++;else x.draws++;}}
  if(e.winner && e.type!=='Q School' && e.type!=='Exhibition' && !/qualif(?:ier|ication|ying)|play[ -]?off/i.test(e.name)){get(e.winner).titles++;if(roster.has(e.winner) && !/^Qualifier \d+$/.test(e.winner))titleCounts.set(e.winner,(titleCounts.get(e.winner)||0)+1);actualTitleTotals.set(e.winner,(actualTitleTotals.get(e.winner)||0)+1);
   if(e.type==='Major'){get(e.winner).majors++;actualMajorTotals.set(e.winner,(actualMajorTotals.get(e.winner)||0)+1);}
   if(e.name==='World Championship')worldCounts.set(e.winner,(worldCounts.get(e.winner)||0)+1);}
 }
 if(d.human.record?.startedOn && (Date.parse(d.human.record.startedOn)-Date.parse(d.startedOn))/86400000>60)eventAnomalies.push({kind:'season-opening-snapshot-truncated',detail:'Season started '+d.startedOn+'; review opening snapshot '+d.human.record.startedOn+', ranking '+d.human.record.openingRanking});
 const humanBracket=actual.get(d.human.name);
 if(humanBracket && d.human.record && (humanBracket.matches!==d.human.record.matchesPlayed || humanBracket.wins!==d.human.record.wins || humanBracket.losses!==d.human.record.losses))eventAnomalies.push({kind:'human-record-vs-bracket',detail:JSON.stringify({record:d.human.record,bracket:humanBracket})});
 const anomalies=[...eventAnomalies], growth={prospects:[],prime:[],veterans:[]};
 for(const p of d.roster){
  const a=actual.get(p.name),r=p.seasonRecord,old=previousRoster?.get(p.name);
  if(p.name!==d.human.name&&a&&(!r||r.matches!==a.matches||r.wins!==a.wins||r.losses!==a.losses)){mismatchedRecords++;anomalies.push({kind:'cpu-record-arithmetic',detail:p.name+': stored '+r?.matches+' matches, '+r?.wins+' wins, '+r?.losses+' losses'+(a?'; actual bracket '+a.matches+' matches':'' )});}
  if(p.name!==d.human.name&&actualMajorTotals.get(p.name)>p.majors){majorCountMissing++;anomalies.push({kind:'major-title-counter',detail:p.name+': '+actualMajorTotals.get(p.name)+' observed major wins, stored '+p.majors});}
  if(p.name!==d.human.name&&a?.matches>0&&p.highestBreak===0)breakCountMissing++;
  if(old&&!old.retired&&!p.retired&&p.ratingChange!==null){const band=old.age<=25?'prospects':old.age>=40?'veterans':'prime';growth[band].push(p.ratingChange);}
  playerCsv.push([d.season,p.id,p.name,p.nation,p.age,p.retired,p.card,p.cardSource,p.rating,p.potential,p.ratingChange,p.skillOffsets?.longPotting,p.skillOffsets?.breakBuilding,p.skillOffsets?.safetyPlay,p.skillOffsets?.composure,p.skillOffsets?.stamina,r?.worldRank,r?.matches,r?.wins,r?.losses,a?.matches,a?.wins,a?.losses,a?.draws,p.titles,a?.titles,p.majors,a?.majors,p.prize,p.highestBreak]);
 }
 for(const x of [...d.issues,...anomalies])issueCsv.push([d.season,x.kind,x.detail]);
 invalidScores+=d.issues.filter(x=>['invalid-score','frame-format','unresolved-match'].includes(x.kind)).length;
 const active=d.roster.filter(p=>!p.retired), top=d.rankings.slice(0,10), topNames=new Set(top.map(p=>p.playerName));
 const champion=d.events.find(e=>e.name==='World Championship')?.winner;
 if(top[0])numberOnes.set(top[0].playerName,(numberOnes.get(top[0].playerName)||0)+1);
 const youthAges=Object.values(d.nextSeasonTables.youth?.top10??[]).map(r=>roster.get(r.playerName)?.age).filter(x=>x!==undefined);
 const row={season:d.season,startedOn:d.startedOn,endedOn:d.endedOn,expected:d.expectedEvents,events:d.events.length,matches:d.events.reduce((n,e)=>n+e.scoredMatches,0),
   active:active.length,retired:d.roster.length-active.length,roster:d.roster.length,newcomers:d.newcomers.length,namedNewcomers:d.newcomers.filter(p=>!/^Qualifier \d+$/.test(p.name)).length,retirements:d.retirements.length,
   cards:active.filter(p=>p.card).length,cardsGained:d.cardsGained.length,cardsLost:d.cardsLost.length,
   ageAverage:average(active.map(p=>p.age)),ageMin:Math.min(...active.map(p=>p.age)),ageMax:Math.max(...active.map(p=>p.age)),
   ratingAverage:average(active.map(p=>p.rating).filter(Number.isFinite)),rating95:active.filter(p=>p.rating>=95).length,
   originalActive:active.filter(p=>initialNames.has(p.name)).length,top10New:top.filter(p=>!initialNames.has(p.playerName)).length,
   top10Turnover:seasons.length?top.filter(p=>!seasons.at(-1).top.some(q=>q.playerName===p.playerName)).length:null,
   top10AverageAge:average(top.map(p=>roster.get(p.playerName)?.age-1).filter(Number.isFinite)),champion,championAge:roster.get(champion)?.age-1,championNew:champion?!initialNames.has(champion):null,
   top,majors:d.events.filter(e=>majorNames.includes(e.name)).map(e=>({name:e.name,winner:e.winner,final:e.final})),
   circuitSizes:Object.fromEntries(Object.entries(d.nextSeasonTables).map(([k,v])=>[k,v.size])),
   nextCircuitLeaders:Object.fromEntries(Object.entries(d.nextSeasonTables).map(([k,v])=>[k,v.top10[0]?.playerName??'—'])),
   growth:Object.fromEntries(Object.entries(growth).map(([k,v])=>[k,{count:v.length,average:average(v)}])),
   topGainers:active.filter(p=>p.ratingChange!==null).sort((a,b)=>b.ratingChange-a.ratingChange).slice(0,5).map(p=>({name:p.name,age:p.age,delta:p.ratingChange,rating:p.rating})),
   topDecliners:active.filter(p=>p.ratingChange!==null).sort((a,b)=>a.ratingChange-b.ratingChange).slice(0,5).map(p=>({name:p.name,age:p.age,delta:p.ratingChange,rating:p.rating})),
   retirementNames:d.retirements.map(p=>p.name+' (age '+p.age+')'),newcomerNames:d.newcomers.map(p=>p.name+' ('+p.age+', '+p.nation+')'),
   cardGainNames:d.cardsGained.map(p=>p.name+' — '+p.cardSource),cardLossNames:d.cardsLost.map(p=>p.name),
   human:d.human,qualifications:qualificationRows,issues:d.issues,derivedAnomalies:anomalies.length,duplicateYouthAges:youthAges.filter(a=>a>21),memoryMb:d.memoryMb};
 seasons.push(row);expected+=d.expectedEvents;completed+=d.events.length;matches+=row.matches;previousRoster=roster;
}
const final=seasons.at(-1), first=seasons[0];
const ranked=m=>[...m].sort((a,b)=>b[1]-a[1]);
const summary={seasons:seasons.length,weeklySettlements:managed?.weeksSimulated,managedEntries:managed?.tournamentsEntered,managedHarnessFlags:managed?.issues.length,firstDate:first.startedOn,lastDate:final.endedOn,firstNewTop10Season:seasons.find(s=>s.top10New>0)?.season,firstNewChampion:seasons.find(s=>s.championNew)?.champion,firstNewChampionSeason:seasons.find(s=>s.championNew)?.season,totalNewcomers:seasons.reduce((n,s)=>n+s.newcomers,0),namedNewcomers:seasons.reduce((n,s)=>n+s.namedNewcomers,0),totalRetirements:seasons.reduce((n,s)=>n+s.retirements,0),cardHoldersMin:Math.min(...seasons.map(s=>s.cards)),cardHoldersMax:Math.max(...seasons.map(s=>s.cards)),negativeClosingSeasons:seasons.filter(s=>s.human.closingCash<0).length,meanChampionAge:average(seasons.map(s=>s.championAge).filter(Number.isFinite)),meanCpuChampionAge:average(seasons.filter(s=>s.champion!==s.human.name).map(s=>s.championAge).filter(Number.isFinite)),humanWorldTitles:seasons.filter(s=>s.champion===s.human.name).length,youngestChampionAge:Math.min(...seasons.map(s=>s.championAge).filter(Number.isFinite)),oldestChampionAge:Math.max(...seasons.map(s=>s.championAge).filter(Number.isFinite)),expectedEvents:expected,completedEvents:completed,scoredMatches:matches,scoreRuleFlags:invalidScores,rawIssuesByKind,retiredNamedFlags,worldChampions:ranked(worldCounts),numberOnes:ranked(numberOnes),titles:ranked(titleCounts),anonymousChampions,anonymousTitles,fillerEntries,eventsBeyondRollover,ageViolations,namedQualifications,missingCards,cpuRecordArithmeticRows:mismatchedRecords,cpuMajorCounterRows:majorCountMissing,cpuZeroBreakRows:breakCountMissing,final};
writeCsv('seasons.csv',['Season','Events','Expected','Matches','World champion','Champion age','No. 1','Active players','Retirements','Newcomers','Card holders','Cards gained','Cards lost','Mean rating','95+ ratings','Mean age','Original active','Newcomers top ten'],seasons.map(s=>[s.season,s.events,s.expected,s.matches,s.champion,s.championAge,s.top[0]?.playerName,s.active,s.retirements,s.newcomers,s.cards,s.cardsGained,s.cardsLost,s.ratingAverage,s.rating95,s.ageAverage,s.originalActive,s.top10New]));
writeCsv('tournaments.csv',['Season','Tournament','Circuit','Format','Completion date','Ranking','Entrants','Scored matches','Winner','Final','Q School / playoff qualifiers'],eventCsv);
writeCsv('players.csv',['Season','ID','Name','Nation','Age at next opening','Retired','Tour card','Card source','Rating','Potential','Rating change','Long pot offset','Break offset','Safety offset','Composure offset','Stamina offset','Archived world rank','Stored season matches','Stored wins','Stored losses','Actual bracket matches','Actual wins','Actual losses','Actual draws','Stored career titles','Observed season titles','Stored career majors','Observed season majors','Career prize','Highest break'],playerCsv);
writeCsv('rankings.csv',['Season','Circuit','Snapshot timing','Rank','Name','Points','Events played','Wins','Losses','Titles'],rankingCsv);
writeCsv('findings.csv',['Season','Check','Evidence'],issueCsv);
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({summary,seasons},null,2));

const lifeDir=process.argv[4] ?? source.replace(/-world[\\/]?$/, '-life-audit');
const stories=new Map(),interviews=new Map(),teamEvents=new Map(),staffHistory=new Map(), lifeRows=[], lifeFlags=[];
for(const file of fs.readdirSync(lifeDir).filter(n=>/^\d{4}-\d{2}\.json$/.test(n)).sort()){
 const d=JSON.parse(fs.readFileSync(path.join(lifeDir,file),'utf8')),l=d.seasonLife??{};
 for(const x of [...(l.archivedStories??[]),...(l.stories??[])])stories.set(x.id,{...stories.get(x.id),...x});
 for(const x of l.interviews??[])interviews.set(x.id,x);
 for(const x of d.teamsThisSeason??[]){teamEvents.set(x.id,x);for(const t of x.ties)for(const r of t.results)for(const p of r.individuals??[]){if(!Number.isFinite(p.confidence)||p.confidence<0||p.confidence>100||!Number.isFinite(p.fatigue)||p.fatigue<0||p.fatigue>100)lifeFlags.push({season:d.season,kind:'team-individual-condition',detail:r.id+': '+p.name});if(p.highestBreak<0||p.highestBreak>155||p.visits<0||p.points<0||p.fouls<0)lifeFlags.push({season:d.season,kind:'team-individual-statistics',detail:r.id+': '+p.name});}}
 for(const [id,s]of Object.entries(l.staff??{}))for(const h of s.history??[])staffHistory.set(id+'|'+h.date+'|'+h.text,{id,...h});
 for(const f of d.flags??[])lifeFlags.push({season:d.season,...f});
 const teams=d.teamsThisSeason??[],rubbers=teams.flatMap(t=>t.ties.flatMap(t=>t.results));
 lifeRows.push({season:d.season,seconds:d.seconds,heapMb:d.heapMb,age:d.human.age,retired:d.human.retired,cash:d.human.cash,card:d.human.card.hasTourCard,teams:teams.length,accepted:teams.filter(t=>t.accepted).length,completed:teams.filter(t=>t.status==='completed').length,rubbers:rubbers.length,doubles:rubbers.filter(r=>r.kind==='doubles').length,formEvidence:l.evidence?.length??0,activeForm:l.form?.kind??null,stories:l.stories?.length??0,archivedStories:l.archivedStories?.length??0,partnerships:Object.keys(l.partnerships??{}).length,staff:Object.keys(l.staff??{}).length,ledgerRows:d.ledger.rows,ledgerDuplicates:d.ledger.duplicates});
}
for(const x of stories.values())if(x.kind==='staff'&&x.deadline&&x.resolved&&x.resolved<x.deadline&&x.steps?.some(y=>y.text.includes('contract ended.')))lifeFlags.push({season:seasons.find(y=>x.created>=y.startedOn&&x.created<y.endedOn)?.season??x.created?.slice(0,4)??'',kind:'staff-ended-before-notice-date',detail:JSON.stringify({id:x.id,title:x.title,created:x.created,promisedEnd:x.deadline,actualEnd:x.resolved,steps:x.steps})});
const lifeSummary={seasons:lifeRows.length,seconds:lifeRows.reduce((n,r)=>n+r.seconds,0),acceptedTeams:lifeRows.reduce((n,r)=>n+r.accepted,0),completedTeams:lifeRows.reduce((n,r)=>n+r.completed,0),rubbers:lifeRows.reduce((n,r)=>n+r.rubbers,0),doubles:lifeRows.reduce((n,r)=>n+r.doubles,0),uniqueStories:stories.size,uniqueInterviews:interviews.size,staffHistory:staffHistory.size,flags:lifeFlags,stories:[...stories.values()],interviews:[...interviews.values()],staffEvents:[...staffHistory.values()],rows:lifeRows};
fs.writeFileSync(path.join(out,'life-summary.json'),JSON.stringify(lifeSummary,null,2));
if(lifeRows.length)writeCsv('life-seasons.csv',Object.keys(lifeRows[0]),lifeRows.map(r=>Object.values(r)));
writeCsv('life-findings.csv',['Season','Check','Evidence'],lifeFlags.map(x=>[x.season,x.kind,x.detail]));
console.log(JSON.stringify({...summary,final:undefined,life:{...lifeSummary,stories:undefined,interviews:undefined,staffEvents:undefined,rows:undefined}},null,2));
