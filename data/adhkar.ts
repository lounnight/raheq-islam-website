import type { AdhkarData, Dhikr, DhikrCategory, Dua, DuasData } from '@/types/adhkar'

export const ADHKAR_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/athker_adaia/athkar.json'

export const QURAN_ADAIA_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/athker_adaia/quran_adaia.json'

export const SUNNAH_ADAIA_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/athker_adaia/sna_adaia.json'

function isDhikr(value: unknown): value is Dhikr {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'number' &&
    typeof item.text === 'string' &&
    typeof item.count === 'number' &&
    item.count > 0 &&
    (item.notes === undefined || typeof item.notes === 'string')
  )
}

function isDhikrCategory(value: unknown): value is DhikrCategory {
  if (!value || typeof value !== 'object') return false
  const category = value as Record<string, unknown>
  return (
    typeof category.id === 'number' &&
    typeof category.category === 'string' &&
    Array.isArray(category.array) &&
    category.array.every(isDhikr)
  )
}

export async function getAdhkar(): Promise<AdhkarData> {
  const response = await fetch(ADHKAR_URL, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Adhkar request failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!Array.isArray(payload) || !payload.every(isDhikrCategory)) {
    throw new Error('Adhkar response has an unexpected shape')
  }

  return payload
}

function isDua(value: unknown): value is Dua {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.text === 'string' &&
    item.text.trim().length > 0 &&
    typeof item.reference === 'string'
  )
}

async function getDuaSource(url: string): Promise<Dua[]> {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Duas request failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!Array.isArray(payload) || !payload.every(isDua)) {
    throw new Error('Duas response has an unexpected shape')
  }

  return payload
}

export async function getDuas(): Promise<DuasData> {
  const [quran, sunnah] = await Promise.all([
    getDuaSource(QURAN_ADAIA_URL),
    getDuaSource(SUNNAH_ADAIA_URL),
  ])

  return { quran, sunnah }
}
