import type { TafsirEntry } from '@/types/quran'

import {
  DEFAULT_SOURCE_ID,
  TAFSIR_SOURCES,
  getSource,
} from '@/lib/quran/sources'

import { stripHtml } from './quran-source-service'

export type RawTafsirEntry = {
  id?: number
  sura?: number
  sura_number?: number
  aya?: number
  verse_number?: number
  text?: string
  tafsir?: string
  content?: string
}

export function tafsirKey(surah: number, aya: number): string {
  return `${surah}:${aya}`
}

function normalizeTafsirText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = stripHtml(value).trim()
  return normalized.length > 0 ? normalized : null
}

function isRawTafsirEntry(value: unknown): value is RawTafsirEntry {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>
  const sura = record.sura ?? record.sura_number
  const aya = record.aya ?? record.verse_number
  const text =
    normalizeTafsirText(record.text) ??
    normalizeTafsirText(record.tafsir) ??
    normalizeTafsirText(record.content)

  return typeof sura === 'number' && typeof aya === 'number' && typeof text === 'string'
}

export function buildTafsirMap(raw: unknown[]): Map<string, TafsirEntry> {
  const map = new Map<string, TafsirEntry>()
  for (const entry of raw) {
    if (!isRawTafsirEntry(entry)) continue

    const sura = entry.sura ?? entry.sura_number
    const aya = entry.aya ?? entry.verse_number
    const text =
      normalizeTafsirText(entry.text) ??
      normalizeTafsirText(entry.tafsir) ??
      normalizeTafsirText(entry.content)

    if (typeof sura !== 'number' || typeof aya !== 'number' || !text) continue

    const tafsir: TafsirEntry = {
      key: tafsirKey(sura, aya),
      surah: sura,
      aya: aya,
      text,
    }
    map.set(tafsir.key, tafsir)
  }
  return map
}

const tafsirCache = new Map<string, Map<string, TafsirEntry>>()
const tafsirPromiseCache = new Map<string, Promise<Map<string, TafsirEntry>>>()

export function getTafsirSource(sourceId: string = DEFAULT_SOURCE_ID) {
  const source = getSource(sourceId) ?? TAFSIR_SOURCES.find((item) => item.id === sourceId)
  if (!source || source.type !== 'tafsir') {
    throw new Error(`Unknown Tafsir source id: ${sourceId}`)
  }
  return source
}

export function getTafsirMap(sourceId: string = DEFAULT_SOURCE_ID): Promise<Map<string, TafsirEntry>> {
  const source = getTafsirSource(sourceId)
  const cached = tafsirCache.get(source.id)
  if (cached) return Promise.resolve(cached)

  const inFlight = tafsirPromiseCache.get(source.id)
  if (inFlight) return inFlight

  const promise = fetch(source.url, {
    next: { revalidate: 86400 },
    headers: { Accept: 'application/json' },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch Tafsir source "${source.id}" (${source.url}) — HTTP ${res.status}`
        )
      }
      return res.json() as Promise<unknown>
    })
    .then((json) => {
      if (!Array.isArray(json)) {
        throw new Error(`Tafsir source "${source.id}" payload is not an array`)
      }
      const map = buildTafsirMap(json)
      tafsirCache.set(source.id, map)
      return map
    })
    .finally(() => {
      tafsirPromiseCache.delete(source.id)
    })

  tafsirPromiseCache.set(source.id, promise)
  return promise
}

export async function getTafsirEntry(
  surah: number,
  aya: number,
  sourceId: string = DEFAULT_SOURCE_ID
): Promise<TafsirEntry | undefined> {
  const map = await getTafsirMap(sourceId)
  return map.get(tafsirKey(surah, aya))
}