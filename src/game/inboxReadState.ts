import type { GameState } from '../hooks/useGameState';

export const inboxReadStorageKey = (slotId: string | null) => 'snooker-career-manager-inbox-read-v1:' + (slotId ?? 'active');

export function updateInboxReadState(state: GameState, messageId?: string, read = true): GameState {
  let changed = false;
  const inbox = state.inbox.map(message => {
    if ((messageId !== undefined && message.id !== messageId) || message.read === read) return message;
    changed = true;
    return { ...message, read };
  });
  if (!changed) return state;
  const count = Math.min(99, inbox.filter(message => !message.read).length);
  return { ...state, inbox, player: { ...state.player, inboxCount: count, notificationCount: count },
    lastAction: messageId === undefined ? 'Marked all inbox messages as read.' : read ? 'Marked inbox message as read.' : 'Marked inbox message as unread.' };
}

function sameExcept(a: object, b: object, ignored: string[]) {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].every(key => ignored.includes(key) || Reflect.get(a, key) === Reflect.get(b, key));
}

/** Only read flags, badges and their status text can bypass the full career save. */
export function isInboxReadOnlyChange(previous: GameState, next: GameState) {
  return previous !== next && sameExcept(previous, next, ['inbox', 'player', 'lastAction'])
    && sameExcept(previous.player, next.player, ['inboxCount', 'notificationCount'])
    && previous.inbox.length === next.inbox.length
    && previous.inbox.every((message, i) => sameExcept(message, next.inbox[i], ['read']));
}

// Bind the small read-state overlay to one exact base payload. It must not be
// replayed over a restored/imported career or a later full save in the same slot.
let lastFingerprint: {payload:string; value:string} | undefined;
function fingerprint(payload: string) {
  if(lastFingerprint?.payload===payload) return lastFingerprint.value;
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619);
  const value=payload.length + ':' + (hash >>> 0);
  lastFingerprint={payload,value};
  return value;
}
export function encodeInboxReadOverlay(state: GameState, base: string) {
  return JSON.stringify({ version: 1, base: fingerprint(base), playerId: state.player.id,
    read: Object.fromEntries(state.inbox.map(message => [message.id, message.read])), lastAction: state.lastAction });
}
export function applyInboxReadOverlay(state: GameState, base: string, raw: string | null): GameState {
  if (!raw) return state;
  try {
    const overlay = JSON.parse(raw);
    if (overlay.version !== 1 || overlay.base !== fingerprint(base) || overlay.playerId !== state.player.id || !overlay.read || typeof overlay.read !== 'object') return state;
    const inbox = state.inbox.map(message => typeof overlay.read[message.id] === 'boolean' ? { ...message, read: overlay.read[message.id] } : message);
    const count = Math.min(99, inbox.filter(message => !message.read).length);
    return { ...state, inbox, player: { ...state.player, inboxCount: count, notificationCount: count },
      lastAction: typeof overlay.lastAction === 'string' ? overlay.lastAction : state.lastAction };
  } catch { return state; }
}
