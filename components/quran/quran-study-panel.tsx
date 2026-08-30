'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Compass, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getAyahSource, getVerseText } from '@/services/quran-source-service'
import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import {
  DEFAULT_SOURCE_ID,
  getSource,
  getSources,
  type QuranSource,
} from '@/lib/quran/sources'
import { toArabicIndic } from './mushaf-utils'

export interface QuranStudyPanelProps {
  open: boolean
  selectedAyah: AyahRef | null

  surahName: string
  onClose: () => void
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

export function QuranStudyPanel({
  open,
  selectedAyah,
  surahName,
  onClose,
}: QuranStudyPanelProps) {
  const [selectedSourceId, setSelectedSourceId] = useState(DEFAULT_SOURCE_ID)
  const [verseText, setVerseText] = useState<string | null>(null)
  const [sourceText, setSourceText] = useState<string | null>(null)
  const [verseState, setVerseState] = useState<LoadState>('idle')
  const [sourceState, setSourceState] = useState<LoadState>('idle')

  const selectedSource = getSource(selectedSourceId) ?? getSources()[0]
  const verseNum = selectedAyah?.verse ?? 0

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest('.quran-study-panel') == null) {
        onClose()
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [open, onClose])

  useEffect(() => {
    if (!selectedAyah) {
      setVerseText(null)
      setVerseState('idle')
      return
    }
    setVerseText(null)
    setVerseState('loading')
    getVerseText(selectedAyah.surah, selectedAyah.verse)
      .then((t) => {
        setVerseText(t ?? null)
        setVerseState(t ? 'loaded' : 'error')
      })
      .catch(() => {
        setVerseText(null)
        setVerseState('error')
      })
  }, [selectedAyah])

  useEffect(() => {
    if (!selectedAyah) {
      setSourceText(null)
      setSourceState('idle')
      return
    }
    setSourceText(null)
    setSourceState('loading')
    getAyahSource(selectedSourceId, selectedAyah.surah, selectedAyah.verse)
      .then((t) => {
        setSourceText(t ?? null)
        setSourceState(t ? 'loaded' : 'error')
      })
      .catch(() => {
        setSourceText(null)
        setSourceState('error')
      })
  }, [selectedAyah, selectedSourceId])

  const grouped = useMemo(() => {
    const sources = getSources()
    return {
      tafsir: sources.filter((s) => s.type === 'tafsir'),
      translation: sources.filter((s) => s.type === 'translation'),
    }
  }, [])

  const showContent = open && selectedAyah

  const contentBlock: ReactNode = !showContent ? (
    <div className="flex flex-col items-center gap-[0.6rem] p-[2rem_1rem] text-center text-muted-foreground">
      <Compass className="h-8 w-8 opacity-[0.45]" />
      <p>حدد آية من المصحف لعرض التفسير والترجمة.</p>
    </div>
  ) : (
    <>
      <header className="mb-[0.75rem]">
        <h2 className="m-0 text-[1.05rem] font-bold text-foreground">
          سورة {surahName} —{' '}
          <span className="text-[0.9rem] font-medium text-muted-foreground">
            الآية {toArabicIndic(verseNum)}
          </span>
        </h2>
      </header>

      <div className="mb-[0.75rem]">
        {verseState === 'loading' ? (
          <VerseSkeleton />
        ) : verseState === 'error' || !verseText ? (
          <p className="m-0 italic text-muted-foreground">النص غير متاح</p>
        ) : (
          <p
            className="m-0 text-right text-[1.2rem] leading-[1.9] text-foreground [font-family:var(--font-arabic),'Amiri_Quran',Cairo,serif]"
            lang="ar"
            dir="rtl"
          >
            {verseText}
          </p>
        )}
      </div>

      <div className="my-[0.75rem] border-t border-border opacity-60" />

      <div className="mt-[0.75rem]">
        <div
          className="mb-[0.5rem] text-[0.8rem] font-bold text-primary"
          lang={selectedSource.language === 'ar' ? 'ar' : undefined}
          dir={selectedSource.language === 'ar' ? 'rtl' : 'ltr'}
        >
          {selectedSource.name}
        </div>
        {sourceState === 'loading' ? (
          <SourceSkeleton />
        ) : sourceState === 'error' || !sourceText ? (
          <p className="m-0 italic text-muted-foreground">
            لا يتوفر تفسير/ترجمة لهذه الآية في هذا المصدر.
          </p>
        ) : (
          <p
            className="m-0 text-[0.98rem] leading-[1.8] text-foreground"
            lang={selectedSource.language}
            dir="auto"
          >
            {sourceText}
          </p>
        )}
      </div>
    </>
  )

