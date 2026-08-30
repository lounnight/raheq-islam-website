import type {
  SurahMeta,
  JuzMeta,
  QuarterMeta,
  SajdahMeta,
  QuranVerseText,
  QuranPageData
} from '@/types/quran'
import { getSurahStartPage, getTotalPages } from '@/lib/quran-page-map'
import { pageFontFaceName, pageFontUrl } from '@/lib/quran/fonts'
import { getMushafPageLayout } from '@/services/quran/mushaf-layout'

const BASE_RAW_URL = 'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/quran'

let surahsCache: SurahMeta[] | null = null
let juzCache: JuzMeta[] | null = null
let quartersCache: QuarterMeta[] | null = null
let sajdahCache: SajdahMeta[] | null = null

async function fetchJson<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_RAW_URL}/${endpoint}`, {
    next: { revalidate: 86400 }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch Quran data from ${endpoint}`)
  }
  return res.json()
}

export async function getSurahs(): Promise<SurahMeta[]> {
  if (surahsCache) return surahsCache

  interface RawSurah {
    number: number
    name: string
    englishName: string
    englishNameTranslation: string
    numberOfAyahs: number
    revelationType: 'Meccan' | 'Medinan'
  }
  const surahs = await fetchJson<RawSurah[]>('metadata/surahs.json')

  const enriched: SurahMeta[] = surahs.map((s) => ({
    ...s,
    startPage: getSurahStartPage(s.number) ?? 1
  }))

  surahsCache = enriched
  return enriched
}

export async function getSurah(surahNumber: number): Promise<SurahMeta | undefined> {
  const surahs = await getSurahs()
  return surahs.find((s) => s.number === surahNumber)
}

export async function getJuzList(): Promise<JuzMeta[]> {
  if (juzCache) return juzCache
  juzCache = await fetchJson<JuzMeta[]>('metadata/juz.json')
  return juzCache
}

export async function getQuartersList(): Promise<QuarterMeta[]> {
  if (quartersCache) return quartersCache
  quartersCache = await fetchJson<QuarterMeta[]>('metadata/quarters.json')
  return quartersCache
}

export async function getSajdahVerses(): Promise<SajdahMeta[]> {
  if (sajdahCache) return sajdahCache
  sajdahCache = await fetchJson<SajdahMeta[]>('metadata/sajdah_verses.json')
  return sajdahCache
}

export { getTotalPages as getMushafTotalPages }

function globalAyahOffset(
  surahNumber: number,
  ayah: number,
  surahOffsets: number[]
): number {
  return (surahOffsets[surahNumber - 1] ?? 0) + ayah
}

function resolveHizb(
  surah: number,
  ayah: number,
  surahOffsets: number[],
  quarters: QuarterMeta[]
): { hizbNumber: number; hizbQuarter: number } {
  if (quarters.length === 0) return { hizbNumber: 1, hizbQuarter: 0 }
  const target = globalAyahOffset(surah, ayah, surahOffsets)
  let best = 0
  for (let i = 0; i < quarters.length; i++) {
    const q = quarters[i]
    const start = globalAyahOffset(q.surah, q.ayah, surahOffsets)
    if (start <= target) best = i
    else break 
  }
  return {
    hizbNumber: Math.floor(best / 4) + 1, 
    hizbQuarter: best % 4,
  }
}

export function getQuranPageFontInfo(pageNumber: number) {
  const clamped = Math.max(1, Math.min(getTotalPages(), pageNumber))
  const fontName = pageFontFaceName(clamped)
  const fontUrl = pageFontUrl(clamped)
  return { fontName, fontUrl, pageNumber: clamped }
}

export async function getQuranPageData(pageNumber: number): Promise<QuranPageData> {
  const layout = await getMushafPageLayout(pageNumber)
  const surahs = await getSurahs()
  const juzList = await getJuzList()
  const quarters = await getQuartersList()
  const sajdahVerses = await getSajdahVerses()

  const seen = new Set<string>()
  const verses: QuranVerseText[] = []
  const identity: { surah: number; verse: number }[] = []
  for (const line of layout.lines) {
    if (line.type !== 'text') continue
    for (const w of line.words) {
      const key = `${w.surah}:${w.verse}`
      if (!seen.has(key)) {
        seen.add(key)
        identity.push({ surah: w.surah, verse: w.verse })
      }
    }
  }
  for (const v of identity) {
    verses.push({ surah_number: v.surah, verse_number: v.verse, qcfData: '', content: '' })
  }

  const surahHeaderInfo = layout.lines
    .filter((l) => l.type === 'surah-header')
    .map((l) => {
      const s = surahs.find((meta) => meta.number === l.surah)
      return {
        surahNumber: l.surah,
        name: s?.name || `سورة ${l.surah}`,
        englishName: s?.englishName || '',
        revelationType: s?.revelationType || '',
        numberOfAyahs: s?.numberOfAyahs || 0,
        isStartOfSurah: true
      }
    })

  let juzNumber = 1
  if (verses.length > 0) {
    const firstVerse = verses[0]
    for (const j of juzList) {
      const range = j.verses[String(firstVerse.surah_number)]
      if (range && firstVerse.verse_number >= range[0] && firstVerse.verse_number <= range[1]) {
        juzNumber = j.id
        break
      }
    }
  }

  const orderedSurahs = [...surahs].sort((a, b) => a.number - b.number)
  const surahOffsets: number[] = []
  {
    let cum = 0
    for (const s of orderedSurahs) {
      surahOffsets[s.number - 1] = cum
      cum += s.numberOfAyahs
    }
  }

  let hizbNumber = 1
  let hizbQuarter = 0
  if (verses.length > 0) {
    const first = verses[0]
    const resolved = resolveHizb(first.surah_number, first.verse_number, surahOffsets, quarters)
    hizbNumber = resolved.hizbNumber
    hizbQuarter = resolved.hizbQuarter
  }

  const hasSajdah = verses.some((v) =>
    sajdahVerses.some((sv) => sv.surah === v.surah_number && sv.ayah === v.verse_number)
  )

  return {
    pageNumber,
    verses,
    surahHeaderInfo,
    juzNumber,
    hizbNumber,
    hizbQuarter,
    hasSajdah
  }
}
