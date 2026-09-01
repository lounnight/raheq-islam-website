'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { AlertCircle, Download, Loader2, X } from 'lucide-react'

import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import type { SurahPageEntry } from '@/components/quran/surah-reader'
import type { MushafLayoutWord } from '@/types/quran'
import {
  buildImageFilename,
  ensureAyahImageFonts,
  ensureQcfFontsEmbedded,
  extractAyahWordLines,
  measureWidestLineEm,
  validateAyahRange,
  type AyahImageWordLine,
} from '@/lib/quran/ayah-image'
import { getTafsirMap } from '@/services/quran-tafsir-service'
import type { TafsirEntry } from '@/types/quran'
import { useTheme } from '@/components/theme-provider'
import { pageFontFaceName } from '@/lib/quran/fonts'
import { MUSHAF_PAGE_STYLE, PAGE_FONT_FACTOR } from './mushaf-layout'
import { MushafLine } from './mushaf-line'
import { BasmalaSvg } from './Basmala'
import { QuranTafsir } from './quran-tafsir'
import { MushafSurahHeading } from './mushaf-surah-heading'
import { shouldShowBismillah } from './mushaf-utils'
import { toArabicIndic } from './mushaf-utils'

export interface AyahImageExportProps {

  ayah: AyahRef

  surahName: string

  numberOfAyahs: number

  pages: SurahPageEntry[]

  onRangeChange: (range: { from: number; to: number } | null) => void
  onClose: () => void
}

const CAPTURE_WIDTH = 720
const CAPTURE_SCALE = 2
const MIN_SCALE = 0.6
const MAX_SCALE = 1.6
const TAFSIR_FONT_SIZE = '1rem'

const TAFSIR_OPTIONS = [{ id: 'ar_muyassar', label: 'التفسير الميسّر' }] as const

function resolveAmiriFamily(): string {
  try {
    const probe = document.createElement('span')
    probe.style.fontFamily = 'var(--font-amiri), "Amiri Quran", serif'
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    document.body.appendChild(probe)
    const family = getComputedStyle(probe).fontFamily
    probe.remove()
    return family || "'Amiri Quran', serif"
  } catch {
    return "'Amiri Quran', serif"
  }
}

function ExportCard({
  lines,
  surahName,
  surahNumber,
  from,
  to,
  theme,
  background,
  fontSizeFactor,
  showSurahName,
  tafsirEntries,
}: {
  lines: AyahImageWordLine[]
  surahName: string
  surahNumber: number
  from: number
  to: number
  theme: 'light' | 'dark'
  background: string
  fontSizeFactor: number
  showSurahName: boolean
  tafsirEntries: TafsirEntry[]
}) {
  let firstWordLocation: string | null = null
  for (const line of lines) {
    const first = line.words[0]
    if (first) {
      firstWordLocation = first.location
      break
    }
  }

  const lineGroups: { pageNumber: number; lines: AyahImageWordLine[] }[] = []
  for (const line of lines) {
    const last = lineGroups[lineGroups.length - 1]
    if (last && last.pageNumber === line.pageNumber) last.lines.push(line)
    else lineGroups.push({ pageNumber: line.pageNumber, lines: [line] })
  }

  const syntheticLine = (line: AyahImageWordLine, index: number) => ({
    line: index,
    type: 'text' as const,
    verseRange: {
      start: { surah: surahNumber, verse: from },
      end: { surah: surahNumber, verse: to },
    },
    text: '',
    words: line.words as MushafLayoutWord[],
  })

  return (
    <div
      className={`w-full ${theme === 'dark' ? 'dark' : 'light'}`}
      style={{ backgroundColor: background }}
      dir="rtl"
    >
      <div
        className="mx-auto w-full [container-type:inline-size]"
        style={{ maxWidth: CAPTURE_WIDTH }}
      >
        <article
          className="mushaf-page madinah-mushaf-page relative text-foreground [container-type:inline-size]"
          dir="rtl"
          lang="ar"
          style={{
            ...MUSHAF_PAGE_STYLE,
            backgroundColor: 'transparent',
            fontSize: `calc(${fontSizeFactor} * 1cqw)`,
          }}
        >
          {showSurahName && (
            <MushafSurahHeading
              headings={[{ surahNumber, name: surahName }]}
              showBismillah={false}
            />
          )}

          {from === 1 && shouldShowBismillah(surahNumber) && (
            <div className="mushaf-line m-0 w-full whitespace-nowrap text-center [direction:rtl]">
              <BasmalaSvg color="var(--foreground)" />
            </div>
          )}

          <main className="mushaf-text-region [padding-inline:var(--mushaf-inset-x,8.4%)]">
            {lineGroups.map((group, groupIndex) => (
              <div
                key={`${group.pageNumber}-${groupIndex}`}
                style={{
                  fontFamily: `'${pageFontFaceName(group.pageNumber)}'`,
                  lineHeight: 1.9,
                }}
              >
                {group.lines.map((line, i) => (
                  <MushafLine
                    key={`${group.pageNumber}-${groupIndex}-${i}`}
                    line={syntheticLine(line, groupIndex * 100 + i)}
                    firstWordLocation={firstWordLocation}
                  />
                ))}
              </div>
            ))}
          </main>
        </article>

        {tafsirEntries.length > 0 && (
          <div
            dir="rtl"
            style={{
              fontSize: TAFSIR_FONT_SIZE,
              paddingInline: '8.4%',
              paddingBottom: '1.4rem',
            }}
          >
            <QuranTafsir entries={tafsirEntries} />
          </div>
        )}
      </div>
    </div>
  )
}

