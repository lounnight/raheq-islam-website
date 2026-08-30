
const BOOKMARKS_KEY = 'raheq_ayah_bookmarks'
const NOTES_KEY = 'raheq_ayah_notes'


export type AyahBookmark = { savedAt: number }


export type AyahNote = { text: string; updatedAt: number }


export function ayahKey(surah: number, verse: number): string {
  return `${surah}:${verse}`
}


export function parseAyahKey(key: string): { surah: number; verse: number } | null {
  const [s, v] = key.split(':')
  const surah = Number.parseInt(s ?? '', 10)
  const verse = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(surah) || !Number.isFinite(verse)) return null
  return { surah, verse }
}

function readMap<T>(storageKey: string): Record<string, T> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Record<string, T>
  } catch {
    return {}
  }
}

function writeMap<T>(storageKey: string, map: Record<string, T>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(map))
  } catch (e) {
    console.error('Failed to persist ayah data', e)
  }
}



export function getAyahBookmarks(): Record<string, AyahBookmark> {
  return readMap<AyahBookmark>(BOOKMARKS_KEY)
}

export function isAyahBookmarked(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(getAyahBookmarks(), key)
}


export function toggleAyahBookmark(key: string): boolean {
  const bookmarks = getAyahBookmarks()
  if (Object.prototype.hasOwnProperty.call(bookmarks, key)) {
    delete bookmarks[key]
    writeMap(BOOKMARKS_KEY, bookmarks)
    return false
  }
  bookmarks[key] = { savedAt: Date.now() }
  writeMap(BOOKMARKS_KEY, bookmarks)
  return true
}



export function getAyahNotes(): Record<string, AyahNote> {
  return readMap<AyahNote>(NOTES_KEY)
}

export function getAyahNote(key: string): AyahNote | null {
  return getAyahNotes()[key] ?? null
}


export function saveAyahNote(key: string, text: string): void {
  const trimmed = text.trim()
  if (!trimmed) {
    deleteAyahNote(key)
    return
  }
  const notes = getAyahNotes()
  notes[key] = { text: trimmed, updatedAt: Date.now() }
  writeMap(NOTES_KEY, notes)
}

export function deleteAyahNote(key: string): void {
  const notes = getAyahNotes()
  if (!Object.prototype.hasOwnProperty.call(notes, key)) return
  delete notes[key]
  writeMap(NOTES_KEY, notes)
}
