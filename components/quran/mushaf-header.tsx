'use client'

import { JUZ_LABEL, HIZB_LABEL, toArabicIndic } from './mushaf-utils'

type MushafHeaderProps = {
  juzNumber: number

  hizbNumber?: number
  pageNumber: number
  surahTitle: string
}

export function MushafHeader({
  juzNumber,
  hizbNumber,
  pageNumber,
  surahTitle,
}: MushafHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-[0.6em] border-b border-border pb-[0.4em] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
      <div className="flex items-center gap-[0.7em]">
        <div className="flex items-center gap-[0.35em]">
          <span className="text-[0.82em]">{JUZ_LABEL}&nbsp;</span>
          <b className="text-[1em]">{toArabicIndic(juzNumber)}</b>
        </div>
        <div className="flex items-center gap-[0.35em]">
          <span className="text-[0.82em]">{HIZB_LABEL}&nbsp;</span>
          <b className="text-[1em]">{hizbNumber ? toArabicIndic(hizbNumber) : '—'}</b>
        </div>
      </div>

      <div className="whitespace-nowrap text-[1.15em] font-semibold">{surahTitle}</div>

      <div className="flex items-center gap-[0.35em]">
        <b className="text-[1em]">{toArabicIndic(pageNumber)}</b>
        <span className="text-[0.82em]">&nbsp;صفحة</span>
      </div>
    </header>
  )
}