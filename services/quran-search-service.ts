import { normalizeArabicText } from '@/lib/arabic-search'
import { getVerseTextMap } from '@/services/quran-source-service'
import { getSurahs } from '@/services/quran-service'

export interface IndexedAyah {
  surah: number
  verse: number
  text: string
  norm: string
}

export interface IndexedSurah {
  number: number
  name: string
  norm: string
}

export interface AyahSearchResult {
  surah: number
  verse: number
  surahName: string
  text: string
}

export interface SurahSearchResult {
  number: number
  name: string
}

export interface QuranSearchResults {
  surahs: SurahSearchResult[]
  ayahs: AyahSearchResult[]
}

export interface QuranSearchIndex {
  ayahs: IndexedAyah[]
  surahs: IndexedSurah[]
}

export function buildSearchIndex(
  verses: readonly { surah: number; verse: number; text: string }[],
  surahs: readonly { number: number; name: string }[],
): QuranSearchIndex {
  const ayahs: IndexedAyah[] = []
  const seen = new Set<string>()
  for (const v of verses) {
    if (!Number.isInteger(v.surah) || v.surah < 1 || v.surah > 114) continue
    if (!Number.isInteger(v.verse) || v.verse < 1) continue
    const text = v.text.trim()
    if (!text) continue
    const key = `${v.surah}:${v.verse}`
    if (seen.has(key)) continue
    seen.add(key)
    ayahs.push({ surah: v.surah, verse: v.verse, text, norm: normalizeArabicText(text) })
  }
  const surahIndex: IndexedSurah[] = []
  const seenSurahs = new Set<number>()
  for (const s of surahs) {
    if (!Number.isInteger(s.number) || s.number < 1 || s.number > 114) continue
    if (seenSurahs.has(s.number)) continue
    seenSurahs.add(s.number)
    const name = s.name.trim()
    if (!name) continue
    surahIndex.push({ number: s.number, name, norm: normalizeArabicText(name) })
  }
  return { ayahs, surahs: surahIndex }
}

type AyahMatch = { ayah: IndexedAyah; tier: 0 | 1; position: number }

function matchAyah(ayah: IndexedAyah, normQuery: string, words: string[]): AyahMatch | null {
  const phrase = ayah.norm.indexOf(normQuery)
  if (phrase !== -1) return { ayah, tier: 0, position: phrase }
  if (words.length > 1 && words.every((w) => ayah.norm.includes(w))) {
    const positions = words.map((w) => ayah.norm.indexOf(w)).filter((p) => p >= 0)
    return { ayah, tier: 1, position: positions.length ? Math.min(...positions) : 0 }
  }
  return null
}

export function searchIndex(
  index: QuranSearchIndex,
  rawQuery: string,
  maxAyahs = 30,
  maxSurahs = 8,
): QuranSearchResults {
  const normQuery = normalizeArabicText(rawQuery)
  if (!normQuery) return { surahs: [], ayahs: [] }
  const words = normQuery.split(' ').filter(Boolean)

  const surahs: SurahSearchResult[] = index.surahs
    .filter((s) => s.norm.includes(normQuery))
    .slice(0, maxSurahs)
    .map((s) => ({ number: s.number, name: s.name }))

  const matches: AyahMatch[] = []
  for (const ayah of index.ayahs) {
    const m = matchAyah(ayah, normQuery, words)
    if (m) matches.push(m)
  }
  matches.sort((a, b) => a.tier - b.tier || a.position - b.position)
  const nameByNumber = new Map(index.surahs.map((s) => [s.number, s.name]))
  const ayahs: AyahSearchResult[] = matches.slice(0, maxAyahs).map((m) => ({
    surah: m.ayah.surah,
    verse: m.ayah.verse,
    surahName: nameByNumber.get(m.ayah.surah) ?? `السورة ${m.ayah.surah}`,
    text: m.ayah.text,
  }))

  return { surahs, ayahs }
}

let indexPromise: Promise<QuranSearchIndex> | null = null

export function getQuranSearchIndex(): Promise<QuranSearchIndex> {
  if (indexPromise) return indexPromise
  indexPromise = (async () => {
    const [verseMap, surahs] = await Promise.all([getVerseTextMap(), getSurahs()])
    const verses = [...verseMap.entries()].map(([key, text]) => {
      const [s, v] = key.split(':')
      return { surah: parseInt(s, 10), verse: parseInt(v, 10), text }
    })
    return buildSearchIndex(verses, surahs.map((s) => ({ number: s.number, name: s.name })))
  })()
  indexPromise.catch(() => {
    indexPromise = null
  })
  return indexPromise
}

export async function searchQuran(rawQuery: string): Promise<QuranSearchResults> {
  const index = await getQuranSearchIndex()
  return searchIndex(index, rawQuery)
}
