import type { SurahMeta } from '@/types/quran'

export const AUDIO_BITRATE = 128

export const RECITER_BITRATE_OVERRIDES: Record<string, number> = {
  'ar.abdullahbasfar': 192,
  'ar.abdurrahmaansudais': 192,
  'ar.hanirifai': 192,
  'en.walk': 192,
  'ar.abdulsamad': 64,
  'ar.saoodshuraym': 64,
  'ar.aymanswoaid': 64,
  'ur.khan': 64,
  'ar.parhizgar': 48,
  'ar.ibrahimakhbar': 32,
}

export function bitrateForReciter(reciterId: string): number {
  return RECITER_BITRATE_OVERRIDES[reciterId] ?? AUDIO_BITRATE
}

export const BITRATE_FALLBACK_LADDER = [128, 64, 48, 32, 192]

export const CONTINUE_TO_NEXT_SURAH = true

const RECITERS_API_URL = 'https://api.alquran.cloud/v1/edition/format/audio'
const RECITER_STORAGE_KEY = 'raheq_audio_reciter'

export type AudioReciter = {
  id: string
  name: string
  englishName: string
}

type RawAudioEdition = {
  identifier: string
  name: string
  englishName: string
  format: string
  type: string
}

let recitersPromise: Promise<AudioReciter[]> | null = null

export function getAudioReciters(): Promise<AudioReciter[]> {
  if (!recitersPromise) {
    recitersPromise = (async () => {
      const res = await fetch(RECITERS_API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`Failed to fetch reciters — HTTP ${res.status}`)
      const json = (await res.json()) as { data?: RawAudioEdition[] }
      const editions = Array.isArray(json.data) ? json.data : []
      const reciters = editions
        .filter((e) => e.format === 'audio' && e.type === 'versebyverse' && e.identifier)
        .map((e) => ({ id: e.identifier, name: e.name, englishName: e.englishName }))
      if (!reciters.length) throw new Error('No audio reciters available')
      return reciters
    })()
    recitersPromise.catch(() => {
      recitersPromise = null 
    })
  }
  return recitersPromise
}

export function getStoredReciterId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(RECITER_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeReciterId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECITER_STORAGE_KEY, id)
  } catch {
  }
}

export function ayahCountsFromSurahList(
  surahs: Pick<SurahMeta, 'number' | 'numberOfAyahs'>[]
): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const s of surahs) counts[s.number] = s.numberOfAyahs
  return counts
}

export function globalAyahId(
  surah: number,
  ayah: number,
  counts: Record<number, number>
): number {
  let before = 0
  for (const key of Object.keys(counts)) {
    const num = Number(key)
    if (num < surah) before += counts[num]
  }
  return before + ayah
}

export function buildAyahAudioUrl(
  reciterId: string,
  globalId: number,
  bitrate: number = AUDIO_BITRATE
): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciterId}/${globalId}.mp3`
}

export function advancePosition(
  surah: number,
  ayah: number,
  counts: Record<number, number>,
  continuous: boolean = CONTINUE_TO_NEXT_SURAH
): { surah: number; ayah: number } | null {
  const count = counts[surah] ?? 0
  if (ayah < count) return { surah, ayah: ayah + 1 }
  if (!continuous) return null
  if (surah < 114 && (counts[surah + 1] ?? 0) > 0) return { surah: surah + 1, ayah: 1 }
  return null
}

export function retreatPosition(
  surah: number,
  ayah: number,
  counts: Record<number, number>
): { surah: number; ayah: number } | null {
  if (ayah > 1) return { surah, ayah: ayah - 1 }
  if (surah > 1 && (counts[surah - 1] ?? 0) > 0) {
    return { surah: surah - 1, ayah: counts[surah - 1] }
  }
  return null
}
