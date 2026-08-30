'use client'

import type { MushafLayoutLine } from '@/types/quran'
import { MushafWordRun } from './mushaf-word'
import { BasmalaSvg } from './Basmala'

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
          className="mushaf-line m-0 w-full overflow-x-visible whitespace-nowrap text-center font-semibold [direction:rtl] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]"
          data-line={line.line}
        >
          <span className="mushaf-surah-title inline-block text-[1.3em] font-bold leading-[1.6] [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
            {line.text}
          </span>
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
            <BasmalaSvg color="var(--foreground)" />
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