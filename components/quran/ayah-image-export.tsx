'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'

import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import type { SurahPageEntry } from '@/components/quran/surah-reader'
import {
  buildImageFilename,
  ensureAyahImageFonts,
  extractAyahWordLines,
  renderAyahImageCard,
  validateAyahRange,
} from '@/lib/quran/ayah-image'
import { toArabicIndic } from './mushaf-utils'

export interface AyahImageExportProps {

  ayah: AyahRef

  surahName: string

  numberOfAyahs: number

  pages: SurahPageEntry[]

  onRangeChange: (range: { from: number; to: number } | null) => void
  onClose: () => void
}

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

export function AyahImageExport({
  ayah,
  surahName,
  numberOfAyahs,
  pages,
  onRangeChange,
  onClose,
}: AyahImageExportProps) {
  const [from, setFrom] = useState(() => Math.min(Math.max(ayah.verse, 1), numberOfAyahs))
  const [to, setTo] = useState(() => Math.min(Math.max(ayah.verse, 1), numberOfAyahs))
  const [fontsReady, setFontsReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    if (error || lines.length === 0) return
    let cancelled = false
    const amiriFamily = resolveAmiriFamily()
    ;(async () => {
      try {
        await ensureAyahImageFonts(lines, amiriFamily)
      } catch {
      }
      if (cancelled) return
      setFontsReady(true)
      const canvas = canvasRef.current
      if (canvas) {
        renderAyahImageCard(canvas, { lines, surahName, from, to, amiriFamily })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lines, surahName, from, to, error])

  const handleSave = useCallback(() => {
    if (error) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = buildImageFilename(surahName, from, to)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    }, 'image/png')
  }, [error, surahName, from, to])

  const ayahOptions = Array.from({ length: numberOfAyahs }, (_, i) => i + 1)
  const canSave = !error && lines.length > 0 && fontsReady

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-[1rem] [background:rgb(0_0_0/0.4)]" onClick={onClose}>
      <div
        className="w-[min(94vw,34rem)] max-h-[min(88vh,52rem)] max-w-full overflow-y-auto rounded-[0.75rem] border border-border bg-popover p-[1rem] text-popover-foreground shadow-[0_16px_48px_-12px_rgb(0_0_0/0.35)] [animation:ayah-menu-in_0.15s_ease-out] flex flex-col gap-[0.75rem]"
        role="dialog"
        aria-modal="true"
        aria-label={`حفظ الآية كصورة — سورة ${surahName}`}
        data-ayah-key={`${ayah.surah}:${ayah.verse}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-[0.5rem]">
          <h2 className="m-0 text-[0.85rem] font-bold">حفظ الآية كصورة · سورة {surahName}</h2>
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
          <label className="flex flex-col gap-[0.25rem] text-[0.78rem] font-semibold text-muted-foreground">
            <span>من الآية</span>
            <select
              className="min-w-[6.5rem] cursor-pointer rounded-[0.5rem] border border-border bg-muted px-[0.5rem] py-[0.35rem] text-[0.85rem] text-popover-foreground outline-none [font:inherit]"
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

          <label className="flex flex-col gap-[0.25rem] text-[0.78rem] font-semibold text-muted-foreground">
            <span>إلى الآية</span>
            <select
              className="min-w-[6.5rem] cursor-pointer rounded-[0.5rem] border border-border bg-muted px-[0.5rem] py-[0.35rem] text-[0.85rem] text-popover-foreground outline-none [font:inherit]"
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
          <div className="relative max-h-[46vh] overflow-auto rounded-[0.5rem] border border-border bg-muted" aria-live="polite">
            <canvas
              ref={canvasRef}
              className="block h-auto w-full"
              aria-label={`معاينة صورة سورة ${surahName} الآيات ${toArabicIndic(from)} - ${toArabicIndic(to)}`}
            />
            {!fontsReady && (
              <div className="absolute inset-0 flex items-center justify-center gap-[0.4rem] text-[0.78rem] text-muted-foreground [background:color-mix(in_oklab,var(--popover)_70%,transparent)]">
                <Loader2 className="[animation:ayah-image-spin_1s_linear_infinite]" aria-hidden="true" />
                <span>جاري تجهيز خط المصحف…</span>
              </div>
            )}
          </div>
        )}

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
            className="cursor-pointer rounded-[0.45rem] border border-primary bg-primary px-[0.8rem] py-[0.35rem] text-[0.78rem] font-semibold text-primary-foreground transition-colors duration-100 hover:bg-primary hover:text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSave}
            disabled={!canSave}
            aria-label="حفظ الصورة"
          >
            <Download className="size-[14px]" aria-hidden="true" />
            <span>حفظ الصورة</span>
          </button>
        </footer>
      </div>
    </div>
  )
}