  return (
    <>
      
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-300',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      
            <aside
        className={cn(
          'quran-study-panel fixed z-50 flex flex-col border bg-card shadow-xl rounded-xl',
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[92vw] max-w-3xl h-[85vh] max-h-[720px]',
          'transition-opacity duration-300',
          open
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <header className="flex items-center justify-between border-b border-border bg-card px-[1rem] py-[0.85rem]">
          <h1 className="m-0 text-[0.9rem] font-bold text-foreground">دراسة الآية</h1>
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-[0.45rem] border border-transparent bg-transparent text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
            aria-label="إغلاق اللوحة"
          >
            <X className="size-4" />
          </button>
        </header>

        
        <div className="flex min-h-0 flex-1 flex-row-reverse overflow-hidden">
          <div className="min-w-0 flex-1 overflow-y-auto border-l border-border p-[1rem_1rem_1rem_1.1rem] max-[767px]:border-b max-[767px]:border-l-0 max-[767px]:border-border">
            {contentBlock}
          </div>

          <nav
            className="min-w-0 w-50 basis-[45%] max-w-[22rem] shrink-0 overflow-y-auto border-e bg-background"
            aria-label="مصادر التفسير والترجمة"
          >
            <div className="[&+&]:mt-[0.25rem] [&+&]:border-t [&+&]:border-border">
              <div
                className="border-b border-border px-[1rem] py-[0.55rem] text-[0.75rem] font-bold uppercase text-muted-foreground [letter-spacing:0.04em]"
                aria-hidden="true"
              >
                التفاسير
              </div>
              {grouped.tafsir.map((src) => (
                <SourceItem
                  key={src.id}
                  source={src}
                  selected={selectedSourceId === src.id}
                  onSelect={() => setSelectedSourceId(src.id)}
                />
              ))}
            </div>
            <div className="[&+&]:mt-[0.25rem] [&+&]:border-t [&+&]:border-border">
              <div className="border-b border-border px-[1rem] py-[0.55rem] text-[0.75rem] font-bold uppercase text-muted-foreground [letter-spacing:0.04em]">
                الترجمات
              </div>
              {grouped.translation.map((src) => (
                <SourceItem
                  key={src.id}
                  source={src}
                  selected={selectedSourceId === src.id}
                  onSelect={() => setSelectedSourceId(src.id)}
                />
              ))}
            </div>
          </nav>
        </div>
      </aside>
    </>
  )
}

function SourceItem({
  source,
  selected,
  onSelect,
}: {
  source: QuranSource
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full cursor-pointer items-center justify-end gap-[0.5rem] border-none bg-transparent p-[0.5rem_0.75rem_0.5rem_1rem] text-right text-[0.9rem] text-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground',
        selected &&
          'bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] font-semibold text-primary-foreground'
      )}
      data-source-id={source.id}
      onClick={onSelect}
    >
      <span
        className={cn(
          'size-[0.55rem] shrink-0 rounded-full bg-muted-foreground',
          selected && 'bg-primary-foreground'
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {source.name}
      </span>
      <span
        className={cn(
          'text-[0.68rem] text-muted-foreground opacity-80',
          selected && 'text-primary-foreground opacity-100'
        )}
        aria-label="language"
      >
        {source.language.toUpperCase()}
      </span>
    </button>
  )
}

function VerseSkeleton() {
  return (
    <div className="flex flex-col gap-[0.4rem]">
      <div className="h-[0.95rem] w-full rounded-[3px] bg-muted" />
      <div className="h-[0.95rem] w-full rounded-[3px] bg-muted" style={{ width: '65%' }} />
    </div>
  )
}

function SourceSkeleton() {
  return (
    <div className="flex flex-col gap-[0.4rem]">
      <div className="h-[0.95rem] w-full rounded-[3px] bg-muted" />
      <div className="h-[0.95rem] w-full rounded-[3px] bg-muted" />
      <div className="h-[0.95rem] w-full rounded-[3px] bg-muted" style={{ width: '65%' }} />
    </div>
  )
}