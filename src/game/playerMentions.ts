type PlayerIdentity = { id: string; playerName: string };
export function createPlayerMentionIndex(players: readonly PlayerIdentity[]) {
  const ids = new Map<string, string | null>();
  for (const player of players) ids.set(player.playerName, ids.has(player.playerName) && ids.get(player.playerName) !== player.id ? null : player.id);
  const names = [...ids.keys()].filter(name => name && ids.get(name)).sort((a, b) => b.length - a.length);
  const escaped = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = escaped.length ? new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped.join('|')})(?![\\p{L}\\p{N}_])`, 'gu') : null;
  return (text: string): Array<{ text: string; id?: string }> => {
    if (!pattern || !text) return [{ text }];
    const parts: Array<{ text: string; id?: string }> = [];
    let start = 0;
    for (const match of text.matchAll(pattern)) {
      const index = match.index!;
      if (index > start) parts.push({ text: text.slice(start, index) });
      parts.push({ text: match[0], id: ids.get(match[0])! });
      start = index + match[0].length;
    }
    if (start < text.length) parts.push({ text: text.slice(start) });
    return parts;
  };
}
const indexes = new WeakMap<readonly PlayerIdentity[], ReturnType<typeof createPlayerMentionIndex>>();
export function playerMentionIndex(players: readonly PlayerIdentity[]) {
  let index = indexes.get(players);
  if (!index) { index = createPlayerMentionIndex(players); indexes.set(players, index); }
  return index;
}
