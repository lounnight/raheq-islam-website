import type {
  Hadith,
  HadithBook,
  HadithChapter,
  HadithList,
  HadithSearchResult,
} from '@/types/hadith'

export const FAWAZ_API_BASE_URL =
  process.env.FAWAZ_API_BASE_URL ||
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1'

const DEFAULT_TIMEOUT_MS = 15_000

export const AVAILABLE_BOOKS = [
  'bukhari',
  'muslim',
  'abudawud',
  'tirmidhi',
  'nasai',
  'ibnmajah',
  'malik',
] as const

const BOOK_ARABIC_NAME: Record<string, string> = {
  bukhari: 'صحيح البخاري',
  muslim: 'صحيح مسلم',
  abudawud: 'سنن أبي داود',
  tirmidhi: 'جامع الترمذي',
  nasai: 'سنن النسائي',
  ibnmajah: 'سنن ابن ماجه',
  malik: 'موطأ مالك',
}

interface RawHadith {
  hadithnumber?: number
  arabicnumber?: number
  text?: string
  grades?: string[]
  reference?: { book?: number; hadith?: number }
}

interface RawSectionDetail {
  hadithnumber_first?: number
  hadithnumber_last?: number
}

interface RawBookMeta {
  name?: string
  sections?: Record<string, string>
  last_hadithnumber?: number
  section_details?: Record<string, RawSectionDetail>
}

interface RawInfo {
  [bookId: string]: { metadata?: RawBookMeta }
}

interface RawEdition {
  metadata?: {
    name?: string
    section?: Record<string, string>
  }
  hadiths?: Record<string, RawHadith> | RawHadith[]
}

