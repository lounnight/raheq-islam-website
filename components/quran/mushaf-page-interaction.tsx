'use client'

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { AyahActionMenu } from './ayah-action-menu'
import type { AnchorRect } from '@/lib/ayah-menu-position'

export interface AyahWordTarget {
  closest(selector: string): AyahWordTarget | null
  getAttribute(name: string): string | null
}

export interface AyahRef {
  surah: number
  verse: number
}

export function resolveAyahFromTarget(
  target: AyahWordTarget | null | undefined
): AyahRef | null {
  if (!target) return null
  const word = target.closest('.mushaf-word')
  if (!word) return null
  const surahStr = word.getAttribute('data-surah')
  const verseStr = word.getAttribute('data-verse')
  const surah = surahStr ? Number.parseInt(surahStr, 10) : NaN
  const verse = verseStr ? Number.parseInt(verseStr, 10) : NaN
  if (!Number.isFinite(surah) || !Number.isFinite(verse)) return null
  return { surah, verse }
}

export type AyahSelectHandler = (ayah: AyahRef) => void

export type AyahClickHandler = (ayah: AyahRef | null) => void

export interface MushafPageInteractionProps {

  pageNumber: number

  selectedKey: string | null

  onSelect: AyahClickHandler

  bookmarkedKeys: ReadonlySet<string>

  notedKeys: ReadonlySet<string>

  onTafsir: AyahSelectHandler

  onToggleBookmark: AyahSelectHandler
  onNote: AyahSelectHandler

  onSimilar: AyahSelectHandler

  onPlay: AyahSelectHandler

  onImage: AyahSelectHandler
  exportRange?: { from: number; to: number } | null

  audioKey: string | null
  children: ReactNode
}

export function MushafPageInteraction({
  pageNumber,
  selectedKey,
  onSelect,
  bookmarkedKeys,
  notedKeys,
  onTafsir,
  onToggleBookmark,
  onNote,
  onSimilar,
  onPlay,
  onImage,
  exportRange,
  audioKey,
  children,
}: MushafPageInteractionProps) {
  const regionRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const prevHoverRef = useRef<string | null>(null)

  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const [menuAyah, setMenuAyah] = useState<AyahRef | null>(null)
  const anchorRef = useRef<AnchorRect | null>(null)

  const openMenu = (ayah: AyahRef, wordEl: Element | null) => {
    anchorRef.current = wordEl?.getBoundingClientRect() ?? null
    setMenuAyah(ayah)
  }

  const dismissMenu = () => {
    setMenuAyah(null)
    anchorRef.current = null
  }

  useEffect(() => {
    if (!menuAyah) return
    const onScroll = () => dismissMenu()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true })
  }, [menuAyah])

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (typeof target.closest === 'function' && target.closest('.ayah-action-menu')) return

    const ayah = resolveAyahFromTarget(target as unknown as AyahWordTarget)
    const next = ayah ? `${ayah.surah}:${ayah.verse}` : null

    if (next !== prevHoverRef.current) {
      prevHoverRef.current = next
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = window.requestAnimationFrame(() => setHoverKey(next))
    }
  }

  const onClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as Element
    if (typeof target.closest === 'function' && target.closest('.ayah-action-menu')) return

    const wordEl = target.closest?.('.mushaf-word') ?? null
    const ayah = resolveAyahFromTarget(target as unknown as AyahWordTarget)
    if (ayah) {
      onSelect(ayah)
      openMenu(ayah, wordEl)
    } else {
      onSelect(null)
      dismissMenu()
    }
  }

  useEffect(() => {
    const region = regionRef.current
    if (!region) return
    region
      .querySelectorAll('.mushaf-word--hover')
      .forEach((w) => w.classList.remove('mushaf-word--hover'))
    if (hoverKey) {
      const [s, v] = hoverKey.split(':')
      region
        .querySelectorAll(`.mushaf-word[data-surah="${s}"][data-verse="${v}"]`)
        .forEach((w) => w.classList.add('mushaf-word--hover'))
    }
  }, [hoverKey])

  useEffect(() => {
    const region = regionRef.current
    if (!region) return
    region
      .querySelectorAll('.mushaf-ayah--selected')
      .forEach((w) => w.classList.remove('mushaf-ayah--selected'))
    if (selectedKey) {
      const [s, v] = selectedKey.split(':')
      region
        .querySelectorAll(`.mushaf-ayah[data-surah="${s}"][data-verse="${v}"]`)
        .forEach((w) => w.classList.add('mushaf-ayah--selected'))
    }
  }, [selectedKey, pageNumber])

  useEffect(() => {
    const region = regionRef.current
    if (!region) return
    region
      .querySelectorAll('.mushaf-ayah--reciting')
      .forEach((w) => w.classList.remove('mushaf-ayah--reciting'))
    if (audioKey) {
      const [s, v] = audioKey.split(':')
      region
        .querySelectorAll(`.mushaf-ayah[data-surah="${s}"][data-verse="${v}"]`)
        .forEach((w) => w.classList.add('mushaf-ayah--reciting'))
    }
  }, [audioKey, pageNumber])


  useEffect(() => {
    const region = regionRef.current
    if (!region) return
    region
      .querySelectorAll('.mushaf-ayah--export-range')
      .forEach((w) => w.classList.remove('mushaf-ayah--export-range'))
    if (exportRange) {
      const { from, to } = exportRange
      region
        .querySelectorAll('.mushaf-ayah[data-surah]')
        .forEach((w) => {
          const verse = Number.parseInt(w.getAttribute('data-verse') ?? '', 10)
          if (Number.isFinite(verse) && verse >= from && verse <= to) {
            w.classList.add('mushaf-ayah--export-range')
          }
        })
    }
  }, [exportRange, pageNumber])

  const anchor = anchorRef.current
  const menuKey = menuAyah ? `${menuAyah.surah}:${menuAyah.verse}` : null

  return (
    <div
      ref={regionRef}
      className="mushaf-page-interaction cursor-default"
      data-page={pageNumber}
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      {children}

      {menuAyah && anchor && (
        <AyahActionMenu
          ayah={menuAyah}
          anchor={anchor}
          bookmarked={bookmarkedKeys.has(menuKey ?? '')}
          hasNote={notedKeys.has(menuKey ?? '')}
          onTafsir={(ayah) => {
            dismissMenu()
            onTafsir(ayah)
          }}
          onToggleBookmark={(ayah) => {
            onToggleBookmark(ayah)
          }}
          onNote={(ayah) => {
            dismissMenu()
            onNote(ayah)
          }}
          onSimilar={(ayah) => {
            dismissMenu()
            onSimilar(ayah)
          }}
          onPlay={onPlay}
          onImage={(ayah) => {
            dismissMenu()
            onImage(ayah)
          }}
          isAyahPlaying={audioKey !== null && audioKey === menuKey}
          onDismiss={dismissMenu}
        />
      )}
    </div>
  )
}
