import { describe, expect, it } from 'vitest';
import { expandedCues, expandedChalks, expandedTips, expandedCases } from '../data/equipmentExpansion';
import { cueCatalog, cueMarketplaceCatalog, chalkCatalog, tipCatalog, caseCatalog } from '../data/catalogs';
import { createStarterState, buyCueState, buyChalkState, restockChalkState, buyTipState, repairGameState } from '../hooks/useGameState';
import { getEquipmentPerformanceProfile, applyEquipmentMatchWear } from './equipmentSystem';

describe('expanded equipment with existing career systems', () => {
  it('keeps globally unique saved IDs and exposes every addition in the shop catalogs', () => {
    const catalogs = [cueCatalog, chalkCatalog, tipCatalog, caseCatalog];
    const additions = [expandedCues, expandedChalks, expandedTips, expandedCases];
    const all = catalogs.flat();
    expect(new Set(all.map(item => item.id)).size).toBe(all.length);
    additions.forEach((items, index) => {
      expect(items).toHaveLength(15);
      for (const item of items) expect(catalogs[index].find(entry => entry.id === item.id)).toEqual(item);
      expect(new Set(items.map(item => item.tier)).size).toBe(4);
    });
    for (const cue of expandedCues) expect(cueMarketplaceCatalog.find(item => item.id === cue.id)?.style).toBe(cue.style);
  });

  it('buys and equips all new cues and consumables at the advertised cost without inflating permanent attributes', () => {
    const state = createStarterState(); state.player.cash = 100000;
    const before = structuredClone(state.attributes);
    for (const cue of expandedCues) {
      const bought = buyCueState(state, cue.id);
      expect(bought.equipment.currentCueId).toBe(cue.id);
      expect(bought.player.cash).toBe(state.player.cash - cue.price);
      expect(bought.equipment.cueStates[cue.id].familiarity).toBe(0);
      expect(buyCueState(bought, cue.id).player.cash).toBe(bought.player.cash);
      expect(bought.attributes).toEqual(before);
      expect(getEquipmentPerformanceProfile(bought.equipment).totalBonus).toBeLessThanOrEqual(9);
    }
    for (const chalk of expandedChalks) {
      const bought = buyChalkState(state, chalk.id);
      expect(bought.equipment.currentChalkId).toBe(chalk.id);
      expect(bought.equipment.chalkStock[chalk.id]).toBe(5);
      expect(bought.player.cash).toBe(state.player.cash - chalk.cost);
      const refilled = restockChalkState(bought, chalk.id);
      expect(refilled.equipment.chalkStock[chalk.id]).toBe(10);
      expect(refilled.player.cash).toBe(state.player.cash - 2 * chalk.cost);
    }
    for (const tip of expandedTips) {
      const bought = buyTipState(state, tip.id);
      expect(bought.equipment.currentTipId).toBe(tip.id);
      expect(bought.player.cash).toBe(state.player.cash - tip.cost);
      expect(bought.equipment.cueStates[bought.equipment.currentCueId!].tipCondition).toBe(100);
    }
  });

  it('preserves old equipment and newly bought items through save repair without awarding free stock', () => {
    const state = createStarterState(); state.player.cash = 100000;
    const before = structuredClone(state.equipment);
    const restored = repairGameState(JSON.parse(JSON.stringify(state)));
    expect(restored.equipment.currentCueId).toBe(before.currentCueId);
    expect(restored.equipment.cuesOwned).toEqual(before.cuesOwned);
    expect(restored.equipment.chalkStock).toEqual(before.chalkStock);
    const bought = buyTipState(buyChalkState(buyCueState(state, 'cue-27'), 'chalk-31'), 'tip-31');
    const loaded = repairGameState(JSON.parse(JSON.stringify(bought)));
    expect(loaded.player.cash).toBe(bought.player.cash);
    expect(loaded.equipment.currentCueId).toBe('cue-27');
    expect(loaded.equipment.currentChalkId).toBe('chalk-31');
    expect(loaded.equipment.currentTipId).toBe('tip-31');
    expect(getEquipmentPerformanceProfile(loaded.equipment)).toEqual(getEquipmentPerformanceProfile(bought.equipment));
  });

  it('gives specialist setups real bounded differences and applies new case protection', () => {
    const state = buyCueState(createStarterState(), 'cue-13');
    const withChalk = (id: string) => getEquipmentPerformanceProfile({ ...state.equipment, currentChalkId: id, chalkCondition: 100 });
    expect(withChalk('chalk-29').longPotBonus).toBeGreaterThan(withChalk('chalk-17').longPotBonus);
    expect(withChalk('chalk-30').miscueReduction).toBeGreaterThan(withChalk('chalk-19').miscueReduction);
    const soft = getEquipmentPerformanceProfile({ ...state.equipment, currentTipId: 'tip-30' });
    const hard = getEquipmentPerformanceProfile({ ...state.equipment, currentTipId: 'tip-26' });
    expect(soft.breakBuildingBonus).toBeGreaterThan(hard.breakBuildingBonus);
    const sleeve = applyEquipmentMatchWear({ ...state.equipment, currentCaseId: 'case-13' }, 25);
    const vault = applyEquipmentMatchWear({ ...state.equipment, currentCaseId: 'case-25' }, 25);
    expect(vault.cueStates['cue-13'].condition).toBeGreaterThan(sleeve.cueStates['cue-13'].condition);
    for (const entry of expandedCases) {
      const worn = applyEquipmentMatchWear({ ...state.equipment, currentCaseId: entry.id }, 25);
      expect(worn.cueStates['cue-13'].condition).toBeGreaterThanOrEqual(0);
      expect(worn.cueStates['cue-13'].condition).toBeLessThan(100);
    }
  });
});
