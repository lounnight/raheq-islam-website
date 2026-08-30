'use client'

import { BISMILLAH, shouldShowBismillah } from './mushaf-utils'

export type SurahHeading = {
  surahNumber: number
  name: string
}

type MushafSurahHeadingProps = {
  headings: SurahHeading[]

  showBismillah?: boolean
}

export function MushafSurahHeading({ headings, showBismillah = true }: MushafSurahHeadingProps) {
  return (
    <div className="px-[0.5em] pb-[0.3em] pt-[0.6em] text-center">
      {headings.map((h) => (
        <div key={h.surahNumber} className="inline-flex items-center">
          <span className="mushaf-surah-title inline-block text-[1.3em] font-bold leading-[1.6] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
            سورة {h.name}
          </span>
        </div>
      ))}

      {showBismillah &&
        headings.length > 0 &&
        headings.some((h) => shouldShowBismillah(h.surahNumber)) && (
          <div className="mt-[0.2em] text-[1.15em] font-medium leading-[1.5] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
            {BISMILLAH}
          </div>
        )}
    </div>
  )
}