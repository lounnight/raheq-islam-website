
import type { MushafLayoutWord, MushafPageLayout } from '@/types/quran'
import { pageFontFaceName } from '@/lib/quran/fonts'


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


export interface AyahImagePalette {
  background: string
  foreground: string
  muted: string
  accent: string
}


export const DEFAULT_AYAH_IMAGE_PALETTE: AyahImagePalette = {
  background: '#faf6ee',
  foreground: '#24211c',
  muted: '#8a8070',
  accent: '#0f766e',
}

export interface AyahImageRenderOptions {
  lines: readonly AyahImageWordLine[]
  surahName: string
  from: number
  to: number

  amiriFamily: string
  palette?: AyahImagePalette

  scale?: number
}

export interface AyahImageDimensions {
  width: number
  height: number
}


const CARD_WIDTH = 1080
const CARD_PAD_X = 88
const CARD_PAD_TOP = 72
const CARD_PAD_BOTTOM = 64
const QCF_LINE_HEIGHT = 1.72
const MIN_FONT_SIZE = 24
const MAX_FONT_SIZE = 96

export function renderAyahImageCard(
  canvas: HTMLCanvasElement,
  {
    lines,
    surahName,
    from,
    to,
    amiriFamily,
    palette = DEFAULT_AYAH_IMAGE_PALETTE,
    scale = 2,
  }: AyahImageRenderOptions
): AyahImageDimensions | null {
  const drawable = lines.filter((l) => l.words.some((w) => wordGlyph(w)))
  if (drawable.length === 0) return null

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const contentWidth = CARD_WIDTH - 2 * CARD_PAD_X
  let maxEm = 0
  for (const line of drawable) {
    ctx.font = `100px "${pageFontFaceName(line.pageNumber)}"`
    let width100 = 0
    for (const word of line.words) width100 += ctx.measureText(wordGlyph(word)).width
    if (width100 > 0) maxEm = Math.max(maxEm, width100 / 100)
  }
  if (maxEm <= 0) return null
  const fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, contentWidth / maxEm))
  const lineHeightPx = fontSize * QCF_LINE_HEIGHT

  const nameSize = 48
  const rangeSize = 26
  const footerSize = 20

  let y = CARD_PAD_TOP
  const nameBaseline = y + nameSize
  y = nameBaseline + 10 + rangeSize
  const rangeBaseline = y
  y += 26 + 22
  const qcfTop = y
  y += drawable.length * lineHeightPx
  y += 34
  const footerY = y + footerSize
  const height = Math.ceil(footerY + 8 + CARD_PAD_BOTTOM - footerSize)

  canvas.width = Math.round(CARD_WIDTH * scale)
  canvas.height = Math.round(height * scale)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.textBaseline = 'alphabetic'
  ctx.direction = 'rtl'

  ctx.fillStyle = palette.background
  ctx.fillRect(0, 0, CARD_WIDTH, height)

  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.45
  ctx.strokeRect(22, 22, CARD_WIDTH - 44, height - 44)
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.3
  ctx.strokeRect(32, 32, CARD_WIDTH - 64, height - 64)
  ctx.globalAlpha = 1

  ctx.fillStyle = palette.accent
  ctx.font = `${nameSize}px ${amiriFamily || "'Amiri Quran', serif"}`
  ctx.textAlign = 'center'
  ctx.fillText(`سورة ${surahName}`, CARD_WIDTH / 2, nameBaseline)

  ctx.fillStyle = palette.muted
  ctx.font = `${rangeSize}px ${amiriFamily || "'Amiri Quran', serif"}`
  ctx.fillText(
    `الآيات ${toArabicDigits(from)} - ${toArabicDigits(to)}`,
    CARD_WIDTH / 2,
    rangeBaseline
  )

  ctx.strokeStyle = palette.accent
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.moveTo(CARD_WIDTH / 2 - 120, y - 8)
  ctx.lineTo(CARD_WIDTH / 2 - 26, y - 8)
  ctx.moveTo(CARD_WIDTH / 2 + 26, y - 8)
  ctx.lineTo(CARD_WIDTH / 2 + 120, y - 8)
  ctx.stroke()
  ctx.save()
  ctx.translate(CARD_WIDTH / 2, y - 8)
  ctx.rotate(Math.PI / 4)
  ctx.strokeRect(-5, -5, 10, 10)
  ctx.restore()
  ctx.globalAlpha = 1

  ctx.textAlign = 'left'
  let lineY = qcfTop + fontSize
  for (const line of drawable) {
    ctx.font = `${fontSize}px "${pageFontFaceName(line.pageNumber)}"`
    const glyphs = line.words.map((w) => wordGlyph(w)).filter((g) => g !== '')
    let totalWidth = 0
    const widths = glyphs.map((g) => {
      const w = ctx.measureText(g).width
      totalWidth += w
      return w
    })
    let right = CARD_WIDTH / 2 + totalWidth / 2
    glyphs.forEach((g, i) => {
      const w = widths[i] ?? 0
      ctx.fillStyle = palette.foreground
      ctx.fillText(g, right - w, lineY)
      right -= w
    })
    lineY += lineHeightPx
  }

  ctx.fillStyle = palette.muted
  ctx.font = `${footerSize}px ${amiriFamily || "'Amiri Quran', serif"}`
  ctx.textAlign = 'center'
  ctx.fillText('المصحف المديني', CARD_WIDTH / 2, footerY)

  return { width: CARD_WIDTH, height }
}


function toArabicDigits(value: number): string {
  const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(value)
    .split('')
    .map((ch) => (ch >= '0' && ch <= '9' ? AR[Number(ch)] : ch))
    .join('')
}
