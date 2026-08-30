'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bookmark, BookmarkCheck, BookOpen, Copy, ImageIcon, Pause, Play, SquarePen } from 'lucide-react'

import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import { computeMenuPosition, type AnchorRect } from '@/lib/ayah-menu-position'
import { toArabicIndic } from './mushaf-utils'

export interface AyahActionMenuProps {
  ayah: AyahRef

  anchor: AnchorRect
  bookmarked: boolean
  hasNote: boolean
  onTafsir: (ayah: AyahRef) => void
  onToggleBookmark: (ayah: AyahRef) => void
  onNote: (ayah: AyahRef) => void

  onSimilar: (ayah: AyahRef) => void

  onPlay: (ayah: AyahRef) => void

  onImage: (ayah: AyahRef) => void

  isAyahPlaying: boolean

  onDismiss: () => void
}

export function AyahActionMenu({
  ayah,
  anchor,
  bookmarked,
  hasNote,
  onTafsir,
  onToggleBookmark,
  onNote,
  onSimilar,
  onPlay,
  onImage,
  isAyahPlaying,
  onDismiss,
}: AyahActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(() =>
    computeMenuPosition(anchor, { width: 210, height: 40 }, {
      width: typeof window === 'undefined' ? 1024 : window.innerWidth,
      height: typeof window === 'undefined' ? 768 : window.innerHeight,
    })
  )

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(
      computeMenuPosition(anchor, { width: rect.width, height: rect.height }, {
        width: window.innerWidth,
        height: window.innerHeight,
      })
    )
  }, [anchor])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  const verseLabel = toArabicIndic(ayah.verse)
  const bookmarkLabel = bookmarked ? 'محفوظة — إزالة من المحفوظات' : 'حفظ الآية في المحفوظات'
  const noteLabel = hasNote ? 'ملاحظة — تعديل الملاحظة المحفوظة' : 'ملاحظة — كتابة ملاحظة على الآية'

  const stopAndClose = (fn: (ayah: AyahRef) => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    fn(ayah)
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] flex select-none items-center gap-[2px] rounded-[0.6rem] border border-border p-[3px] text-popover-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0/0.3)] backdrop-blur-[4px] [direction:rtl] [background:color-mix(in_oklab,var(--popover)_96%,transparent)] [animation:ayah-menu-in_0.12s_ease-out]"
      role="toolbar"
      aria-label={`إجراءات الآية ${verseLabel}`}
      data-ayah-key={`${ayah.surah}:${ayah.verse}`}
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onTafsir)}
        title="فتح التفسير والترجمة"
        aria-label={`تفسير الآية ${verseLabel}`}
      >
        <BookOpen className="size-[15px]" aria-hidden="true" />
        <span>تفسير</span>
      </button>

      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onToggleBookmark)}
        title={bookmarkLabel}
        aria-label={`الآية ${verseLabel} — ${bookmarkLabel}`}
        aria-pressed={bookmarked}
        data-bookmarked={bookmarked}
      >
        {bookmarked ? (
          <BookmarkCheck className="size-[15px]" aria-hidden="true" />
        ) : (
          <Bookmark className="size-[15px]" aria-hidden="true" />
        )}
        <span>{bookmarked ? 'محفوظة' : 'حفظ'}</span>
      </button>

      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onNote)}
        title={noteLabel}
        aria-label={`الآية ${verseLabel} — ${noteLabel}`}
        data-has-note={hasNote}
      >
        <SquarePen className="size-[15px]" aria-hidden="true" />
        <span>ملاحظة</span>
        {hasNote && (
          <span
            className="h-[5px] w-[5px] rounded-full bg-primary shadow-[0_0_0_1.5px_var(--popover)]"
            aria-hidden="true"
          />
        )}
      </button>

      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onSimilar)}
        title="عرض الآيات المتشابهة"
        aria-label={`الآية ${verseLabel} — عرض الآيات المتشابهة`}
      >
        <Copy className="size-[15px]" aria-hidden="true" />
        <span>متشابهات</span>
      </button>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onPlay)}
        title={isAyahPlaying ? 'إيقاف مؤقت' : 'استماع لهذه الآية'}
        aria-label={`الآية ${verseLabel} — ${isAyahPlaying ? 'إيقاف التلاوة مؤقتًا' : 'تشغيل التلاوة من هذه الآية'}`}
        aria-pressed={isAyahPlaying}
      >
        {isAyahPlaying ? (
          <Pause className="size-[15px]" aria-hidden="true" />
        ) : (
          <Play className="size-[15px]" aria-hidden="true" />
        )}
        <span>{isAyahPlaying ? 'إيقاف' : 'استماع'}</span>
      </button>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-[0.3rem] rounded-[0.4rem] border border-transparent bg-transparent px-[0.55rem] py-[0.3rem] text-[0.75rem] font-semibold leading-none text-inherit transition-colors duration-100 hover:bg-accent hover:text-accent-foreground aria-[pressed=true]:text-primary"
        onClick={stopAndClose(onImage)}
        title="حفظ الآية كصورة"
        aria-label={`الآية ${verseLabel} — حفظ الآية كصورة`}
      >
        <ImageIcon className="size-[15px]" aria-hidden="true" />
        <span>حفظ كصورة</span>
      </button>
    </div>
  )
}
