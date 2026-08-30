'use client'

import type { MushafPageLayout } from '@/types/quran'
import { MushafLine } from './mushaf-line'

type MushafTextProps = {
  layout: MushafPageLayout
  fontFamily: string
  lineHeight?: number
}

export function MushafText({ layout, fontFamily, lineHeight }: MushafTextProps) {
  if (layout.lines.length === 0) return null

  let firstWordLocation: string | null = null
  for (const line of layout.lines) {
    if (line.type === 'text' && 'words' in line && line.words.length > 0) {
      firstWordLocation = line.words[0].location
      break
    }
  }

  return (
    <div
      className="mushaf-text mushaf-text-lines text-right text-foreground hyphens-none"
      dir="rtl"
      style={{ fontFamily, lineHeight }}
    >
      {layout.lines.map((line) => (
        <MushafLine
          key={line.line}
          line={line}
          firstWordLocation={firstWordLocation}
        />
      ))}
    </div>
  )
}
