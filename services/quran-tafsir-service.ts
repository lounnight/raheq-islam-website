import type { TafsirEntry } from '@/types/quran'

const TAFSIR_RAW_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/quran/tafsser/ar_muyassar.json'

export type RawTafsirEntry = {
  id: number
  sura: number
  aya: number
  text: string
}

export function tafsirKey(surah: number, aya: number): string {
  return `${surah}:${aya}`
}

function isRawTafsirEntry(value: unknown): value is RawTafsirEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RawTafsirEntry).sura === 'number' &&
    typeof (value as RawTafsirEntry).aya === 'number' &&
    typeof (value as RawTafsirEntry).text === 'string'
  )
}

export function buildTafsirMap(raw: unknown[]): Map<string, TafsirEntry> {
  const map = new Map<string, TafsirEntry>()
  for (const entry of raw) {
    if (!isRawTafsirEntry(entry)) continue
    const tafsir: TafsirEntry = {
      key: tafsirKey(entry.sura, entry.aya),
      surah: entry.sura,
      aya: entry.aya,
      text: entry.text,
    }
    map.set(tafsir.key, tafsir)
  }
  return map
}

let loadPromise: Promise<Map<string, TafsirEntry>> | null = null

export function getTafsirMap(): Promise<Map<string, TafsirEntry>> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const res = await fetch(TAFSIR_RAW_URL, {
        next: { revalidate: 86400 },
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        throw new Error(
          `Failed to fetch Arabic Tafsir (ar_muyassar.json) — HTTP ${res.status}`
        )
      }
      const json = (await res.json()) as unknown
      if (!Array.isArray(json)) {
        throw new Error('Arabic Tafsir dataset is not an array')
      }
      return buildTafsirMap(json)
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}