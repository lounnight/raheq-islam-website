import type { MushafLayoutWord, MushafPageLayout } from '@/types/quran'
import { pageFontFaceName, pageFontUrl } from '@/lib/quran/fonts'


export interface AyahImagePageEntry {
  pageNumber: number
  layout: MushafPageLayout | null
}


export interface AyahImageWordLine {
  pageNumber: number

  words: MushafLayoutWord[]
}

export function extractAyahWordLines(
  pages: readonly AyahImagePageEntry[],
  surah: number,
  from: number,
  to: number
): AyahImageWordLine[] {
  const out: AyahImageWordLine[] = []
  for (const page of pages) {
    if (!page.layout) continue
    for (const line of page.layout.lines) {
      if (line.type !== 'text') continue
      const words = line.words.filter(
        (w) => w.surah === surah && w.verse >= from && w.verse <= to
      )
      if (words.length > 0) out.push({ pageNumber: page.pageNumber, words })
    }
  }
  return out
}


export function wordGlyph(word: MushafLayoutWord): string {
  return word.glyphs?.qpc2 || word.glyphs?.qpc1 || ''
}

export function validateAyahRange(
  from: number,
  to: number,
  numberOfAyahs: number
): string | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    return 'الرجاء اختيار رقمَي الآيتين.'
  }
  if (numberOfAyahs < 1) {
    return 'لا توجد آيات متاحة في هذه السورة.'
  }
  if (from < 1 || to < 1 || from > numberOfAyahs || to > numberOfAyahs) {
    return `أرقام الآيات في هذه السورة من ١ إلى ${numberOfAyahs} فقط.`
  }
  if (from > to) {
    return 'يجب أن تكون آية البداية قبل آية النهاية أو مساوية لها.'
  }
  return null
}

export function buildImageFilename(
  surahName: string,
  from: number,
  to: number
): string {
  const safeName = surahName.replace(/[\s/\\:*?"<>|]+/g, '-').trim() || 'سورة'
  return `سورة-${safeName}-الآيات-${from}-${to}.png`
}

export async function ensureAyahImageFonts(
  lines: readonly AyahImageWordLine[],
  amiriFamily: string
): Promise<void> {
  const pageNumbers = [...new Set(lines.map((l) => l.pageNumber))]
  const loads = pageNumbers.map((page) =>
    document.fonts.load(`12px "${pageFontFaceName(page)}"`)
  )
  if (amiriFamily) loads.push(document.fonts.load(`48px ${amiriFamily}`))
  await Promise.all(loads)
}

export function measureWidestLineEm(
  lines: readonly AyahImageWordLine[]
): number {
  if (typeof document === 'undefined') return 0
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0
  let maxEm = 0
  for (const line of lines) {
    ctx.font = `100px "${pageFontFaceName(line.pageNumber)}"`
    let width100 = 0
    for (const word of line.words) width100 += ctx.measureText(wordGlyph(word)).width
    if (width100 > 0) maxEm = Math.max(maxEm, width100 / 100)
  }
  return maxEm
}

const qcfDataUriCache = new Map<number, string>()

async function fetchQcfFontDataUri(pageNumber: number): Promise<string> {
  const cached = qcfDataUriCache.get(pageNumber)
  if (cached) return cached
  const res = await fetch(pageFontUrl(pageNumber))
  if (!res.ok) throw new Error(`Failed to fetch QCF font page ${pageNumber}`)
  const buffer = await res.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  const uri = `data:font/ttf;base64,${btoa(binary)}`
  qcfDataUriCache.set(pageNumber, uri)
  return uri
}

export async function ensureQcfFontsEmbedded(
  pageNumbers: readonly number[]
): Promise<void> {
  if (typeof document === 'undefined') return
  let style = document.getElementById('ayah-export-qcf-fonts') as
    | (HTMLStyleElement & { _qcfPages?: Set<number> })
    | null
  if (!style) {
    style = document.createElement('style') as HTMLStyleElement & { _qcfPages?: Set<number> }
    style.id = 'ayah-export-qcf-fonts'
    style._qcfPages = new Set<number>()
    document.head.appendChild(style)
  }
  const embedded = style._qcfPages ?? new Set<number>()
  style._qcfPages = embedded
  const pending = pageNumbers.filter((p) => !embedded.has(p))
  if (pending.length === 0) return
  const rules: string[] = []
  for (const page of pending) {
    try {
      const uri = await fetchQcfFontDataUri(page)
      rules.push(
        `@font-face { font-family: "${pageFontFaceName(page)}"; src: url("${uri}") format("truetype"); font-display: block; }`
      )
      embedded.add(page)
    } catch {
    }
  }
  if (rules.length) style.textContent += rules.join('\n')
}
