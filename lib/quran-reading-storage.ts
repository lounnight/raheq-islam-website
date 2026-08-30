
const READING_PROGRESS_KEY = 'raheq_quran_reading_progress'


export type ReadingProgress = {

  surah: number

  page: number

  totalPages: number

  updatedAt: number
}


export type ReadingProgressMap = Record<number, ReadingProgress>

function readProgressMap(): ReadingProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(READING_PROGRESS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as ReadingProgressMap
  } catch {
    return {}
  }
}

function writeProgressMap(map: ReadingProgressMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(map))
  } catch (e) {
    console.error('Failed to persist Quran reading progress', e)
  }
}


export function getReadingProgress(surah: number): ReadingProgress | null {
  return readProgressMap()[surah] ?? null
}


export function getLastReadingProgress(): ReadingProgress | null {
  const map = readProgressMap()
  const entries = Object.values(map)
  if (entries.length === 0) return null
  return entries.reduce((latest, current) =>
    current.updatedAt > latest.updatedAt ? current : latest
  )
}


export function saveReadingProgress(progress: Omit<ReadingProgress, 'updatedAt'>) {
  const map = readProgressMap()
  map[progress.surah] = {
    ...progress,
    updatedAt: Date.now()
  }
  writeProgressMap(map)
}


export function clearReadingProgress(surah: number) {
  const map = readProgressMap()
  if (!Object.prototype.hasOwnProperty.call(map, surah)) return
  delete map[surah]
  writeProgressMap(map)
}


export function clearAllReadingProgress() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(READING_PROGRESS_KEY)
  } catch (e) {
    console.error('Failed to clear Quran reading progress', e)
  }
}
