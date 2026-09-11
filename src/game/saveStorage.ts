import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import { rememberSaveMetadata } from './saveMetadata';
import LZString from 'lz-string'

const COMPRESSED_SAVE_PREFIX = 'snooker-lz-v1:'
const GZIP_SAVE_PREFIX = 'snooker-gzip-v2:'

/** Text envelope keeps exports portable; old LZ and plain JSON saves remain readable. */
export function encodeCareerSaveJson(json: string): string {
  const bytes = gzipSync(strToU8(json), { level: 6, mtime: 0 });
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 16384) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 16384)));
  }
  return GZIP_SAVE_PREFIX + btoa(chunks.join(''));
}
export function encodeCareerSave(state: unknown): string {
  const payload = encodeCareerSaveJson(JSON.stringify(state));
  rememberSaveMetadata(payload, state);
  return payload;
}
export function decodeCareerSave(serialized: string): string {
  if (serialized.startsWith(GZIP_SAVE_PREFIX)) {
    const binary = atob(serialized.slice(GZIP_SAVE_PREFIX.length));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return strFromU8(gunzipSync(bytes));
  }
  if (!serialized.startsWith(COMPRESSED_SAVE_PREFIX)) return serialized;
  const json = LZString.decompressFromUTF16(serialized.slice(COMPRESSED_SAVE_PREFIX.length));
  if (!json) throw new Error('The compressed career save could not be read.');
  return json;
}

/** Native streaming inflation avoids doing decades of decompression on the UI thread.
 * One prepared payload is consumed by the loader; no second career is retained. */
