'use client'

import { shouldShowBismillah } from './mushaf-utils'
import { BasmalaSvg } from './Basmala'
import { SurahNameFrame } from './surah-name-frame'

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
        <SurahNameFrame key={h.surahNumber} name={h.name} />
      ))}

      {showBismillah &&
        headings.length > 0 &&
        headings.some((h) => shouldShowBismillah(h.surahNumber)) && (
          <div className="mt-[0.8em] w-full text-center">
            <BasmalaSvg />
          </div>
        )}
    </div>
  )
}