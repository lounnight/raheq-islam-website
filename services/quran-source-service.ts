import { VERSE_TEXT_URL, getSources } from '@/lib/quran/sources'

export type SourceMap = Map<string, string>

export function ayahKey(surah: number, verse: number): string {
  return `${surah}:${verse}`
}

export interface RawSourceEntry {
  id?: number
  sura?: number
  aya?: number
  sura_number?: number
  verse_number?: number
  text?: string
  content?: string
}

export function stripHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function buildSourceMap(raw: unknown[]): SourceMap {
  const map: SourceMap = new Map()
  for (const entry of raw) {
    const norm = normalizeEntry(entry)
    if (!norm) continue
    map.set(ayahKey(norm.surah, norm.aya), stripHtml(norm.text))
  }
  return map
}

function normalizeEntry(
  value: unknown
): { surah: number; aya: number; text: string } | null {
  if (typeof value !== 'object' || value === null) return null
  const r = value as RawSourceEntry
  const surah = r.sura ?? r.sura_number
  const aya = r.aya ?? r.verse_number
  const text = typeof r.text === 'string' ? r.text : r.content
  if (
    typeof surah !== 'number' ||
    typeof aya !== 'number' ||
    typeof text !== 'string'
  ) {
    return null
  }
  return { surah, aya, text }
}

const sourceCache = new Map<string, SourceMap>()
const sourcePromiseCache = new Map<string, Promise<SourceMap>>()

export function getSourceMap(sourceId: string): Promise<SourceMap> {
  const source = getSources().find((s) => s.id === sourceId)
  if (!source) {
    throw new Error(`Unknown Quran source id: ${sourceId}`)
  }
  const cached = sourceCache.get(sourceId)
  if (cached) return Promise.resolve(cached)

  const inFlight = sourcePromiseCache.get(sourceId)
  if (inFlight) return inFlight

  const promise = fetch(source.url, {
    next: { revalidate: 86400 },
    headers: { Accept: 'application/json' },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch source "${sourceId}" (${source.url}) — HTTP ${res.status}`
        )
      }
      return res.json() as Promise<unknown>
    })
    .then((json) => {
      if (!Array.isArray(json)) {
        throw new Error(`Source "${sourceId}" payload is not an array`)
      }
      const map = buildSourceMap(json as RawSourceEntry[])
      sourceCache.set(sourceId, map)
      return map
    })
    .finally(() => {
      sourcePromiseCache.delete(sourceId)
    })

  sourcePromiseCache.set(sourceId, promise)
  return promise
}

export async function getAyahSource(
  sourceId: string,
  surah: number,
  verse: number
): Promise<string | undefined> {
  const map = await getSourceMap(sourceId)
  return map.get(ayahKey(surah, verse))
}

let verseTextPromise: Promise<SourceMap> | null = null

function isVerseTextEntry(
  v: unknown
): v is { surah_number: number; verse_number: number; content: string } {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { surah_number?: unknown }).surah_number === 'number' &&
    typeof (v as { verse_number?: unknown }).verse_number === 'number' &&
    typeof (v as { content?: unknown }).content === 'string'
  )
}

export function getVerseTextMap(): Promise<SourceMap> {
  if (verseTextPromise) return verseTextPromise
  verseTextPromise = fetch(VERSE_TEXT_URL, {
    next: { revalidate: 86400 },
    headers: { Accept: 'application/json' },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch verse text — HTTP ${res.status}`)
      return res.json() as Promise<unknown>
    })
    .then((json) => {
      if (!Array.isArray(json)) throw new Error('Verse text dataset is not an array')
      const map: SourceMap = new Map()
      for (const entry of json) {
        if (!isVerseTextEntry(entry)) continue
        map.set(
          ayahKey(entry.surah_number, entry.verse_number),
          stripHtml(entry.content)
        )
      }
      return map
    })
    .catch((err) => {
      verseTextPromise = null
      throw err
    })
  return verseTextPromise
}

export async function getVerseText(
  surah: number,
  verse: number
): Promise<string | undefined> {
  const map = await getVerseTextMap()
  return map.get(ayahKey(surah, verse))
}