async function fetchJsonOnce<T>(path: string): Promise<T> {
  const url = `${FAWAZ_API_BASE_URL}/${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86_400 },
    })
    if (!res.ok) {
      throw new Error(`Fawaz Hadith API request failed (HTTP ${res.status})`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson<T>(minPath: string): Promise<T> {
  try {
    return await fetchJsonOnce<T>(minPath)
  } catch (err) {
    if (minPath.endsWith('.min.json')) {
      const fallbackPath = minPath.slice(0, -'.min.json'.length) + '.json'
      return await fetchJsonOnce<T>(fallbackPath)
    }
    throw err
  }
}

let infoCache: RawInfo | null = null
let infoPromise: Promise<RawInfo> | null = null

function getInfo(): Promise<RawInfo> {
  if (infoCache) return Promise.resolve(infoCache)
  if (infoPromise) return infoPromise
  infoPromise = fetchJson<RawInfo>('info.min.json')
    .then((d) => {
      infoCache = d
      return d
    })
    .finally(() => {
      infoPromise = null
    })
  return infoPromise
}

import { normalizeArabicText } from '@/lib/arabic-search'
export { normalizeArabicText }

function isArabicScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)
}

function normalizeGrades(raw: readonly unknown[] | undefined): {
  grades?: string[]
  grading?: string
} {
  if (!Array.isArray(raw) || raw.length === 0) {
    const empty = {}
    return empty
  }
  const labels = raw
    .map((g) => {
      if (Array.isArray(g)) {
        return g
          .filter((p): p is string => typeof p === 'string')
          .map((p) => p.trim())
          .filter(Boolean)
          .join(' - ')
      }
      return typeof g === 'string' ? g.trim() : ''
    })
    .filter(Boolean)
  if (labels.length === 0) {
    const empty = {}
    return empty
  }
  const short = labels.find((l) => /^(صحيح|حسن|ضعيف|sahih|hasan|da'if|daif|ضعيف)/i.test(l))
  return { grades: labels, grading: short ?? labels[0] }
}

export function normalizeHadith(
  raw: RawHadith | undefined,
  bookId: string,
  bookName?: string,
  chapter?: HadithChapter,
): Hadith | null {
  if (!raw || typeof raw !== 'object') return null
  const hadithNumber = raw.hadithnumber ?? raw.arabicnumber
  if (typeof hadithNumber !== 'number' || hadithNumber <= 0) return null
  if (!Number.isFinite(hadithNumber)) return null

  const arabic = raw.text?.trim() ?? ''
  if (!arabic) return null

  const references =
    raw.reference && (raw.reference.book ?? raw.reference.hadith)
      ? [`book ${raw.reference.book ?? ''} hadith ${raw.reference.hadith ?? ''}`]
      : undefined
  const { grades, grading } = normalizeGrades(raw.grades)

  return {
    id: `${bookId}:${hadithNumber}`,
    bookId,
    bookName,
    hadithNumber,
    arabic,
    grades,
    grading,
    chapterId: chapter?.id,
    chapterTitle: chapter?.titleAr,
    references,
  }
}

function toHadithArray(
  rawHadiths: RawEdition['hadiths'] | undefined,
): RawHadith[] {
  if (!rawHadiths) return []
  if (Array.isArray(rawHadiths)) return rawHadiths
  return Object.values(rawHadiths)
}

export async function fetchBooks(): Promise<HadithBook[]> {
  try {
    const info = await getInfo()
    return AVAILABLE_BOOKS.map((id) => {
      const meta = info[id]?.metadata
      return {
        id,
        nameAr: BOOK_ARABIC_NAME[id] ?? id,
        nameEn: meta?.name?.trim() || id,
        totalHadiths: meta?.last_hadithnumber ?? 0,
        hasArabic: true,
      }
    }).filter((b) => b.totalHadiths > 0 || true)
  } catch {

    return AVAILABLE_BOOKS.map((id) => ({
      id: id as string,
      nameAr: BOOK_ARABIC_NAME[id],
      nameEn: id,
      totalHadiths: 0,
      hasArabic: true,
    }))
  }
}

export async function fetchBook(bookId: string): Promise<HadithBook | null> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) {
    throw new Error(`Book not available in the API: ${bookId}`)
  }
  const info = await getInfo()
  const meta = info[bookId]?.metadata
  if (!meta) throw new Error(`Book metadata not found: ${bookId}`)
  return {
    id: bookId,
    nameAr: BOOK_ARABIC_NAME[bookId] ?? bookId,
    nameEn: meta.name?.trim() || bookId,
    totalHadiths: meta.last_hadithnumber ?? 0,
    hasArabic: true,
  }
}

export async function fetchChapters(bookId: string): Promise<HadithChapter[]> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) return []
  const info = await getInfo()
  const sections = info[bookId]?.metadata?.sections ?? {}
  const details = info[bookId]?.metadata?.section_details ?? {}
  return Object.entries(sections)
    .filter(([num, title]) => num !== '0' && title.trim())
    .map(([num, title]) => ({
      id: num,
      titleAr: isArabicScript(title) ? title.trim() : undefined,
      hadithsCount: (() => {
        const d = details[num]
        if (!d) return undefined
        const first = d.hadithnumber_first ?? 0
        const last = d.hadithnumber_last ?? first
        return last >= first ? last - first + 1 : undefined
      })(),
    }))
}

const hadithCache = new Map<string, Hadith>()
const hadithPromises = new Map<string, Promise<Hadith | null>>()

export function fetchHadith(
  bookId: string,
  hadithNumber: number,
  bookName?: string,
): Promise<Hadith | null> {
  const key = `${bookId}:${hadithNumber}`
  const cached = hadithCache.get(key)
  if (cached) return Promise.resolve(cached)
  const inflight = hadithPromises.get(key)
  if (inflight) return inflight

  const promise = (async () => {
    const [ar, en] = await Promise.allSettled([
      fetchJson<RawEdition>(`editions/ara-${bookId}/${hadithNumber}.min.json`),
      fetchJson<RawEdition>(`editions/eng-${bookId}/${hadithNumber}.min.json`),
    ])
    const arData = ar.status === 'fulfilled' ? ar.value : undefined
    const enData = en.status === 'fulfilled' ? en.value : undefined
    if (!arData) return null

    const raw = toHadithArray(arData.hadiths)[0]
    const hadith = normalizeHadith(raw, bookId, bookName)
    if (!hadith) return null

    const sectionMap = arData.metadata?.section ?? {}
    const secNum = Object.keys(sectionMap)[0] ?? ''
    const secTitle = secNum ? (sectionMap[secNum]?.trim() || undefined) : undefined
    if (secNum) {
      hadith.chapterId = secNum
      if (secTitle && isArabicScript(secTitle)) hadith.chapterTitle = secTitle
    }
    const enRaw = toHadithArray(enData?.hadiths)[0]
    if (enRaw?.text?.trim()) hadith.english = enRaw.text.trim()

    hadithCache.set(key, hadith)
    return hadith
  })()
  hadithPromises.set(key, promise)
  promise.finally(() => hadithPromises.delete(key)).catch(() => undefined)
  return promise
}

const editionCache = new Map<string, RawEdition>()
const editionPromises = new Map<string, Promise<RawEdition>>()

function getArabicEdition(bookId: string): Promise<RawEdition> {
  const cached = editionCache.get(bookId)
  if (cached) return Promise.resolve(cached)
  const inflight = editionPromises.get(bookId)
  if (inflight) return inflight
  const promise = fetchJson<RawEdition>(`editions/ara-${bookId}.min.json`)
    .then((d) => {
      editionCache.set(bookId, d)
      return d
    })
    .finally(() => editionPromises.delete(bookId))
  editionPromises.set(bookId, promise)
  return promise
}

function slice<T>(list: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit
  return list.slice(start, start + limit)
}

export async function fetchHadiths(
  bookId: string,
  chapterId?: string,
  page = 1,
  limit = 25,
  bookName?: string,
): Promise<HadithList> {
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(50, limit))

  let raws: RawHadith[]
  let chapter: HadithChapter | undefined

  try {
    if (chapterId) {
      const sec = await fetchJson<RawEdition>(
        `editions/ara-${bookId}/sections/${chapterId}.min.json`,
      )
      const rawTitle = Object.values(sec.metadata?.section ?? {})[0]?.trim()
      chapter = {
        id: chapterId,
        titleAr: rawTitle && isArabicScript(rawTitle) ? rawTitle : undefined,
        titleEn: rawTitle,
      }
      raws = toHadithArray(sec.hadiths).sort((a, b) => (a.hadithnumber ?? 0) - (b.hadithnumber ?? 0))
    } else {
      const edition = await getArabicEdition(bookId)
      raws = toHadithArray(edition.hadiths).sort((a, b) => (a.hadithnumber ?? 0) - (b.hadithnumber ?? 0))
    }
  } catch {
    return { items: [], total: 0, page: safePage, pages: 1 }
  }

  const normalized = raws
    .map((r) => normalizeHadith(r, bookId, bookName, chapter))
    .filter((h): h is Hadith => h !== null)

  const items = slice(normalized, safePage, safeLimit)
  return {
    items,
    total: normalized.length,
    page: safePage,
    pages: Math.max(1, Math.ceil(normalized.length / safeLimit)),
  }
}

function matchHadith(hadith: Hadith, normalizedQuery: string): boolean {
  if (!hadith.arabic) return false
  if (hadith.hadithNumber.toString() === normalizedQuery) return true
  const haystacks = [hadith.arabic, hadith.bookName ?? '', hadith.chapterTitle ?? '']
  return haystacks.some((t) => normalizeArabicText(t).includes(normalizedQuery))
}

export async function fetchSearch(
  query: string,
  bookId?: string,
): Promise<HadithSearchResult> {
  const q = query.trim()
  if (!q) return { items: [], total: 0 }
  const normalizedQuery = normalizeArabicText(q)

  const targets = bookId ? [bookId] : (AVAILABLE_BOOKS as readonly string[]).map((b) => b as string)
  const results: Hadith[] = []

  for (const id of targets) {
    const edition = await getArabicEdition(id)
    const raws = toHadithArray(edition.hadiths)
    for (const r of raws) {
      const h = normalizeHadith(r, id, BOOK_ARABIC_NAME[id])
      if (h && matchHadith(h, normalizedQuery)) results.push(h)
    }
  }

  return { items: results.slice(0, 200), total: results.length }
}