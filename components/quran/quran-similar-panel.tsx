'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, X } from 'lucide-react'

import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import type { SurahMeta } from '@/types/quran'
import {
  getSimilarAyahs,
  type SimilarRef,
} from '@/services/quran-similar-service'
import { getVerseText } from '@/services/quran-source-service'
import { toArabicIndic } from './mushaf-utils'

export interface QuranSimilarPanelProps {

  ayah: AyahRef

  surahName: string

  surahs: SurahMeta[]
  onClose: () => void
}

type LoadState = 'loading' | 'loaded' | 'error'

export function QuranSimilarPanel({ ayah, surahName, surahs, onClose }: QuranSimilarPanelProps) {
  const router = useRouter()
  const [similar, setSimilar] = useState<SimilarRef[] | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [currentText, setCurrentText] = useState<string | null>(null)
  const [selectedRef, setSelectedRef] = useState<SimilarRef | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest('.quran-similar-panel') == null) {
        onClose()
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [onClose])

  useEffect(() => {
    let ok = true
    getVerseText(ayah.surah, ayah.verse)
      .then((t) => ok && setCurrentText(t ?? null))
      .catch(() => {})
    getSimilarAyahs(ayah.surah, ayah.verse)
      .then((refs) => {
        if (!ok) return
        setSimilar(refs)
        setState('loaded')
      })
      .catch(() => {
        if (!ok) return
        setState('error')
      })
    return () => {
      ok = false
    }
  }, [ayah.surah, ayah.verse])

  const navigateToRef = (ref: SimilarRef) => {
    setSelectedRef((prev) =>
      prev?.surah === ref.surah && prev?.startAyah === ref.startAyah ? null : ref
    )
  }

  const handleNavigate = (ref: SimilarRef) => {
    onClose()
    router.push(`/quran?surah=${ref.surah}&ayah=${ref.startAyah}`)
  }

  return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-[1rem] [background:rgb(0_0_0/0.4)]" onClick={onClose}>
      <aside
        className="flex max-h-[85vh] w-[min(92vw,34rem)] flex-col overflow-hidden rounded-[0.75rem] border border-border bg-card text-foreground shadow-[0_16px_48px_-12px_rgb(0_0_0/0.35)] [animation:ayah-menu-in_0.15s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label="الآيات المتشابهة"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border bg-card px-[1rem] py-[0.85rem]">
          <h1 className="m-0 flex items-center gap-2 text-[0.9rem] font-bold text-foreground">
            <Copy className="size-[15px]" aria-hidden="true" />
            الآيات المتشابهة
          </h1>
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-[0.45rem] border border-transparent bg-transparent text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
            aria-label="إغلاق لوحة الآيات المتشابهة"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-[1.1rem] overflow-y-auto p-[1rem]">
          
          <section aria-label="الآية الحالية">
            <h2 className="mb-[0.35rem] text-[0.75rem] font-bold text-muted-foreground">الآية الحالية</h2>
            <p className="mb-[0.25rem] text-[0.75rem] font-semibold text-primary">
              سورة {surahName} — الآية {toArabicIndic(ayah.verse)}
            </p>
            <p className="m-0 text-[1.1rem] leading-[2.1] font-arabic">
              {currentText ?? <span className="inline-block h-5 w-2/3 animate-pulse bg-muted" aria-hidden="true" />}
            </p>
          </section>

          
          <section aria-label="الآيات المتشابهة">
            <h2 className="mb-[0.35rem] text-[0.75rem] font-bold text-muted-foreground">الآيات المتشابهة</h2>

            {state === 'loading' && (
              <div className="flex flex-col gap-2" aria-busy="true">
                <div className="h-16 animate-pulse border bg-muted/50" />
                <div className="h-16 animate-pulse border bg-muted/50" />
              </div>
            )}

            {state === 'error' && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                تعذر تحميل الآيات المتشابهة — حاول مرة أخرى.
              </p>
            )}

            {state === 'loaded' && similar !== null && similar.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد آيات متشابهة لهذه الآية
              </p>
            )}

            {state === 'loaded' && similar !== null && similar.length > 0 && (
              <ul className="flex flex-col gap-2 p-0 m-0 list-none">
                {similar.map((ref) => (
                  <SimilarAyahCard
                    key={`${ref.surah}:${ref.startAyah}`}
                    ref_={ref}
                    surahs={surahs}
                    isSelected={
                      selectedRef?.surah === ref.surah &&
                      selectedRef?.startAyah === ref.startAyah
                    }
                    onSelect={navigateToRef}
                    onNavigate={handleNavigate}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}




function SimilarAyahCard({
  ref_,
  surahs,
  isSelected,
  onSelect,
  onNavigate,
}: {
  ref_: SimilarRef
  surahs: SurahMeta[]
  isSelected: boolean
  onSelect: (ref: SimilarRef) => void
  onNavigate: (ref: SimilarRef) => void
}) {
  const [texts, setTexts] = useState<(string | null)[] | null>(null)
  const isGroup = ref_.endAyah > ref_.startAyah

  useEffect(() => {
    let ok = true
    const ayahs: number[] = []
    for (let a = ref_.startAyah; a <= ref_.endAyah; a++) ayahs.push(a)
    Promise.all(ayahs.map((a) => getVerseText(ref_.surah, a).catch(() => null)))
      .then((t) => ok && setTexts(t.map((x) => x ?? null)))
    return () => {
      ok = false
    }
  }, [ref_.surah, ref_.startAyah, ref_.endAyah])

  const label = `الانتقال إلى السورة ${ref_.surah} الآية ${ref_.startAyah}`

  return (
    <li>
      <button
        type="button"
        className={`block w-full cursor-pointer rounded-[0.55rem] border border-border bg-card px-[0.85rem] py-[0.7rem] text-right transition-colors duration-100 hover:bg-accent hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] ${
          isSelected
            ? 'bg-[color-mix(in_oklab,var(--primary)_22%,transparent)] border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] outline outline-1 outline-[color-mix(in_oklab,var(--primary)_30%,transparent)] -outline-offset-1'
            : ''
        }`}
        onClick={() => onSelect(ref_)}
        onDoubleClick={() => onNavigate(ref_)}
        aria-label={`آية مشابهة: ${label}`}
        aria-pressed={isSelected}
        title={label}
      >
        <span className="block text-[0.72rem] font-bold text-primary">
          {surahs.find((s) => s.number === ref_.surah)?.name ?? `السورة ${ref_.surah}`} —{' '}
          {isGroup
            ? `الآيات ${toArabicIndic(ref_.startAyah)}–${toArabicIndic(ref_.endAyah)}`
            : `الآية ${toArabicIndic(ref_.startAyah)}`}
        </span>
        <span className="mt-[0.25rem] block text-[1.02rem] leading-[2] text-foreground font-arabic">
          {texts === null
            ?
              Array.from({ length: isGroup ? 2 : 1 }, (_, i) => (
                <span key={i} className="mb-1 block h-4 w-3/4 animate-pulse bg-muted" aria-hidden="true" />
              ))
            : texts.map((t, i) => (
                <span key={i} className="block">
                  {t ?? ''}
                </span>
              ))}
        </span>
      </button>
    </li>
  )
}

