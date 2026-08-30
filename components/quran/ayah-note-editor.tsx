'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import type { AyahRef } from '@/components/quran/mushaf-page-interaction'
import { ayahKey, getAyahNote } from '@/lib/ayah-storage'
import { toArabicIndic } from './mushaf-utils'

export interface AyahNoteEditorProps {
  ayah: AyahRef

  surahName: string
  onClose: () => void

  onSave: (ayah: AyahRef, text: string) => void
  onDelete: (ayah: AyahRef) => void
}

export function AyahNoteEditor({ ayah, surahName, onClose, onSave, onDelete }: AyahNoteEditorProps) {
  const key = ayahKey(ayah.surah, ayah.verse)
  const existing = getAyahNote(key)
  const [text, setText] = useState(existing?.text ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const trimmed = text.trim()
  const hasExisting = existing !== null

  const handleSave = () => {
    if (!trimmed) return
    onSave(ayah, trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && trimmed) {
      handleSave()
    }
  }

  return (
    <div className="ayah-note-backdrop fixed inset-0 z-[70] grid place-items-center p-[1rem] [background:rgb(0_0_0/0.4)]" onClick={onClose}>
      <div
        className="ayah-note-modal flex w-[min(92vw,26rem)] flex-col gap-[0.75rem] rounded-[0.75rem] border border-border bg-popover p-[1rem] text-popover-foreground shadow-[0_16px_48px_-12px_rgb(0_0_0/0.35)] [animation:ayah-menu-in_0.15s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={`ملاحظة على الآية ${toArabicIndic(ayah.verse)}`}
        data-ayah-key={key}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <header className="flex items-center justify-between gap-[0.5rem]">
          <h2 className="m-0 text-[0.85rem] font-bold">
            ملاحظة · سورة {surahName} · آية {toArabicIndic(ayah.verse)}
          </h2>
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-[0.45rem] border border-transparent bg-transparent text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
            aria-label="إغلاق محرر الملاحظة"
          >
            <X className="size-[16px]" />
          </button>
        </header>

        <textarea
          ref={textareaRef}
          className="min-h-[6.5rem] w-full resize-y rounded-[0.5rem] border border-border bg-muted px-[0.75rem] py-[0.6rem] text-[0.85rem] text-popover-foreground outline-none [font:inherit]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب ملاحظتك الشخصية على هذه الآية…"
          rows={5}
          aria-label="نص الملاحظة"
        />

        <footer className="flex items-center gap-[0.5rem]">
          {hasExisting && (
            <button
              type="button"
              className="cursor-pointer rounded-[0.45rem] border border-[color-mix(in_oklab,var(--destructive)_40%,transparent)] bg-muted px-[0.8rem] py-[0.35rem] text-[0.78rem] font-semibold text-destructive transition-colors duration-100 hover:bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] hover:text-destructive"
              onClick={() => onDelete(ayah)}
            >
              حذف الملاحظة
            </button>
          )}
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
            disabled={!trimmed}
          >
            حفظ
          </button>
        </footer>
      </div>
    </div>
  )
}
