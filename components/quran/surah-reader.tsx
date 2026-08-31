'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { List } from 'lucide-react'

import type { QuranPageData, MushafPageLayout, SurahMeta } from '@/types/quran'
import { QuranPageRenderer } from './quran-page-renderer'
import { MushafPageInteraction, type AyahRef } from './mushaf-page-interaction'
import { QuranStudyPanel } from './quran-study-panel'
import { AyahNoteEditor } from './ayah-note-editor'
import { AyahImageExport } from './ayah-image-export'
import { QuranSimilarPanel } from './quran-similar-panel'
import { QuranAudioPlayer } from './quran-audio-player'
import {
  useQuranAudioActions,
  useQuranAudioCore,
} from '@/hooks/use-quran-audio'
import {
  ayahKey,
  deleteAyahNote,
  getAyahBookmarks,
  getAyahNotes,
  saveAyahNote,
  toggleAyahBookmark,
} from '@/lib/ayah-storage'
import { saveReadingProgress } from '@/lib/quran-reading-storage'
import { toArabicIndic, JUZ_LABEL, HIZB_LABEL } from './mushaf-utils'
import { Button } from '@/components/ui/button'


export type SurahPageEntry = {

  pageNumber: number
  pageData: QuranPageData
  layout: MushafPageLayout | null
}

type SurahReaderProps = {
  surahs: SurahMeta[]

  sura: SurahMeta

  pages: SurahPageEntry[]
  focusAyah?: number | null
}

