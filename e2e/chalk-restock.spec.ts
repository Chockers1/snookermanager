import {expect,test} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {chalkCatalog} from '../src/data/catalogs';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {readCareerSave} from './read-career-save';
for(const width of [1280,390])test('restock owned chalk from low-stock email at '+width,async({page})=>{
 const state=createStarterState();const chalk=chalkCatalog.find(c=>c.id===state.equipment.currentChalkId)!;state.player.cash=5000;state.equipment.chalkStock[chalk.id]=1;state.equipment.chalkCondition=37;state.equipment.chalkConditions={...state.equipment.chalkConditions,[chalk.id]:37};
 state.inbox=[{id:'chalk-warning-fixture',sender:'Equipment Manager',subject:'Chalk stock running low',preview:'Only one usable chalk unit remains.',priority:'High',date:state.currentDate,read:false,actionLabel:'Buy Chalk',actionRoute:'/equipment/chalk-tips'}];
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:800});
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('chalk-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('chalk-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 const navigate=async(path:string)=>page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},path);
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await navigate('/inbox');await page.getByLabel('Inbox messages').getByRole('button',{name:/Chalk stock running low/}).click();await page.getByRole('button',{name:'Buy Chalk',exact:true}).click();
 await expect(page.getByLabel('Selected chalk stock')).toHaveText('1 unit');await page.getByRole('button',{name:/Buy another pack/}).click();await expect(page.getByLabel('Selected chalk stock')).toHaveText('6 units');
 const saved=await readCareerSave(page);expect(saved.player.cash).toBe(5000-chalk.cost);expect(saved.equipment.chalkCondition).toBe(37);expect(saved.equipment.currentChalkId).toBe(chalk.id);
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await navigate('/equipment/chalk-tips');await expect(page.getByLabel('Selected chalk stock')).toHaveText('6 units');expect((await readCareerSave(page)).player.cash).toBe(saved.player.cash);expect(errors).toEqual([]);
});
