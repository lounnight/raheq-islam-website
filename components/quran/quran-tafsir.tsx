'use client'

import type { TafsirEntry } from '@/types/quran'
import { toArabicIndic } from './mushaf-utils'

type QuranTafsirProps = {
  entries: TafsirEntry[]
}

export function QuranTafsir({ entries }: QuranTafsirProps) {
  if (!entries.length) return null

  return (
    <section
      className="mt-[1.4em] rounded-[0.625rem] border border-border bg-muted p-[1em_1.1em] text-right leading-[1.9] text-muted-foreground max-[480px]:p-[0.85em_0.75em] [font-family:var(--font-arabic),'Amiri_Quran',Cairo,serif]"
      aria-label="التفسير الميسر"
      dir="rtl"
      lang="ar"
    >
      <span className="mb-[0.75em] block text-[0.85em] font-bold text-foreground opacity-[0.75] [letter-spacing:0.01em]">
        التفسير الميسّر
      </span>
      {entries.map((entry) => (
        <article
          key={entry.key}
          className="quran-tafsir-block flex items-start gap-[0.75em] [&+&]:mt-[1em] [&+&]:border-t [&+&]:border-dashed [&+&]:border-border [&+&]:pt-[1em]"
          data-verse-key={entry.key}
        >
          <span className="flex min-w-[3.2em] shrink-0 basis-auto items-baseline justify-center gap-[0.25em] rounded-[0.375rem] border border-border bg-background px-[0.35em] py-[0.1em] text-muted-foreground max-[480px]:min-w-[2.6em] [font-variant-numeric:tabular-nums]">
            <span className="text-[0.68em]">الآية</span>
            <b className="text-[0.8em] text-foreground">{toArabicIndic(entry.aya)}</b>
          </span>
          <p className="m-0 text-[0.98em] text-muted-foreground [overflow-wrap:break-word]">
            {entry.text}
          </p>
        </article>
      ))}
    </section>
  )
}