import { describe, expect, it } from 'vitest';
import { createPlayerMentionIndex, playerMentionIndex } from './playerMentions';

describe('player mentions in stored text', () => {
  const players = [{ id: 'a', playerName: 'RT' }, { id: 'b', playerName: 'Alex O’Neill' }, { id: 'c', playerName: 'Alex O’Neill Jr' }, { id: 'd', playerName: 'Li (Jun)' }];
  it('links exact names, preserves punctuation, and chooses the longest name', () => {
    const text = 'RT beat Alex O’Neill Jr; Alex O’Neill faces Li (Jun).';
    const parts = createPlayerMentionIndex(players)(text);
    expect(parts.map(p => p.text).join('')).toBe(text);
    expect(parts.filter(p => p.id).map(p => p.id)).toEqual(['a', 'c', 'b', 'd']);
  });
  it('does not link partial words or invent unknown identities', () => {
    expect(createPlayerMentionIndex(players)('RTÉ, START, RTP, Unknown Player, Qualifier 2.').some(p => p.id)).toBe(false);
  });
  it('does not guess when two players share a name', () => {
    const split = createPlayerMentionIndex([...players, { id: 'other', playerName: 'Alex O’Neill' }]);
    expect(split('Alex O’Neill and Alex O’Neill Jr').filter(p => p.id).map(p => p.id)).toEqual(['c']);
  });
  it('reuses the index across text renders and resets cleanly between strings', () => {
    expect(playerMentionIndex(players)).toBe(playerMentionIndex(players));
    const split = playerMentionIndex(players);
    expect(split('RT and RT').filter(p => p.id)).toHaveLength(2);
    expect(split('RT and RT').filter(p => p.id)).toHaveLength(2);
    expect(split('')).toEqual([{ text: '' }]);
    expect(createPlayerMentionIndex([])('No names')).toEqual([{ text: 'No names' }]);
  });
});