export function SurahReader({ surahs, sura, pages, focusAyah }: SurahReaderProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedAyah, setSelectedAyah] = useState<AyahRef | null>(null)

  const handlePanelClose = () => {
    setPanelOpen(false)
    setSelectedAyah(null)
  }

  const [bookmarkedKeys, setBookmarkedKeys] = useState<ReadonlySet<string>>(new Set())
  const [notedKeys, setNotedKeys] = useState<ReadonlySet<string>>(new Set())
  const [noteAyah, setNoteAyah] = useState<AyahRef | null>(null)
  const [similarAyah, setSimilarAyah] = useState<AyahRef | null>(null)

  const [exportAyah, setExportAyah] = useState<AyahRef | null>(null)
  const [exportRange, setExportRange] = useState<{ from: number; to: number } | null>(null)

  const audioCore = useQuranAudioCore()
  const audioActions = useQuranAudioActions()
  const handlePlayAyah = (ayah: AyahRef) => {
    const key = `${ayah.surah}:${ayah.verse}`
    if (audioCore.currentAyah !== key) {
      audioActions.selectAyah(ayah.surah, ayah.verse)
    }
  }

  useEffect(() => {
    const key = audioCore.currentAyah
    if (!key) return
    const [s, v] = key.split(':')
    const surahNum = Number.parseInt(s ?? '', 10)
    if (surahNum !== sura.number) {
      if (audioCore.isPlaying && surahNum >= 1 && surahNum <= 114) {
        router.push(`/quran?surah=${surahNum}&ayah=${v ?? '1'}`)
      }
      return
    }
    const raf = window.requestAnimationFrame(() => {
      const word = document.querySelector(
        `.mushaf-word[data-surah="${surahNum}"][data-verse="${v}"]`
      ) as HTMLElement | null
      word?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [audioCore.currentAyah, audioCore.isPlaying, sura.number, router])

  useEffect(() => {
    setBookmarkedKeys(new Set(Object.keys(getAyahBookmarks())))
    setNotedKeys(new Set(Object.keys(getAyahNotes())))
  }, [])

  useEffect(() => {
    if (!focusAyah || focusAyah < 1) return
    let cancelled = false
    let intervalId = 0
    let removeTimer = 0

    const selector = `.mushaf-word[data-surah="${sura.number}"][data-verse="${focusAyah}"]`

    const tryFocus = (): boolean => {
      const words = document.querySelectorAll(selector)
      if (!words.length) return false
      ;(words[0] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      words.forEach((w) => w.classList.add('ayah-flash-marker'))
      removeTimer = window.setTimeout(() => {
        document
          .querySelectorAll('.ayah-flash-marker')
          .forEach((w) => w.classList.remove('ayah-flash-marker'))
      }, 1900)
      return true
    }

    if (!tryFocus()) {
      intervalId = window.setInterval(() => {
        if (cancelled || tryFocus()) {
          if (intervalId) window.clearInterval(intervalId)
        }
      }, 150)
      window.setTimeout(() => {
        if (intervalId) window.clearInterval(intervalId)
      }, 3000)
    }

    return () => {
      cancelled = true
      if (intervalId) window.clearInterval(intervalId)
      if (removeTimer) window.clearTimeout(removeTimer)
    }
  }, [])

  const selectedKey = selectedAyah
    ? `${selectedAyah.surah}:${selectedAyah.verse}`
    : null


  const handleSelect = (ayah: AyahRef | null) => {
    setSelectedAyah(ayah)
  }

  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target || typeof target.closest !== 'function') return
      if (target.closest('.mushaf-page-interaction, .ayah-action-menu')) return
      setSelectedAyah(null)
    }
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [])


  const handleTafsir = (ayah: AyahRef) => {
    setSelectedAyah(ayah)
    setPanelOpen(true)
  }

  const handleToggleBookmark = (ayah: AyahRef) => {
    const key = ayahKey(ayah.surah, ayah.verse)
    const saved = toggleAyahBookmark(key)
    setBookmarkedKeys((prev) => {
      const next = new Set(prev)
      if (saved) next.add(key)
      else next.delete(key)
      return next
    })
  }


  const handleNote = (ayah: AyahRef) => setNoteAyah(ayah)


  const handleSimilar = (ayah: AyahRef) => setSimilarAyah(ayah)


  const handleImage = (ayah: AyahRef) => setExportAyah(ayah)

  const handleSaveNote = (ayah: AyahRef, text: string) => {
    const key = ayahKey(ayah.surah, ayah.verse)
    saveAyahNote(key, text)
    setNotedKeys((prev) => new Set(prev).add(key))
    setNoteAyah(null)
  }

  const handleDeleteNote = (ayah: AyahRef) => {
    const key = ayahKey(ayah.surah, ayah.verse)
    deleteAyahNote(key)
    setNotedKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setNoteAyah(null)
  }

  const active = pages[activeIndex] ?? pages[0]

  useEffect(() => {
    const HIDE_AFTER = 80
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastScrollY.current
      lastScrollY.current = y
      if (y > HIDE_AFTER && dy > 6) setHeaderHidden(true)
      else if (dy < -6) setHeaderHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>('*[data-page-block]')
    )
    if (!blocks.length) return

    let raf = 0
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )
        const best = visible[0]
        if (!best) return
        const next = Number((best.target as HTMLElement).dataset.pageBlock ?? 0)
        if (raf) return
        raf = window.requestAnimationFrame(() => {
          raf = 0
          setActiveIndex((prev) => (prev === next ? prev : next))
        })
      },
      { rootMargin: '-15% 0px -45% 0px', threshold: 0 }
    )
    blocks.forEach((b) => observer.observe(b))
    return () => {
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pages.length])

  useEffect(() => {
    if (pages.length === 0) return
    const entry = pages[activeIndex]
    if (!entry) return
    saveReadingProgress({
      surah: sura.number,
      page: entry.pageNumber,
      totalPages: pages.length
    })
  }, [activeIndex, pages.length, sura.number])

  return (
    <div className="flex flex-col" dir="rtl">
      
      <header
        className={`surah-dynamic-header sticky top-[65px] z-20 border-b border-border backdrop-blur-[8px] [background:color-mix(in_oklab,var(--background)_92%,transparent)] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif] [transition:transform_0.28s_ease,opacity_0.28s_ease] ${
          headerHidden ? 'is-hidden' : ''
        }`}
        aria-hidden={headerHidden}
      >
        <div className="mx-auto flex max-w-[640px] items-center gap-[0.75rem] px-[0.75rem] py-[0.6rem]">
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-border bg-transparent text-foreground transition-colors duration-150 hover:bg-muted"
            onClick={() => router.push('/quran')}
            aria-label="فهرس السور"
          >
            <List className="size-4" data-icon="inline-start" />
          </button>

          <div className="flex min-w-0 flex-col">
            <span className="overflow-hidden text-[1rem] font-bold whitespace-nowrap text-foreground [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif] [text-overflow:ellipsis]">
              سورة {sura.name}
            </span>
            <span className="flex gap-[0.75rem] text-[0.82em] text-muted-foreground">
              <span>{JUZ_LABEL} {toArabicIndic(active?.pageData?.juzNumber ?? 1)}</span>
              <span>{HIZB_LABEL} {toArabicIndic(active?.pageData?.hizbNumber ?? 1)}</span>
            </span>
          </div>

          <div className="ms-auto flex items-baseline gap-[0.3em] text-muted-foreground">
            <span className="text-[0.82em]">صفحة</span>
            <b className="text-[1.05em] font-bold text-foreground [font-variant-numeric:tabular-nums]">
              {toArabicIndic(active?.pageNumber ?? pages[0]?.pageNumber ?? 1)}
            </b>
          </div>
        </div>
      </header>

      
      <div className="flex flex-wrap items-center justify-between gap-3 border p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/quran')}>
            <List className="size-4" data-icon="inline-start" />
            <span>فهرس السور</span>
          </Button>

          <select
            value={sura.number}
            onChange={(e) => router.push(`/quran?surah=${e.target.value}`)}
            aria-label="اختيار السورة"
            className="h-7 border border-input bg-transparent px-2 text-[0.8rem] font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">
          سورة {sura.name} · <b className="text-foreground">{toArabicIndic(pages.length)}</b> صفحة
        </p>
      </div>

      
      <div ref={containerRef} className="flex flex-col">
        {pages.map((entry, i) => (
          <div
            key={entry.pageNumber}
            className="flex flex-col [break-inside:avoid]"
            data-page-block={i}
          >
            <MushafPageInteraction
              pageNumber={entry.pageNumber}
              selectedKey={selectedKey}
              onSelect={handleSelect}
              bookmarkedKeys={bookmarkedKeys}
              notedKeys={notedKeys}
              onTafsir={handleTafsir}
              onToggleBookmark={handleToggleBookmark}
              onNote={handleNote}
              onSimilar={handleSimilar}
              onPlay={handlePlayAyah}
              onImage={handleImage}
              exportRange={exportRange}
              audioKey={audioCore.currentAyah}
            >
              <QuranPageRenderer
                pageData={entry.pageData}
                layout={entry.layout}
                surahName={sura.name}
                showFooter={false}
                showHeader={false}
              />
            </MushafPageInteraction>

            
            <div
              className="flex items-center justify-center gap-[0.4em] pt-[0.85em] text-muted-foreground [font-family:var(--font-amiri),'Amiri_Quran',Cairo,serif]"
              aria-label={`صفحة ${toArabicIndic(entry.pageNumber)}`}
            >
              <span className="text-[0.85em]">صفحة</span>
              <b className="text-[1.05em] font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                {toArabicIndic(entry.pageNumber)}
              </b>
            </div>

            
            {i < pages.length - 1 && (
              <div
                className="mx-auto mt-[1.4em] mb-[0.4em] w-full max-w-[70%] border-t border-border opacity-60"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      
      <QuranStudyPanel
        open={panelOpen}
        selectedAyah={selectedAyah}
        surahName={sura.name}
        onClose={handlePanelClose}
      />

      
      {noteAyah && (
        <AyahNoteEditor
          ayah={noteAyah}
          surahName={sura.name}
          onClose={() => setNoteAyah(null)}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
        />
      )}

      
      <QuranAudioPlayer surahs={surahs} surahName={sura.name} />

      
      {similarAyah && (
        <QuranSimilarPanel
          ayah={similarAyah}
          surahName={surahs.find((s) => s.number === similarAyah.surah)?.name ?? sura.name}
          surahs={surahs}
          onClose={() => setSimilarAyah(null)}
        />
      )}

      
      {exportAyah && (
        <AyahImageExport
          ayah={exportAyah}
          surahName={sura.name}
          numberOfAyahs={sura.numberOfAyahs}
          pages={pages}
          onRangeChange={setExportRange}
          onClose={() => {
            setExportAyah(null)
            setExportRange(null)
          }}
        />
      )}
    </div>
  )
}
