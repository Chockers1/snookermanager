import { expect, test, type Page } from '@playwright/test';
import { createStarterState, type GameState } from '../src/hooks/useGameState';
import { initializeSeasonLife } from '../src/game/seasonLife';
import { member } from '../src/game/seasonLife/teams';
import { lifeOf, putLife } from '../src/game/seasonLife/shared';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import type { TeamEvent } from '../src/game/seasonLife/types';
import { readCareerSave } from './read-career-save';

function fixture() {
  let s=createStarterState();
  s.player.cash=50000;s.coachContracts=[];s.currentCoachId=null;
  s.careerDepth={...depthOf(s),seasonLife:undefined};s=initializeSeasonLife(s);s.seasonReview=null;
  if(s.firstWeekGuide)s.firstWeekGuide.dismissed=true;
  const pool=s.worldPlayers.filter(p=>p.playerName!==s.player.fullName).slice(0,7);
  pool.forEach(p=>{p.retired=false;p.injuryWeeks=0;});
  const players=[member(s,s.player.id),...pool.map(p=>member(s,p.id))];
  const e:TeamEvent={id:'layout-pairs',name:'Nations Pairs Invitational',kind:'nations',season:s.season,cutoff:s.currentDate,start:s.currentDate,end:plusDays(s.currentDate,1),deadline:s.currentDate,status:'accepted',accepted:s.currentDate,teams:Array.from({length:4},(_,i)=>({name:players[2*i].name+' & '+players[2*i+1].name,members:[players[2*i],players[2*i+1]]})),partnerOptions:[players[1]],ties:[{home:0,away:1,results:[]},{home:2,away:3,results:[]}],fee:0,travel:100,support:100,winnerShare:1000,runnerUpShare:400};
  const completed:TeamEvent={...e,id:'completed-pairs',name:'Completed Club Pairs',status:'completed',champion:e.teams[0].name,award:1000,settled:true,ties:[{home:0,away:1,winner:0,results:[{id:'doubles-example',kind:'doubles',home:players.slice(0,2).map(p=>p.id),away:players.slice(2,4).map(p=>p.id),score:[2,1],frames:[{frame:'F1',player:'72',opponent:'15',winner:players[0].name}],individuals:players.slice(0,4)}]}]};
  s=putLife(s,{...lifeOf(s),teams:[completed,e],archivedTeams:[{id:'archive-pairs',name:'Earlier National Pairs',season:'2025/26',won:true,award:1000,champion:'ENG',results:['ENG defeated BEL 2–1.']}]});
  s.trainingCondition.reportSnapshot={weeksTracked:0,date:s.currentDate,attributes:structuredClone(s.attributes),fatigue:s.player.fatigue,strain:0,burnout:0,lastReport:{cadence:'monthly',startDate:'2026-04-01',endDate:'2026-05-01',changes:(['technical','mental','physical'] as const).flatMap(group=>Object.entries(s.attributes[group]).map(([label,current],i)=>({group,label,current:current-.25,delta:i===0?-.123456:.234567}))),trainingLoad:54.6789,adaptation:92.34567,fatigueChange:1.23456,strainChange:-2.34567,burnoutChange:0}};
  return {s,e};
}
async function route(p:Page,url:string){await p.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));},url);}
async function open(p:Page,s:GameState,url:string){await p.addInitScript(({key,value})=>{if(!sessionStorage.getItem('support-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('support-fixture','yes');}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(s)});await p.goto('/');await p.getByRole('button',{name:/Continue Career/}).click();await expect(p.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();await route(p,url);}
async function checkLayout(p:Page,desktop:boolean){const root=p.locator('.support-workspace');expect(await root.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);expect(await root.innerText()).not.toMatch(/\d+\.\d{3,}/);if(desktop){expect(await p.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);expect(await root.locator('.support-panel,.pairs-tab-body,.coach-ratings-grid,.report-disciplines').evaluateAll(els=>els.filter(el=>el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2).map(el=>el.className))).toEqual([]);}}

for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[390,844]])test(`support pages and every tab fit at ${width}x${height}`,async({page})=>{
  const {s}=fixture();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await open(page,s,'/training/report');
  await expect(page.getByRole('heading',{name:'Monthly Training Report'})).toBeVisible();await expect(page.getByText('Recorded training load',{exact:true})).toBeVisible();await expect(page.getByText('Drill Performance',{exact:true})).toHaveCount(0);
  await page.screenshot({path:`artifacts/support-redesign/${width}-report.png`,fullPage:true});await checkLayout(page,width>=1280);
  await route(page,`/staff/coaches/${s.coaches[0].id}`);await expect(page.getByRole('heading',{name:s.coaches[0].name,exact:true})).toBeVisible();
  for(const tab of ['Specialism','Strengths & weaknesses']){await page.getByRole('tab',{name:tab,exact:true}).click();await page.screenshot({path:`artifacts/support-redesign/${width}-coach-${tab==='Specialism'?'skills':'profile'}.png`,fullPage:true});await checkLayout(page,width>=1280);}
  await route(page,'/career/teams');await expect(page.getByRole('heading',{name:'Club & national pairs'})).toBeVisible();
  for(const tab of ['Overview & entry','Teams','Results']){await page.getByRole('tab',{name:tab,exact:true}).click();await page.screenshot({path:`artifacts/support-redesign/${width}-pairs-${tab.split(' ')[0]}.png`,fullPage:true});await checkLayout(page,width>=1280);}
  await page.getByRole('button',{name:/Completed Club Pairs/}).click();await page.getByRole('tab',{name:'Results',exact:true}).click();await expect(page.getByRole('heading',{name:'Frame scores'})).toBeVisible();await page.screenshot({path:`artifacts/support-redesign/${width}-pairs-records.png`,fullPage:true});await checkLayout(page,width>=1280);
  await page.getByRole('button',{name:/Earlier National Pairs/}).click();await page.getByRole('tab',{name:'Results',exact:true}).click();await expect(page.getByText('ENG defeated BEL 2–1.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('coach hiring retains selected terms and links to contract management',async({page})=>{
  const {s}=fixture();const coach=s.coaches.find(c=>c.weeklyCost<100)!;await open(page,s,`/staff/coaches/${coach.id}`);
  await page.getByRole('button',{name:/16 Week Deal/}).click();await page.getByRole('button',{name:'Hire Coach',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Current contract'})).toBeVisible();
  const saved=await readCareerSave(page);expect(saved.coachContracts.find(c=>c.coachId===coach.id)?.contractWeeks).toBe(16);
  await page.getByRole('link',{name:'Manage contract',exact:true}).click();await expect(page.getByRole('tab',{name:'My team',exact:true})).toHaveAttribute('aria-selected','true');
});

test('invitation acceptance and withdrawal settle disclosed costs once',async({page})=>{
  let {s,e}=fixture();e={...e,status:'invited',accepted:undefined,fee:25};s=putLife(s,{...lifeOf(s),teams:[e]});await open(page,s,'/career/teams');
  await checkLayout(page,true);
  await page.getByRole('button',{name:'Accept · £25',exact:true}).click();await expect(page.getByRole('button',{name:'Withdraw',exact:true})).toBeVisible();
  const accepted=await readCareerSave(page);expect(accepted.player.cash).toBe(s.player.cash-25);expect(accepted.careerDepth?.seasonLife?.teams[0].status).toBe('accepted');
  await page.getByRole('button',{name:'Withdraw',exact:true}).click();await expect(page.getByText('Entry withdrawn.',{exact:false})).toBeVisible();expect((await readCareerSave(page)).player.cash).toBe(accepted.player.cash);
});

test('empty data and enlarged text remain readable and keyboard accessible',async({page})=>{
  const {s}=fixture();s.trainingCondition.reportSnapshot=undefined;s.careerDepth!.seasonLife!.teams=[];s.careerDepth!.seasonLife!.archivedTeams=[];
  await page.setViewportSize({width:1280,height:720});await open(page,s,'/training/report');await expect(page.getByRole('heading',{name:'Your development story starts here'})).toBeVisible();await checkLayout(page,true);
  await route(page,'/career/teams');await expect(page.getByText('Your next partnership starts with an invitation')).toBeVisible();await checkLayout(page,true);
  await route(page,`/staff/coaches/${s.coaches[0].id}`);await page.evaluate(()=>{localStorage.setItem('snooker-accessibility-v1',JSON.stringify({textScale:130}));dispatchEvent(new Event('snooker-accessibility'));});
  await expect(page.locator('html')).toHaveAttribute('data-text-scale','130');await page.getByRole('tab',{name:'Specialism',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Strengths & weaknesses',exact:true})).toHaveAttribute('aria-selected','true');await checkLayout(page,false);
});
test('club partner selection stays visible in the compact invitation',async({page})=>{
  let {s,e}=fixture();e={...e,id:'club-invitation',name:'Amateur Club Pairs',kind:'amateur',status:'invited',accepted:undefined};s.careerSystems.pro.hasTourCard=false;
  s=putLife(s,{...lifeOf(s),teams:[e]});await page.setViewportSize({width:1280,height:720});await open(page,s,'/career/teams');
  await expect(page.getByLabel('Choose club partner')).toBeVisible();await page.screenshot({path:'artifacts/support-redesign/1280-club-invitation.png',fullPage:true});await checkLayout(page,true);
});
