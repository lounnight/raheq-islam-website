

export type MushafLocation = string

export type MushafWordGlyphs = {

  qpc1?: string
  qpc2?: string
}

export type MushafLayoutWord = {
  location: MushafLocation
  surah: number
  verse: number
  word: number

  position: number

  text: string
  endOfVerse: boolean

  marker?: string | null
  glyphs: MushafWordGlyphs
}

export type VerseRange = {
  start: { surah: number; verse: number }
  end: { surah: number; verse: number }
}


export type MushafTextLayoutLine = {
  line: number
  type: 'text'
  verseRange: VerseRange
  text: string
  words: MushafLayoutWord[]
}


export type MushafSurahHeaderLayoutLine = {
  line: number
  type: 'surah-header'
  surah: number
  text: string
}

export type MushafBasmalaLayoutLine = {
  line: number
  type: 'basmala'
  text?: string
  glyphs?: MushafWordGlyphs
  words?: MushafLayoutWord[]
}

export type MushafLayoutLine =
  | MushafTextLayoutLine
  | MushafSurahHeaderLayoutLine
  | MushafBasmalaLayoutLine

export type MushafPageLayout = {
  page: number
  lines: MushafLayoutLine[]
}

export type SurahMeta = {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
  startPage?: number
}

export type PageDataMeta = {
  surah: number
  start: number
  end: number
}

export type JuzMeta = {
  id: number
  surahs: number[]
  verses: Record<string, [number, number]>
}

export type QuarterMeta = {
  surah: number
  ayah: number
}

export type SajdahMeta = {
  surah: number
  ayah: number
}

export type QuranVerseText = {
  surah_number: number
  verse_number: number
  qcfData: string
  content: string
}

export type MadinahPageRange = {
  surah: number
  start: number
  end: number
}

export type MadinahPage = {
  page: number
  ranges: MadinahPageRange[]
}

export type QuranPageData = {
  pageNumber: number
  verses: QuranVerseText[]
  surahHeaderInfo: {
    surahNumber: number
    name: string
    englishName: string
    revelationType: string
    numberOfAyahs: number
    isStartOfSurah: boolean
  }[]
  juzNumber: number

  hizbNumber?: number
  hizbQuarter?: number
  hasSajdah: boolean
}

export type TafsirEntry = {
  key: string

  surah: number

  aya: number

  text: string
}
