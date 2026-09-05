import LZString from 'lz-string'

const COMPRESSED_SAVE_PREFIX = 'snooker-lz-v1:'
export function encodeCareerSave(state: unknown): string {
  return COMPRESSED_SAVE_PREFIX + LZString.compressToUTF16(JSON.stringify(state))
}
export function decodeCareerSave(serialized: string): string {
  if (!serialized.startsWith(COMPRESSED_SAVE_PREFIX)) return serialized
  const json = LZString.decompressFromUTF16(serialized.slice(COMPRESSED_SAVE_PREFIX.length))
  if (!json) throw new Error('The compressed career save could not be read.')
  return json
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
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SAVE_SLOT_INDEX_KEY) ?? '[]')
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
  return window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)
}

export function writeActiveSaveSlotId(id: string | null) {
  if (id) writeCareerStorage(ACTIVE_SAVE_SLOT_KEY, id)
  else window.localStorage.removeItem(ACTIVE_SAVE_SLOT_KEY)
}
