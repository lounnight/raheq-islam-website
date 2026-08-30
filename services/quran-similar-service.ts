import type { SurahMeta } from '@/types/quran'

export const SIMILAR_RAW_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/quran/text/similar.json'

export type RawSimilarEntry = {
  src: { ayah: string | number[] }
  similar: { ayah: string | number[] }[]
}

export type RawSimilarDataset = Record<string, RawSimilarEntry[]> | RawSimilarEntry[]

export type SimilarRef = {
  surah: number
  startAyah: number
  endAyah: number
}

function refKey(ref: SimilarRef): string {
  return `${ref.surah}:${ref.startAyah}:${ref.endAyah}`
}

export function similarKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`
}

export function buildGlobalIdResolver(
  ayahCounts: Record<number, number>
): (globalId: number) => { surah: number; ayah: number } | null {
  const surahNumbers = Object.keys(ayahCounts)
    .map(Number)
    .sort((a, b) => a - b)
  const starts: { surah: number; start: number; end: number }[] = []
  let cumulative = 0
  for (const surah of surahNumbers) {
    const count = ayahCounts[surah]
    if (!Number.isFinite(count) || count <= 0) continue
    starts.push({ surah, start: cumulative + 1, end: cumulative + count })
    cumulative += count
  }
  return (globalId: number) => {
    if (!Number.isFinite(globalId) || globalId < 1) return null
    let lo = 0
    let hi = starts.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const s = starts[mid]
      if (globalId < s.start) hi = mid - 1
      else if (globalId > s.end) lo = mid + 1
      else return { surah: s.surah, ayah: globalId - s.start + 1 }
    }
    return null
  }
}

export function ayahCountsFromSurahs(surahs: Pick<SurahMeta, 'number' | 'numberOfAyahs'>[]): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const s of surahs) counts[s.number] = s.numberOfAyahs
  return counts
}

export function parseSimilarAyahValue(
  value: string | number[],
  resolveGlobalId: (globalId: number) => { surah: number; ayah: number } | null
): SimilarRef[] {
  if (typeof value === 'string') {
    const [s, a] = value.split(':')
    const surah = Number.parseInt(s ?? '', 10)
    const ayah = Number.parseInt(a ?? '', 10)
    if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return []
    return [{ surah, startAyah: ayah, endAyah: ayah }]
  }

  if (!Array.isArray(value)) return []

  const locations = value
    .map((id) => resolveGlobalId(id))
    .filter((loc): loc is { surah: number; ayah: number } => loc !== null)
    .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)

  const refs: SimilarRef[] = []
  for (const loc of locations) {
    const last = refs[refs.length - 1]
    if (last && last.surah === loc.surah && loc.ayah === last.endAyah + 1) {
      last.endAyah = loc.ayah // extend the current run
    } else {
      refs.push({ surah: loc.surah, startAyah: loc.ayah, endAyah: loc.ayah })
    }
  }
  return refs
}

export function buildSimilarIndex(
  raw: RawSimilarDataset,
  resolveGlobalId: (globalId: number) => { surah: number; ayah: number } | null
): Map<string, SimilarRef[]> {
  const index = new Map<string, SimilarRef[]>()

  const addRefs = (key: string, refs: SimilarRef[]) => {
    if (!refs.length) return
    const existing = index.get(key)
    if (!existing) {
      index.set(key, refs)
      return
    }
    for (const ref of refs) {
      if (!existing.some((r) => refKey(r) === refKey(ref))) existing.push(ref)
    }
  }

  const entries: RawSimilarEntry[] = Array.isArray(raw)
    ? raw
    : Object.values(raw).flat()

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue
    const srcRefs = parseSimilarAyahValue(entry.src?.ayah, resolveGlobalId)
    if (!srcRefs.length) continue

    const targetRefs: SimilarRef[] = []
    for (const similar of entry.similar ?? []) {
      for (const ref of parseSimilarAyahValue(similar?.ayah, resolveGlobalId)) {
        if (!targetRefs.some((r) => refKey(r) === refKey(ref))) targetRefs.push(ref)
      }
    }
    if (!targetRefs.length) continue

    for (const src of srcRefs) {
      for (let a = src.startAyah; a <= src.endAyah; a++) {
        addRefs(similarKey(src.surah, a), targetRefs)
      }
    }
    for (const target of targetRefs) {
      for (let a = target.startAyah; a <= target.endAyah; a++) {
        addRefs(similarKey(target.surah, a), srcRefs)
      }
    }
  }

  const sorter = (a: SimilarRef, b: SimilarRef) =>
    a.surah - b.surah || a.startAyah - b.startAyah
  for (const list of index.values()) list.sort(sorter)

  return index
}

let loadPromise: Promise<Map<string, SimilarRef[]>> | null = null

async function loadSimilarIndex(): Promise<Map<string, SimilarRef[]>> {
  const [raw, surahs] = await Promise.all([
    fetch(SIMILAR_RAW_URL, { headers: { Accept: 'application/json' } }).then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch similar.json — HTTP ${res.status}`)
      return res.json() as Promise<RawSimilarDataset>
    }),
    import('@/services/quran-service').then((m) => m.getSurahs()),
  ])
  const resolver = buildGlobalIdResolver(ayahCountsFromSurahs(surahs))
  return buildSimilarIndex(raw, resolver)
}

export function getSimilarIndex(): Promise<Map<string, SimilarRef[]>> {
  if (!loadPromise) {
    loadPromise = loadSimilarIndex().catch((err) => {
      loadPromise = null // allow a retry after a transient failure
      throw err
    })
  }
  return loadPromise
}

export async function getSimilarAyahs(surah: number, ayah: number): Promise<SimilarRef[]> {
  const index = await getSimilarIndex()
  return index.get(similarKey(surah, ayah)) ?? []
}

