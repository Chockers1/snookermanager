import { test, expect } from '@playwright/test';
import { createStarterState, enterTournamentState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { victoryFixture } from '../test-support/victoryFixture';
import { readCareerSave } from './read-career-save';

for (const [mode, width] of [['completed',1280],['completed',390],['hub',1280],['groups',1280]] as const) {
  test(`fullscreen ${mode} draw at ${width}`, async ({page}) => {
    let state;
    let event;
    if (mode === 'completed') ({state,event} = victoryFixture());
    else {
      state=createStarterState(); state.player.cash=100000;
      event=state.tournaments.find(t=>mode === 'groups' ? t.id==='pc-52' : t.name==='Saudi Arabia Masters')!;
      state=enterTournamentState(state,event.id);
    }
    await page.setViewportSize({width,height:720});
    await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('expanded-draw')){localStorage.setItem(key,value);sessionStorage.setItem('expanded-draw','1');}}, {key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
    await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
    await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
    await page.evaluate(route=>{history.pushState({},'',route);dispatchEvent(new PopStateEvent('popstate'));}, mode==='completed'?`/tournaments/draw?tournament=${event.id}`:'/tournaments/hub');
    const saved=await readCareerSave(page);
    const trigger=page.getByRole('button',{name:'Expand draw to fullscreen',exact:true});
    if (mode==='completed') await page.getByRole('button',{name:'Compact',exact:true}).click();
    await trigger.click();
    const dialog=page.getByRole('dialog',{name:`${event.name} · Fullscreen draw`,exact:true});
    await expect(dialog).toBeVisible();
    const bounds=await dialog.boundingBox();
    expect(bounds).toEqual({x:0,y:0,width,height:720});
    await expect(dialog.getByRole('button',{name:'Exit fullscreen draw'})).toBeInViewport();
    if (mode==='groups') {
      await expect(dialog.getByLabel('Group',{exact:true}).locator('option')).toHaveCount(32);
      await dialog.getByLabel('Group',{exact:true}).selectOption({index:1});
    } else {
      const bracket=dialog.getByTestId('tournament-bracket');
      await expect(bracket).toBeVisible();
      expect(await bracket.locator('[data-round-label]').count()).toBeGreaterThan(3);
      await bracket.locator('[data-round-label="Final"]').scrollIntoViewIfNeeded();
      await expect(bracket.locator('[data-round-label="Final"]')).toBeInViewport();
    }
    await page.screenshot({path:`artifacts/fullscreen-draw/${mode}-${width}.png`});
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    await trigger.click(); await page.getByRole('button',{name:'Exit fullscreen draw'}).click(); await expect(dialog).toHaveCount(0);
    const after=await readCareerSave(page); expect(after.player.cash).toBe(saved.player.cash); expect(after.tournamentProgress).toEqual(saved.tournamentProgress);
    await trigger.click();
    await dialog.locator('a[href*="/players/"]').first().click();
    await expect(page).toHaveURL(/players\//); await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  });
}
