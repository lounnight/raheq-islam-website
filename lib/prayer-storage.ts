import {
  computePrayerTimes,
  formatMinutes,
  CalculationMethodKey
} from '@/services/prayer-times'

export type PrayerSettings = {
  latitude: number
  longitude: number
  utcOffset: number
  locationName: string
  method: CalculationMethodKey
  madhab: string
  hours12: boolean
}

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  latitude: 24.7136,
  longitude: 46.6753,
  utcOffset: 3,
  locationName: 'مكه ، المملكة العربية السعودية',
  method: 'umm_al_qura',
  madhab: 'shafi',
  hours12: true
}

const STORAGE_KEY = 'raheq_prayer_settings'

export function getStoredPrayerSettings(): PrayerSettings {
  if (typeof window === 'undefined') return DEFAULT_PRAYER_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PRAYER_SETTINGS
    return { ...DEFAULT_PRAYER_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PRAYER_SETTINGS
  }
}

export function savePrayerSettings(settings: Partial<PrayerSettings>) {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredPrayerSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save prayer settings', e)
  }
}

export const PRAYER_LIST = [
  { key: 'fajr', name: 'الفجر' },
  { key: 'sunrise', name: 'الشروق' },
  { key: 'dhuhr', name: 'الظهر' },
  { key: 'asr', name: 'العصر' },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha', name: 'العشاء' }
] as const

export function calculatePrayerData(settings: PrayerSettings, dateObj: Date = new Date()) {
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()

  const rawTimes = computePrayerTimes({
    year,
    month,
    day,
    latitude: settings.latitude,
    longitude: settings.longitude,
    utcOffset: settings.utcOffset,
    method: settings.method,
    madhab: settings.madhab
  })

  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes() + dateObj.getSeconds() / 60

  const listWithMins = PRAYER_LIST.map((p) => ({
    ...p,
    time: formatMinutes(rawTimes[p.key as keyof typeof rawTimes], settings.hours12) || '',
    rawMins: rawTimes[p.key as keyof typeof rawTimes]
  }))

  const validPrayersForNext = listWithMins.filter(
    (p): p is typeof p & { rawMins: number } => p.rawMins !== null
  )

  const nextIndex = validPrayersForNext.findIndex((p) => p.rawMins > currentMinutes)

  let nextKey = 'fajr'
  let remainingMins = 0
  let nextName = 'الفجر'
  let nextTimeStr = ''
  let currentPrayerMins = 0
  let totalPrayerWindow = 24 * 60

  if (nextIndex !== -1) {
    nextKey = validPrayersForNext[nextIndex].key
    nextName = validPrayersForNext[nextIndex].name
    nextTimeStr = validPrayersForNext[nextIndex].time
    remainingMins = validPrayersForNext[nextIndex].rawMins - currentMinutes

    const prevIndex = nextIndex === 0 ? validPrayersForNext.length - 1 : nextIndex - 1
    currentPrayerMins = validPrayersForNext[prevIndex].rawMins
    if (validPrayersForNext[nextIndex].rawMins > currentPrayerMins) {
      totalPrayerWindow = validPrayersForNext[nextIndex].rawMins - currentPrayerMins
    }
  } else {
    nextKey = 'fajr'
    nextName = 'الفجر'
    const tomorrowFajr = validPrayersForNext[0]?.rawMins ?? (4 * 60 + 30)
    nextTimeStr = validPrayersForNext[0]?.time ?? '04:30'
    remainingMins = 24 * 60 - currentMinutes + tomorrowFajr
    currentPrayerMins = validPrayersForNext[validPrayersForNext.length - 1]?.rawMins ?? (19 * 60)
    totalPrayerWindow = 24 * 60 - currentPrayerMins + tomorrowFajr
  }

  const hrs = Math.floor(remainingMins / 60)
  const mins = Math.floor(remainingMins % 60)
  const secs = Math.floor((remainingMins * 60) % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const countdownStr = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`

  const elapsedInWindow = totalPrayerWindow - remainingMins
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedInWindow / totalPrayerWindow) * 100)))

  return {
    prayers: listWithMins.map((p) => ({
      name: p.name,
      time: p.time,
      isNext: p.key === nextKey
    })),
    nextKey,
    nextName,
    nextTimeStr,
    countdownStr,
    progressPercent,
    locationName: settings.locationName
  }
}
