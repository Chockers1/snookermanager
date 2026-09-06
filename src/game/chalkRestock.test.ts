import { expect,it } from 'vitest';
import { createStarterState,restockChalkState,buyChalkState } from '../hooks/useGameState';
import { chalkCatalog } from '../data/catalogs';
function fixture(){const s=createStarterState();const chalk=chalkCatalog.find(c=>c.id===s.equipment.currentChalkId)!;s.player.cash=5000;s.equipment.chalkStock[chalk.id]=1;s.equipment.chalkCondition=37;s.equipment.chalkConditions={...s.equipment.chalkConditions,[chalk.id]:37};return {s,chalk};}
it('buys another five units while keeping worn equipped chalk and charging once per pack',()=>{
 const {s,chalk}=fixture();const next=restockChalkState(s,chalk.id);
 expect(next.equipment.chalkStock[chalk.id]).toBe(6);expect(next.equipment.chalkCondition).toBe(37);expect(next.player.cash).toBe(s.player.cash-chalk.cost);
 const again=restockChalkState(next,chalk.id);expect(again.equipment.chalkStock[chalk.id]).toBe(11);expect(again.player.cash).toBe(s.player.cash-chalk.cost*2);
 expect(again.equipment.chalkOwned.filter(id=>id===chalk.id)).toHaveLength(1);
 expect(buyChalkState(again,chalk.id).player.cash).toBe(again.player.cash);
});
it('restocks another owned brand without switching the current setup',()=>{
 const {s,chalk}=fixture();const other=chalkCatalog.find(c=>c.id!==chalk.id)!;s.equipment.chalkOwned.push(other.id);s.equipment.chalkStock[other.id]=2;s.equipment.chalkConditions={...s.equipment.chalkConditions,[other.id]:48};
 const next=restockChalkState(s,other.id);expect(next.equipment.chalkStock[other.id]).toBe(7);expect(next.equipment.chalkConditions?.[other.id]).toBe(48);expect(next.equipment.currentChalkId).toBe(chalk.id);expect(next.equipment.chalkCondition).toBe(37);
});
it('replaces an exhausted unit without treating it as usable stock',()=>{
 const {s,chalk}=fixture();s.equipment.chalkCondition=0;s.equipment.chalkConditions=undefined;
 const next=restockChalkState(s,chalk.id);expect(next.equipment.chalkStock[chalk.id]).toBe(5);expect(next.equipment.chalkCondition).toBe(100);
});
it('rejects unaffordable and unknown purchases without adding stock or charging money',()=>{
 const {s,chalk}=fixture();s.player.cash=chalk.cost-1;
 const next=restockChalkState(s,chalk.id);expect(next.player.cash).toBe(s.player.cash);expect(next.equipment.chalkStock).toEqual(s.equipment.chalkStock);expect(next.equipment.chalkCondition).toBe(37);
 expect(restockChalkState(s,'unknown')).toBe(s);
});
