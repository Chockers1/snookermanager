import { cachedSaveMetadata, rememberSaveMetadata } from './saveMetadata';
import type { GameState } from '../hooks/useGameState';
import { decodeCareerSave } from './saveStorage';

export type RecoveryReason = 'Automatic' | 'Before season rollover' | 'Before restore' | 'Before prize correction';
export type RecoverySave = {
  id: string; careerId: string; reason: RecoveryReason; savedAt: string;
  player: string; season: string; date: string; rank: number; matches: number;
  progress: string; fingerprint: string; checksum: number; payload: string;
};
export type RecoverySummary = Omit<RecoverySave, 'payload'>;
function summaryOf(record: RecoverySave): RecoverySummary {
  const summary = { ...record } as Partial<RecoverySave>;
  delete summary.payload;
  return summary as RecoverySummary;
}
export const recoveryLimits: Record<RecoveryReason, number> = { Automatic: 6, 'Before season rollover': 2, 'Before restore': 2, 'Before prize correction': 2 };
export function recoveryChecksum(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export function readRecoveryState(payload: string): GameState {
  const state = JSON.parse(decodeCareerSave(payload)) as GameState;
  if (!state?.player?.fullName || !state.currentDate || !state.season || !Array.isArray(state.tournaments) || !Array.isArray(state.matches) || !state.history || !Array.isArray(state.worldPlayers)) throw new Error('This backup is incomplete and cannot be restored.');
  rememberSaveMetadata(payload, state);
  return state;
}
export function readRecoveryMetadata(payload: string) {
  const cached = cachedSaveMetadata(payload);
  if (cached) return cached;
  readRecoveryState(payload);
  return cachedSaveMetadata(payload)!;
}
export function recoveryRecord(careerId: string, payload: string, reason: RecoveryReason, now = new Date().toISOString()): RecoverySave {
  const info = readRecoveryMetadata(payload);
  return { id: crypto.randomUUID(), careerId, reason, savedAt: now, player: info.player,
    season: info.displaySeason, date: info.date, rank: info.rank, matches: info.matches,
    progress: info.progress, fingerprint: info.fingerprint, checksum: recoveryChecksum(payload), payload };

}
export function expiredRecoveryIds(records: RecoverySummary[], added: RecoverySummary) {
  return [...records.filter(r => r.id !== added.id), added].filter(r => r.careerId === added.careerId && r.reason === added.reason)
    .sort((a,b) => b.savedAt.localeCompare(a.savedAt) || (a.id === added.id ? -1 : b.id === added.id ? 1 : b.id.localeCompare(a.id)))
    .slice(recoveryLimits[added.reason]).map(r => r.id);
}
function openRecoveryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Automatic backups are unavailable: browser database storage is disabled. Export a portable backup.')); return; }
    let blocked = false;
    const request = indexedDB.open('snooker-career-recovery-v1', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' });
      const summaries = db.createObjectStore('summaries', { keyPath: 'id' });
      // One-time upgrade: read one legacy payload at a time. Normal listings never load payloads.
      const cursor = request.transaction!.objectStore('snapshots').openCursor();
      cursor.onsuccess = () => {
        if (!cursor.result) return;
        summaries.put(summaryOf(cursor.result.value as RecoverySave));
        cursor.result.continue();
      };
    };
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return; }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(new Error('Recovery storage could not be opened. Check available browser storage.'));
    request.onblocked = () => { blocked = true; reject(new Error('Recovery storage is busy in another game window. Close that window and retry.')); };
  });
}
export async function listRecoverySaves(): Promise<RecoverySave[]> {
  const db = await openRecoveryDatabase();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readonly'); const request = tx.objectStore('snapshots').getAll();
    tx.oncomplete = () => resolve((request.result as RecoverySave[]).sort((a,b) => b.savedAt.localeCompare(a.savedAt)));
    tx.onerror = () => reject(new Error('Could not read recovery saves.'));
  }); } finally { db.close(); }
}
export async function listRecoverySummaries(): Promise<RecoverySummary[]> {
  const db = await openRecoveryDatabase();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('summaries', 'readonly');
    const request = tx.objectStore('summaries').getAll();
    tx.oncomplete = () => resolve((request.result as RecoverySummary[]).sort((a,b) => b.savedAt.localeCompare(a.savedAt)));
    tx.onabort = tx.onerror = () => reject(new Error('Could not read recovery summaries.'));
  }); } finally { db.close(); }
}
export async function getRecoverySave(id: string): Promise<RecoverySave | undefined> {
  const db = await openRecoveryDatabase();
  try { return await new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readonly');
    const request = tx.objectStore('snapshots').get(id);
    tx.oncomplete = () => resolve(request.result as RecoverySave | undefined);
    tx.onabort = tx.onerror = () => reject(new Error('Could not read this recovery save.'));
  }); } finally { db.close(); }
}
/** Insert and rotate in one transaction: a failed write never deletes the older backups. */
export async function storeRecoverySave(careerId: string, payload: string, reason: RecoveryReason) {
  const added = recoveryRecord(careerId, payload, reason);
  const db = await openRecoveryDatabase();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['snapshots', 'summaries'], 'readwrite'); const store = tx.objectStore('snapshots');
    const summaries = tx.objectStore('summaries');
    const request = summaries.getAll();
    request.onsuccess = () => {
      const records = request.result as RecoverySummary[];
      const latest = records.filter(r => r.careerId === careerId && r.reason === reason).sort((a,b) => b.savedAt.localeCompare(a.savedAt))[0];
      if (latest && (reason === 'Automatic' ? latest.fingerprint === added.fingerprint : latest.checksum === added.checksum)) return;
      try {
        store.put(added);
        summaries.put(summaryOf(added));
        for (const id of expiredRecoveryIds(records, added)) { store.delete(id); summaries.delete(id); }
      } catch { tx.abort(); }
    };
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(new Error('Backup could not be saved. Recovery storage may be full; export your career.'));
  }); } finally { db.close(); }
}
export function validatedRecoveryPayload(record: RecoverySave) {
  if (recoveryChecksum(record.payload) !== record.checksum) throw new Error('This backup failed its integrity check. Choose an earlier backup.');
  readRecoveryState(record.payload);
  return decodeCareerSave(record.payload);
}

// Serialize disk work so a slow old snapshot cannot overwrite a later autosave.
let saveQueue = Promise.resolve();
export function queueProtectedSave(job: () => Promise<void>) {
  const result = saveQueue.then(job);
  saveQueue = result.catch(() => undefined);
  return result;
}
