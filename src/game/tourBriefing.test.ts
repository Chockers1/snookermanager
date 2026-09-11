import { describe, expect, it } from 'vitest';
import { createNewCareerState, type GameState, type NewCareerConfig } from '../hooks/useGameState';
import { announceTourBriefing, briefingTour } from './tourBriefing';

const fresh = (config: Partial<NewCareerConfig> = {}) => createNewCareerState({ fullName: 'Tour Tester', nationality: 'England', age: 15, handedness: 'Right-handed', cueStyle: '', playingStyle: '', personalityArchetype: '', sliders: [], backgroundId: '', startingLevelId: 'start-club-junior', ...config });
const briefings = (s: GameState) => s.inbox.filter(m => m.id.startsWith('tour-briefing:'));
describe('tour orientation messages', () => {
  it.each([
    ['start-club-junior', 15, 'youth'], ['start-national-youth', 18, 'youth'],
    ['start-elite-amateur', 23, 'amateur'], ['start-q-tour', 23, 'qTour'],
    ['start-q-school', 23, 'qSchool'], ['start-rookie-pro', 23, 'main'],
  ])('explains the actual %s starting path once', (startingLevelId, age, tour) => {
    const state = fresh({ fullName: 'Tour Tester', age: Number(age), startingLevelId: String(startingLevelId) });
    expect(briefingTour(state)).toBe(tour);
    expect(briefings(state)).toHaveLength(1);
    expect(state.tourBriefing).toMatchObject({ version: 1, tour, sequence: 1 });
    const message = briefings(state)[0];
    expect(message.summary!.length).toBeGreaterThanOrEqual(6);
    expect(message.actionRoute).toBe('/calendar');
    expect(message.preview).toContain('Tour Tester');
    expect(message.preview).toContain(state.currentDate);
    expect(message.summary?.some(row => row.label === 'What to work towards')).toBe(true);
    expect(announceTourBriefing(state)).toBe(state);
  });
  it('records promotions, card loss, returns and seniors without rewriting old briefings or touching money', () => {
    let state = fresh({ startingLevelId: 'start-elite-amateur', age: 24 });
    const cash = state.player.cash, original = briefings(state)[0];
    state = announceTourBriefing({ ...state, player: { ...state.player, rankingLabel: 'World Ranking' }, careerSystems: { ...state.careerSystems, pro: { ...state.careerSystems.pro, hasTourCard: true } } });
    expect(state.tourBriefing).toMatchObject({ tour: 'main', sequence: 2 });
    expect(briefings(state)[0].subject).toContain('Your pathway changed');
    expect(briefings(state)[0].summary!.find(row => row.label === 'What to work towards')!.value).toContain('retain your card');
    const sameTour = { ...state, season: '2027/28', player: { ...state.player, careerStage: 'World Champion', worldRanking: 1 } };
    expect(announceTourBriefing(sameTour)).toBe(sameTour);
    state = announceTourBriefing({ ...state, player: { ...state.player, rankingLabel: 'Amateur Ranking', careerStage: 'World Champion' }, careerSystems: { ...state.careerSystems, pro: { ...state.careerSystems.pro, hasTourCard: false } } });
    expect(state.tourBriefing).toMatchObject({ tour: 'amateur', sequence: 3 });
    state = announceTourBriefing({ ...state, careerSystems: { ...state.careerSystems, lateCareer: { ...state.careerSystems.lateCareer, seniorActive: true } } });
    expect(state.tourBriefing).toMatchObject({ tour: 'senior', sequence: 4 });
    state = announceTourBriefing({ ...state, careerSystems: { ...state.careerSystems, lateCareer: { ...state.careerSystems.lateCareer, retired: true } } });
    expect(state.tourBriefing).toMatchObject({ tour: 'retired', sequence: 5 });
    expect(briefings(state)[0].actionRoute).toBe('/career/stats');
    expect(briefings(state).at(-1)).toEqual(original);
    expect(state.player.cash).toBe(cash);
  });
  it('gives old saves current advice without inventing past transitions, and remains deduplicated after reload or inbox pruning', () => {
    const old = fresh();delete old.tourBriefing;
    old.inbox = old.inbox.filter(m => !m.id.startsWith('tour-briefing:'));
    const result = announceTourBriefing(old);
    expect(briefings(result)[0].subject).toContain('Your tour explained');
    expect(briefings(result)[0].preview).not.toContain('has changed');
    const restored = JSON.parse(JSON.stringify(result)) as GameState;
    expect(announceTourBriefing(restored)).toBe(restored);
    restored.inbox = [];
    expect(announceTourBriefing(restored)).toBe(restored);
    expect(restored.player.cash).toBe(old.player.cash);
    expect(result.player.inboxCount).toBe(result.inbox.filter(m => !m.read).length);
  });
  it('only names relevant future calendar examples and never presents them as confirmed entry', () => {
    const s = fresh({ startingLevelId: 'start-club-junior', age: 15 });delete s.tourBriefing;
    s.tournaments = [
      { ...s.tournaments[0], name: 'Future Youth Event', type: 'Regional Youth', startDate: '2099-01-01' },
      { ...s.tournaments[0], name: 'Old Youth Event', type: 'Junior', startDate: '2000-01-01' },
      { ...s.tournaments[0], name: 'Professional Event', type: 'Ranking', startDate: '2099-01-01' },
    ];
    const row = briefings(announceTourBriefing(s))[0].summary!.find(row => row.label === 'Examples in your calendar')!;
    expect(row.detail).toContain('Future Youth Event');expect(row.detail).not.toContain('Old Youth Event');expect(row.detail).not.toContain('Professional Event');
    expect(row.detail).toContain('not confirmed eligibility');
    s.tournaments = [];
    expect(briefings(announceTourBriefing(s))[0].summary!.find(row => row.label === 'Examples in your calendar')!.detail).toContain('No upcoming events');
  });
});
