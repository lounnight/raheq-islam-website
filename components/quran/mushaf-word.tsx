'use client'

import type { MushafLayoutWord } from '@/types/quran'

type MushafWordProps = {
  word: MushafLayoutWord

  isFirstWord?: boolean
}

export function MushafWord({ word, isFirstWord }: MushafWordProps) {
  const glyphs = word.glyphs?.qpc2 || word.glyphs?.qpc1
  const content = glyphs ?? word.text

  const displayContent = isFirstWord && content.length > 1
    ? content[0] + ' ' + content.slice(1)
    : content

  return (
    <span
      className="mushaf-word"
      data-location={word.location}
      data-surah={word.surah}
      data-verse={word.verse}
      data-word={word.word}
      {...(word.endOfVerse ? { 'data-end-of-verse': '' } : {})}
    >
      {displayContent}
    </span>
  )
}

export function MushafWordRun({
  words,
  firstWordLocation,
}: {
  words: MushafLayoutWord[]
  firstWordLocation: string | null
}) {
  const groups: { surah: number; verse: number; words: MushafLayoutWord[] }[] = []
  for (const w of words) {
    const last = groups[groups.length - 1]
    if (last && last.surah === w.surah && last.verse === w.verse) {
      last.words.push(w)
    } else {
      groups.push({ surah: w.surah, verse: w.verse, words: [w] })
    }
  }

  return (
    <>
      {groups.map((group) => (
        <span
          key={`${group.surah}:${group.verse}:${group.words[0].location}`}
          className="mushaf-ayah"
          data-surah={group.surah}
          data-verse={group.verse}
        >
          {group.words.map((w) => (
            <MushafWord
              key={w.location}
              word={w}
              isFirstWord={w.location === firstWordLocation}
            />
          ))}
        </span>
      ))}
    </>
  )
}

