import type { JuzMeta, QuarterMeta } from '@/types/quran'



export type DivisionLocation = { surah: number; ayah: number }

export type DivisionVM = {

  id: number
  start: DivisionLocation

  end: DivisionLocation
}


export function juzStart(juz: JuzMeta): DivisionLocation {
  const surahKeys = Object.keys(juz.verses)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
  const first = surahKeys[0]
  const range = first !== undefined ? juz.verses[String(first)] : undefined
  if (first === undefined || !range) {
    return { surah: juz.surahs[0] ?? 1, ayah: 1 }
  }
  return { surah: first, ayah: range[0] }
}


export function juzEnd(juz: JuzMeta): DivisionLocation {
  const surahKeys = Object.keys(juz.verses)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)
  const last = surahKeys[0]
  const range = last !== undefined ? juz.verses[String(last)] : undefined
  if (last === undefined || !range) return juzStart(juz)
  return { surah: last, ayah: range[1] }
}


export function buildJuzDivisions(juzs: JuzMeta[]): DivisionVM[] {
  return [...juzs]
    .sort((a, b) => a.id - b.id)
    .map((juz) => ({ id: juz.id, start: juzStart(juz), end: juzEnd(juz) }))
}


const QUARTERS_PER_HIZB = 4

export function buildHizbDivisions(quarters: QuarterMeta[]): DivisionVM[] {
  const hizbCount = Math.floor(quarters.length / QUARTERS_PER_HIZB)
  const divisions: DivisionVM[] = []
  for (let n = 1; n <= hizbCount; n++) {
    const startMarker = quarters[(n - 1) * QUARTERS_PER_HIZB]
    if (!startMarker) continue
    divisions.push({
      id: n,
      start: { surah: startMarker.surah, ayah: startMarker.ayah },
      end: { surah: startMarker.surah, ayah: startMarker.ayah },
    })
  }
  return divisions
}