export function AyahImageExport({
  ayah,
  surahName,
  numberOfAyahs,
  pages,
  onRangeChange,
  onClose,
}: AyahImageExportProps) {
  const { theme: siteTheme } = useTheme()
  const [from, setFrom] = useState(() => Math.min(Math.max(ayah.verse, 1), numberOfAyahs))
  const [to, setTo] = useState(() => Math.min(Math.max(ayah.verse, 1), numberOfAyahs))
  const [theme, setTheme] = useState<'light' | 'dark'>(siteTheme)
  const [bgMode, setBgMode] = useState<'default' | 'solid'>('default')
  const [bgColor, setBgColor] = useState('#faf6ee')
  const [showTafsir, setShowTafsir] = useState(false)
  const [tafsirId, setTafsirId] = useState<string>(TAFSIR_OPTIONS[0].id)
  const [tafsirEntries, setTafsirEntries] = useState<TafsirEntry[]>([])
  const [tafsirError, setTafsirError] = useState(false)
  const [sizeScale, setSizeScale] = useState(1)
  const [showSurahName, setShowSurahName] = useState(true)
  const [fontsReady, setFontsReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const error = useMemo(
    () => validateAyahRange(from, to, numberOfAyahs),
    [from, to, numberOfAyahs]
  )
  const lines = useMemo(
    () => (error ? [] : extractAyahWordLines(pages, ayah.surah, from, to)),
    [pages, ayah.surah, from, to, error]
  )

  useEffect(() => {
    onRangeChange(error ? null : { from, to })
    return () => onRangeChange(null)
  }, [from, to, error, onRangeChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setTheme(siteTheme)
  }, [siteTheme])

  useEffect(() => {
    if (error || lines.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        await ensureAyahImageFonts(lines, resolveAmiriFamily())
      } catch {}
      if (!cancelled) setFontsReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [lines, error])

  useEffect(() => {
    if (!showTafsir || error) {
      setTafsirEntries([])
      return
    }
    let ok = true
    setTafsirError(false)
    getTafsirMap()
      .then((map) => {
        if (!ok) return
        const entries: TafsirEntry[] = []
        for (let a = from; a <= to; a++) {
          const entry = map.get(`${ayah.surah}:${a}`)
          if (entry) entries.push(entry)
        }
        setTafsirEntries(entries)
        if (!entries.length) setTafsirError(true)
      })
      .catch(() => ok && setTafsirError(true))
    return () => {
      ok = false
    }
  }, [showTafsir, tafsirId, from, to, ayah.surah, error])

  const fontSizeFactor = useMemo(() => {
    const desired = PAGE_FONT_FACTOR * sizeScale
    const maxEm = lines.length ? measureWidestLineEm(lines) : 0
    if (maxEm <= 0) return desired
    const contentWidth = CAPTURE_WIDTH * (1 - 2 * 0.084)
    const maxFontSizePx = (100 * contentWidth) / maxEm
    const maxFactor = (maxFontSizePx / CAPTURE_WIDTH) * 100
    return Math.min(desired, maxFactor)
  }, [lines, sizeScale])

  const background =
    bgMode === 'solid' ? bgColor : theme === 'dark' ? 'var(--background)' : '#ffffff'

  const cardProps = {
    lines,
    surahName,
    surahNumber: ayah.surah,
    from,
    to,
    theme,
    background,
    fontSizeFactor,
    showSurahName,
    tafsirEntries,
  }

  const handleDownload = useCallback(async () => {
    if (error || !lines.length || exporting) return
    const node = captureRef.current
    if (!node) return
    setExporting(true)
    try {
      const pageNumbers = [...new Set(lines.map((l) => l.pageNumber))]
      await ensureQcfFontsEmbedded(pageNumbers)
      await document.fonts.ready
      const dataUrl = await toPng(node, {
        pixelRatio: CAPTURE_SCALE,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = buildImageFilename(surahName, from, to)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Failed to export ayah image', err)
    } finally {
      setExporting(false)
    }
  }, [error, lines, exporting, surahName, from, to])

  const ayahOptions = Array.from({ length: numberOfAyahs }, (_, i) => i + 1)
  const canSave = !error && lines.length > 0 && fontsReady && !exporting

  const controlLabel =
    'flex flex-col gap-[0.25rem] text-[0.78rem] font-semibold text-muted-foreground'
  const controlClass =
    'cursor-pointer rounded-[0.5rem] border border-border bg-muted px-[0.5rem] py-[0.35rem] text-[0.85rem] text-popover-foreground outline-none [font:inherit]'

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-[1rem] [background:rgb(0_0_0/0.4)]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(88vh,52rem)] w-[min(94vw,42rem)] max-w-full flex-col gap-[0.75rem] overflow-y-auto rounded-[0.75rem] border border-border bg-popover p-[1rem] text-popover-foreground shadow-[0_16px_48px_-12px_rgb(0_0_0/0.35)] [animation:ayah-menu-in_0.15s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={`حفظ الآية كصورة — سورة ${surahName}`}
        data-ayah-key={`${ayah.surah}:${ayah.verse}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-[0.5rem]">
          <h2 className="m-0 flex items-center gap-[0.45rem] text-[0.85rem] font-bold">
            <span>حفظ الآية كصورة · سورة {surahName}</span>
            <span
              className="rounded-full border border-primary/40 bg-primary/10 px-[0.5rem] py-[0.08rem] text-[0.62rem] font-semibold text-primary"
              title="هذه الميزة قيد التجربة"
            >
              تجريبي
            </span>
          </h2>
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-[0.45rem] border border-transparent bg-transparent text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
            aria-label="إغلاق نافذة حفظ الآية كصورة"
          >
            <X className="size-[16px]" />
          </button>
        </header>

        <div className="flex items-end justify-center gap-[0.6rem]" role="group" aria-label="اختيار نطاق الآيات">
          <label className={controlLabel}>
            <span>من الآية</span>
            <select
              className={`min-w-[6.5rem] ${controlClass}`}
              value={from}
              onChange={(e) => {
                const v = Number(e.target.value)
                setFrom(v)
                if (v > to) setTo(v)
              }}
              aria-label="من الآية"
            >
              {ayahOptions.map((n) => (
                <option key={n} value={n}>
                  {toArabicIndic(n)}
                </option>
              ))}
            </select>
          </label>

          <span className="pb-[0.55rem] text-[0.78rem] font-semibold text-muted-foreground" aria-hidden="true">
            إلى
          </span>

          <label className={controlLabel}>
            <span>إلى الآية</span>
            <select
              className={`min-w-[6.5rem] ${controlClass}`}
              value={to}
              onChange={(e) => {
                const v = Number(e.target.value)
                setTo(v)
                if (v < from) setFrom(v)
              }}
              aria-label="إلى الآية"
            >
              {ayahOptions.map((n) => (
                <option key={n} value={n}>
                  {toArabicIndic(n)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-[0.6rem] sm:grid-cols-3" role="group" aria-label="خيارات الصورة">
          <label className={controlLabel}>
            <span>المظهر</span>
            <select
              className={controlClass}
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              aria-label="مظهر الصورة"
            >
              <option value="light">فاتح</option>
              <option value="dark">داكن</option>
            </select>
          </label>

          <label className={controlLabel}>
            <span>الخلفية</span>
            <select
              className={controlClass}
              value={bgMode}
              onChange={(e) => setBgMode(e.target.value as 'default' | 'solid')}
              aria-label="نمط الخلفية"
            >
              <option value="default">افتراضي الموقع</option>
              <option value="solid">لون واحد</option>
            </select>
          </label>

          {bgMode === 'solid' && (
            <label className={controlLabel}>
              <span>لون الخلفية</span>
              <input
                type="color"
                className={`h-[2.1rem] w-full cursor-pointer ${controlClass}`}
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                aria-label="اختيار لون الخلفية"
              />
            </label>
          )}

          <label className={controlLabel}>
            <span>حجم خط القرآن</span>
            <input
              type="range"
              min={MIN_SCALE * 100}
              max={MAX_SCALE * 100}
              step={5}
              value={Math.round(sizeScale * 100)}
              onChange={(e) => setSizeScale(Number(e.target.value) / 100)}
              aria-label="حجم خط القرآن"
              className="h-[2.1rem] cursor-pointer accent-primary"
            />
          </label>

          <label className={controlLabel}>
            <span>اسم السورة</span>
            <select
              className={controlClass}
              value={showSurahName ? 'show' : 'hide'}
              onChange={(e) => setShowSurahName(e.target.value === 'show')}
              aria-label="إظهار اسم السورة"
            >
              <option value="show">إظهار</option>
              <option value="hide">إخفاء</option>
            </select>
          </label>

          <label className={controlLabel}>
            <span>التفسير</span>
            <select
              className={controlClass}
              value={showTafsir ? tafsirId : 'off'}
              onChange={(e) => {
                const v = e.target.value
                setShowTafsir(v !== 'off')
                if (v !== 'off') setTafsirId(v)
              }}
              aria-label="إظهار التفسير"
            >
              <option value="off">بدون تفسير</option>
              {TAFSIR_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p
            className="m-0 rounded-[0.5rem] border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] px-[0.7rem] py-[0.55rem] text-[0.78rem] font-semibold text-destructive [background:color-mix(in_oklab,var(--destructive)_10%,transparent)]"
            role="alert"
          >
            {error}
          </p>
        ) : lines.length === 0 ? (
          <p
            className="m-0 rounded-[0.5rem] border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] px-[0.7rem] py-[0.55rem] text-[0.78rem] font-semibold text-destructive [background:color-mix(in_oklab,var(--destructive)_10%,transparent)]"
            role="alert"
          >
            تعذّر العثور على نص هذا النطاق في بيانات المصحف.
          </p>
        ) : (
          <>
            {tafsirError && showTafsir && (
              <p className="m-0 flex items-center gap-[0.4rem] text-[0.78rem] text-muted-foreground" role="status">
                <AlertCircle className="size-[14px]" aria-hidden="true" />
                <span>تعذّر تحميل التفسير — ستُحفَظ الصورة بدونه.</span>
              </p>
            )}

            <div
              className="relative max-h-[42vh] overflow-auto rounded-[0.5rem] border border-border bg-muted"
              aria-live="polite"
            >
              {fontsReady ? (
                <ExportCard {...cardProps} />
              ) : (
                <div className="flex items-center justify-center gap-[0.4rem] p-[2rem] text-[0.78rem] text-muted-foreground">
                  <Loader2 className="[animation:ayah-image-spin_1s_linear_infinite]" aria-hidden="true" />
                  <span>جاري تجهيز خط المصحف…</span>
                </div>
              )}
            </div>

            <footer className="flex items-center gap-[0.5rem]">
              <span className="flex-1" />
              <button
                type="button"
                className="cursor-pointer rounded-[0.45rem] border border-border bg-muted px-[0.8rem] py-[0.35rem] text-[0.78rem] font-semibold text-popover-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground"
                onClick={onClose}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-[0.35rem] rounded-[0.45rem] border border-primary bg-primary px-[0.8rem] py-[0.35rem] text-[0.78rem] font-semibold text-primary-foreground transition-colors duration-100 hover:bg-primary hover:text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleDownload()}
                disabled={!canSave}
                aria-label="تنزيل الصورة"
              >
                {exporting ? (
                  <Loader2 className="size-[14px] [animation:ayah-image-spin_1s_linear_infinite]" aria-hidden="true" />
                ) : (
                  <Download className="size-[14px]" aria-hidden="true" />
                )}
                <span>{exporting ? 'جاري التصدير…' : 'تنزيل الصورة'}</span>
              </button>
            </footer>
          </>
        )}
      </div>

      {!error && lines.length > 0 && fontsReady && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: CAPTURE_WIDTH,
            zIndex: -1,
            opacity: 0,
            pointerEvents: 'none',
            transform: 'translateY(-200vh)',
          }}
        >
          <div ref={captureRef} style={{ width: CAPTURE_WIDTH }}>
            <ExportCard {...cardProps} />
          </div>
        </div>
      )}
    </div>
  )
}
