import type {
  MushafPageLayout,
  MushafTextLayoutLine,
  QuranPageData,
} from '@/types/quran'

export function filterMushafPageToSurah(
  layout: MushafPageLayout,
  surahNumber: number
): MushafPageLayout {
  const lines: MushafPageLayout['lines'] = []
  let openSurah: number | null = null

  for (const line of layout.lines) {
    switch (line.type) {
      case 'surah-header':
        openSurah = line.surah
        if (line.surah === surahNumber) lines.push(line)
        break

      case 'basmala':
        if (openSurah === surahNumber) lines.push(line)
        break

      case 'text':
      default: {
        const textLine = line as MushafTextLayoutLine
        const words = textLine.words.filter((w) => w.surah === surahNumber)
        if (words.length === 0) break
        const first = words[0]
        const last = words[words.length - 1]
        lines.push({
          ...textLine,
          words,
          text: words.map((w) => w.glyphs.qpc2 ?? '').join(''),
          verseRange: {
            start: { surah: first.surah, verse: first.verse },
            end: { surah: last.surah, verse: last.verse },
          },
        })
        break
      }
    }
  }

  return { page: layout.page, lines }
}


export function filterPageDataToSurah(
  data: QuranPageData,
  surahNumber: number
): QuranPageData {
  return {
    ...data,
    verses: data.verses.filter((v) => v.surah_number === surahNumber),
    surahHeaderInfo: data.surahHeaderInfo.filter((h) => h.surahNumber === surahNumber),
  }
}

export function getVerseStarts(
  layout: MushafPageLayout
): Array<{ surah: number; verse: number }> {
  const seen = new Set<string>()
  const out: Array<{ surah: number; verse: number }> = []
  for (const line of layout.lines) {
    if (line.type !== 'text') continue
    for (const w of line.words) {
      if (w.word !== 1) continue
      const key = `${w.surah}:${w.verse}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ surah: w.surah, verse: w.verse })
    }
  }
  return out
}