let preparedJson: { payload: string; json: string } | undefined;
export async function decodeCareerSaveAsync(payload: string): Promise<string> {
  if (!payload.startsWith(GZIP_SAVE_PREFIX) || typeof DecompressionStream === 'undefined') return decodeCareerSave(payload);
  const binary = atob(payload.slice(GZIP_SAVE_PREFIX.length));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
export async function prepareActiveCareerDecode(): Promise<void> {
  preparedJson = undefined;
  const payload = readCareerStorage(ACTIVE_SAVE_KEY);
  if (!payload) return;
  try { preparedJson = { payload, json: await decodeCareerSaveAsync(payload) }; }
  catch { /* The normal loader presents corrupt-save recovery without deleting data. */ }
}
export function consumeCareerSaveJson(payload: string): string {
  const ready = preparedJson;
  preparedJson = undefined;
  return ready?.payload === payload ? ready.json : decodeCareerSave(payload);
}

export type SaveSlotSummary = {
  id: string
  name: string
  playerName: string
  season: string
  date: string
  updatedAt: string
}

export const ACTIVE_SAVE_KEY = 'snooker-career-manager-state-v1'
export const ACTIVE_SAVE_SLOT_KEY = 'snooker-career-manager-active-slot-v1'
export const SAVE_SLOT_PREFIX = 'snooker-career-manager-slot-'
export const SAVE_SLOT_INDEX_KEY = 'snooker-career-manager-slots-v1'

/** Old named slots may still contain large, uncompressed JSON. Repack only this
 * game's saves when a write runs out of space; never delete an existing career. */
export function writeCareerStorage(key: string, value: string) {
  const storage = window.localStorage
  try {
    storage.setItem(key, value)
    return
  } catch (error) {
    if (!(error instanceof Error) || error.name !== 'QuotaExceededError') {
      throw new Error('The browser could not save your career. Check that site storage is allowed, then try again.', { cause: error })
    }
  }
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((item): item is string => Boolean(item && (item === ACTIVE_SAVE_KEY || item.startsWith(SAVE_SLOT_PREFIX))))
  for (const existingKey of keys) {
    const existing = storage.getItem(existingKey)
    if (!existing || existing.startsWith(COMPRESSED_SAVE_PREFIX)) continue
    try {
      JSON.parse(existing) // Leave malformed/unrecognised saves untouched.
      const compact = COMPRESSED_SAVE_PREFIX + LZString.compressToUTF16(existing)
      if (compact.length < existing.length && decodeCareerSave(compact) === existing) storage.setItem(existingKey, compact)
    } catch { /* A failed optional repack must not erase the original. */ }
  }
  try {
    storage.setItem(key, value)
  } catch (error) {
    throw new Error('Browser save storage is full. Your player setup is still here. Export a backup and remove an unwanted save in Save Manager, then try again.', { cause: error })
  }
}

export function readSaveSlotIndex(): SaveSlotSummary[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(readCareerStorage(SAVE_SLOT_INDEX_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed as SaveSlotSummary[] : []
  } catch {
    return []
  }
}

/** Publish a new slot and its active pointer together. Failed writes must not
 * switch the active career or leave an extra half-created slot after retry. */
export function writeCareerStorageBatch(entries: Array<[string, string]>) {
  const previous = new Map(entries.map(([key]) => [key, window.localStorage.getItem(key)]))
  const written: string[] = []
  try {
    for (const [key, value] of entries) {
      writeCareerStorage(key, value)
      written.push(key)
    }
  } catch (error) {
    // Remove only keys introduced by this failed operation, never older saves.
    for (const key of written) if (previous.get(key) === null) window.localStorage.removeItem(key)
    for (const key of written.reverse()) {
      const value = previous.get(key)
      if (value != null) writeCareerStorage(key, value)
    }
    throw error
  }
}

export function writeSaveSlotIndex(slots: SaveSlotSummary[]) {
  writeCareerStorage(SAVE_SLOT_INDEX_KEY, JSON.stringify(slots))
}

export function readActiveSaveSlotId() {
  if (typeof window === 'undefined') return null
  return readCareerStorage(ACTIVE_SAVE_SLOT_KEY)
}

export function writeActiveSaveSlotId(id: string | null) {
  if (id) writeCareerStorage(ACTIVE_SAVE_SLOT_KEY, id)
  else window.localStorage.removeItem(ACTIVE_SAVE_SLOT_KEY)
}


// Full careers live in IndexedDB. Only the active payload and small slot metadata
// are cached at startup; inactive careers are read on demand.
export const CAREER_DATABASE = 'snooker-career-saves-v1';
const startupKeys = [ACTIVE_SAVE_KEY, ACTIVE_SAVE_SLOT_KEY, SAVE_SLOT_INDEX_KEY];
const careerCache = new Map<string, string | null>();
let databaseReady = false;
export function hasCareerDatabase() { return databaseReady; }
function openCareerDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CAREER_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('entries');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Career storage could not be opened. Your previous saves are preserved.'));
    request.onblocked = () => reject(new Error('Career storage is busy in another game window. Close that window and retry.'));
  });
}
export function readCareerStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return databaseReady && careerCache.has(key) ? careerCache.get(key)! : window.localStorage.getItem(key);
}
export async function readSavedCareer(key: string): Promise<string | null> {
  if (!databaseReady) return readCareerStorage(key);
  if (careerCache.has(key)) return careerCache.get(key)!;
  const db = await openCareerDatabase();
  try { return await new Promise((resolve,reject) => {
    const tx=db.transaction('entries','readonly'), request=tx.objectStore('entries').get(key);
    tx.oncomplete=()=>resolve(request.result ?? null);
    tx.onabort=tx.onerror=()=>reject(new Error('Could not read that career. The stored save is unchanged.'));
  }); } finally { db.close(); }
}
/** Commit payloads, slot index and active selection together; publish cache only on success. */
export async function commitCareerStorage(entries: Array<[string,string|null]>): Promise<void> {
  if (!databaseReady) {
    // Legacy fallback for browsers without IndexedDB; errors remain explicit.
    const previous=entries.map(([k])=>[k,window.localStorage.getItem(k)] as const);
    try { writeCareerStorageBatch(entries.filter((e):e is [string,string]=>e[1]!==null)); for(const [k,v]of entries)if(v===null)window.localStorage.removeItem(k); }
    catch(error){for(const [k,v]of previous)if(v===null)window.localStorage.removeItem(k);else window.localStorage.setItem(k,v);throw error;}
    return;
  }
  const db=await openCareerDatabase();
  try { await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('entries','readwrite'),store=tx.objectStore('entries');
    tx.oncomplete=()=>resolve();
    tx.onabort=tx.onerror=()=>reject(new Error('Your career could not be saved. The previous save is preserved. Export a portable backup and check browser storage.'));
    try {for(const [k,v]of entries)if(v===null)store.delete(k);else store.put(v,k);} catch {tx.abort();}
  }); } finally {db.close();}
  for(const [k,v]of entries)if(startupKeys.includes(k))careerCache.set(k,v);
}
/** Migrate once, without deleting a legacy payload before its transaction commits. */
export async function prepareCareerStorage(): Promise<void> {
  if (typeof indexedDB==='undefined') return;
  const db=await openCareerDatabase();
  const legacyKeys=Object.keys(window.localStorage).filter(k=>startupKeys.includes(k)||k.startsWith(SAVE_SLOT_PREFIX));
  const migrated:string[]=[];
  try { await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('entries','readwrite'),store=tx.objectStore('entries');
    tx.oncomplete=()=>resolve();
    tx.onabort=tx.onerror=()=>reject(new Error('Save migration could not finish. Original saves are preserved; free browser storage and retry.'));
    for(const key of legacyKeys){const request=store.get(key);request.onsuccess=()=>{
      // A committed database entry is authoritative after an interrupted cleanup.
      try {
        if(request.result===undefined){const value=window.localStorage.getItem(key);if(value!==null)store.put(value,key);}
        migrated.push(key);
      } catch { tx.abort(); }
    };}
  });
  const loaded=await new Promise<Array<[string,string|null]>>((resolve,reject)=>{
    const tx=db.transaction('entries','readonly'),store=tx.objectStore('entries');
    const requests=startupKeys.map(key=>({key,request:store.get(key)}));
    tx.oncomplete=()=>resolve(requests.map(({key,request})=>[key,request.result??null]));
    tx.onabort=tx.onerror=()=>reject(new Error('Saved careers could not be loaded. Retry without clearing site data.'));
  });
  careerCache.clear();for(const [k,v]of loaded)careerCache.set(k,v);databaseReady=true;
  for(const key of migrated)window.localStorage.removeItem(key);
  } finally {db.close();}
}
