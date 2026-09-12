'use client'

import type { MushafLayoutLine } from '@/types/quran'
import { MushafWordRun } from './mushaf-word'
import { BasmalaSvg } from './Basmala'
import { SurahNameFrame } from './surah-name-frame'

export function MushafLine({
  line,
  firstWordLocation,
}: {
  line: MushafLayoutLine
  firstWordLocation: string | null
}) {
  switch (line.type) {
    case 'surah-header':
      return (
        <div
          className="mushaf-line m-0 w-full overflow-x-visible whitespace-nowrap text-center [direction:rtl]"
          data-line={line.line}
        >
          <SurahNameFrame name={line.text} />
        </div>
      )
    case 'basmala':
      return (
        <div
          className="mushaf-line m-0 w-full overflow-x-visible whitespace-nowrap text-center [direction:rtl]"
          data-line={line.line}
        >
          {line.words && line.words.length > 0 ? (
            <MushafWordRun words={line.words} firstWordLocation={firstWordLocation} />
          ) : line.glyphs?.qpc2 || line.glyphs?.qpc1 ? (
            <span className="mushaf-line-glyphs">{line.glyphs?.qpc2 || line.glyphs?.qpc1}</span>
          ) : (
            <BasmalaSvg />
          )}
        </div>
      )
    case 'text':
    default:
      return (
        <div
          className="mushaf-line m-0 w-full overflow-x-visible whitespace-nowrap text-center [direction:rtl]"
          data-line={line.line}
        >
          {'words' in line && line.words.length > 0 ? (
            <MushafWordRun words={line.words} firstWordLocation={firstWordLocation} />
          ) : (
            <span className="mushaf-line-plain">{line.text}</span>
          )}
        </div>
      )
  }
}