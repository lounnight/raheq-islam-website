import type {
  MushafLayoutLine,
  MushafLayoutWord,
  MushafPageLayout,
  MushafTextLayoutLine,
} from '@/types/quran'
import { MUSH_CANONICAL_PAGE_COUNT } from '@/lib/quran/fonts'

const GITHUB_RAW_LAYOUT_BASE =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/quran/text/layout/normalized'

export const MUSHAF_LAYOUT_SOURCE = 'github-raw' as const

export interface MushafLayoutDataSource {
  getPage(pageNumber: number): Promise<MushafPageLayout>
}

export function pageLayoutFileName(pageNumber: number): string {
  return `page-${String(pageNumber).padStart(3, '0')}.json`
}

export function buildNormalizedPageUrl(pageNumber: number): string {
  return `${GITHUB_RAW_LAYOUT_BASE}/${pageLayoutFileName(pageNumber)}`
}

export function isValidLayoutPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= MUSH_CANONICAL_PAGE_COUNT
}

type RawWord = {
  location: string
  surah: number
  verse: number
  word: number
  position: number
  glyph: string
  kind: string
  endOfVerse: boolean
  marker: string | null
  page: number
  line: number
  geometry: unknown
}

type RawTextLine = {
  line: number
  type: 'text'
  surah: number | null
  words: RawWord[]
}

type RawSurahHeaderLine = {
  line: number
  type: 'surah-header'
  surah: number
  surahName: string
  words: unknown[]
}

type RawBasmalaLine = {
  line: number
  type: 'basmala'
  surah: number | null
  words: unknown[]
}

type RawLayoutLine = RawTextLine | RawSurahHeaderLine | RawBasmalaLine

type RawNormalizedPage = {
  page: number
  linesPerPage: number
  lines: RawLayoutLine[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isRawWord(v: unknown): v is RawWord {
  return (
    isRecord(v) &&
    typeof v.location === 'string' &&
    typeof v.surah === 'number' &&
    typeof v.verse === 'number' &&
    typeof v.word === 'number' &&
    typeof v.position === 'number' &&
    typeof v.glyph === 'string'
  )
}

function assertValidLayout(json: unknown, pageNumber: number): RawNormalizedPage {
  if (!isRecord(json)) throw new Error(`Malformed Mushaf layout for page ${pageNumber}`)
  if (typeof json.page !== 'number' || !Array.isArray(json.lines)) {
    throw new Error(`Malformed Mushaf layout for page ${pageNumber}`)
  }
  if (json.page !== pageNumber) {
    throw new Error(
      `Mushaf layout mismatch: requested page ${pageNumber}, got page ${json.page}`
    )
  }
  for (const line of json.lines) {
    if (!isRecord(line) || typeof line.line !== 'number' || typeof line.type !== 'string') {
      throw new Error(`Malformed line entry on page ${pageNumber}`)
    }
    switch (line.type) {
      case 'text':
        if (!isRecord(line) || !Array.isArray(line.words)) {
          throw new Error(`Malformed text line ${line.line} on page ${pageNumber}`)
        }
        for (const w of line.words) {
          if (!isRawWord(w)) {
            throw new Error(
              `Malformed word in line ${line.line} on page ${pageNumber}`
            )
          }
        }
        break
      case 'surah-header':
        if (typeof line.surah !== 'number' || typeof line.surahName !== 'string') {
          throw new Error(
            `Malformed surah-header line ${line.line} on page ${pageNumber}`
          )
        }
        break
      case 'basmala':
        break
      default:
        throw new Error(
          `Unknown line type "${line.type}" on page ${pageNumber} (line ${line.line})`
        )
    }
  }
  return json as RawNormalizedPage
}

function adaptWord(raw: RawWord, trailingMarker: string | null): MushafLayoutWord {
  const glyphRun = trailingMarker ? `${raw.glyph}${trailingMarker}` : raw.glyph
  return {
    location: raw.location,
    surah: raw.surah,
    verse: raw.verse,
    word: raw.word,
    position: raw.position,
    text: raw.glyph,
    endOfVerse: raw.endOfVerse,
    marker: raw.marker,
    glyphs: { qpc2: glyphRun },
  }
}

function adaptTextLine(raw: RawTextLine): MushafTextLayoutLine {
  const ordered = [...raw.words].sort((a, b) => a.position - b.position)
  const words = ordered.map((w) =>
    adaptWord(w, w.endOfVerse && w.marker ? w.marker : null)
  )
  const first = words[0]
  const last = words[words.length - 1]
  let text = ''
  try {
    text = words.map((w) => w.glyphs.qpc2 ?? '').join('')
  } catch {
    text = ''
  }
  return {
    line: raw.line,
    type: 'text',
    verseRange: {
      start: { surah: first.surah, verse: first.verse },
      end: { surah: last.surah, verse: last.verse },
    },
    text,
    words,
  }
}

function adaptLine(raw: RawLayoutLine): MushafLayoutLine {
  switch (raw.type) {
    case 'surah-header':
      return {
        line: raw.line,
        type: 'surah-header',
        surah: raw.surah,
        text: raw.surahName,
      }
    case 'basmala':

      return { line: raw.line, type: 'basmala' }
    case 'text':
    default:
      return adaptTextLine(raw)
  }
}

export function adaptNormalizedPage(raw: RawNormalizedPage): MushafPageLayout {
  return {
    page: raw.page,
    lines: raw.lines.map(adaptLine),
  }
}

export class GitHubRawLayoutDataSource implements MushafLayoutDataSource {
  private cache = new Map<number, Promise<MushafPageLayout>>()

  async getPage(pageNumber: number): Promise<MushafPageLayout> {
    if (!isValidLayoutPage(pageNumber)) {
      throw new Error(
        `Invalid Mushaf page: ${pageNumber} (must be 1..${MUSH_CANONICAL_PAGE_COUNT})`
      )
    }

    const cached = this.cache.get(pageNumber)
    if (cached) return cached

    const promise = this.fetchPage(pageNumber).catch((err) => {
      this.cache.delete(pageNumber)
      throw err
    })
    this.cache.set(pageNumber, promise)
    return promise
  }

  private async fetchPage(pageNumber: number): Promise<MushafPageLayout> {
    const url = buildNormalizedPageUrl(pageNumber)
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' }
    })
    if (!res.ok) {
      throw new Error(
        `Failed to fetch Mushaf layout for page ${pageNumber} (HTTP ${res.status})`
      )
    }
    let json: unknown
    try {
      json = await res.json()
    } catch {
      throw new Error(
        `Mushaf layout for page ${pageNumber} is not valid JSON`
      )
    }
    const raw = assertValidLayout(json, pageNumber)
    return adaptNormalizedPage(raw)
  }
}

let DEFAULT_LAYOUT_SOURCE: MushafLayoutDataSource = new GitHubRawLayoutDataSource()

export function setMushafLayoutDataSource(source: MushafLayoutDataSource) {
  DEFAULT_LAYOUT_SOURCE = source
}

export function getMushafPageLayout(pageNumber: number): Promise<MushafPageLayout> {
  return DEFAULT_LAYOUT_SOURCE.getPage(pageNumber)
}
