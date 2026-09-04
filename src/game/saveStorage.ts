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

export function readSaveSlotIndex(): SaveSlotSummary[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SAVE_SLOT_INDEX_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed as SaveSlotSummary[] : []
  } catch {
    return []
  }
}

export function writeSaveSlotIndex(slots: SaveSlotSummary[]) {
  window.localStorage.setItem(SAVE_SLOT_INDEX_KEY, JSON.stringify(slots))
}

export function readActiveSaveSlotId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)
}

export function writeActiveSaveSlotId(id: string | null) {
  if (id) window.localStorage.setItem(ACTIVE_SAVE_SLOT_KEY, id)
  else window.localStorage.removeItem(ACTIVE_SAVE_SLOT_KEY)
}
