

export type HadithBook = {

  id: string

  nameAr: string

  nameEn: string

  totalHadiths: number

  hasArabic: boolean
}


export type HadithChapter = {

  id: string
  titleAr?: string
  titleEn?: string

  hadithsCount?: number
}


export type Hadith = {

  id: string
  bookId: string
  bookName?: string
  hadithNumber: number

  arabic: string

  english?: string
  narrator?: string

  grades?: string[]

  grading?: string
  chapterId?: string
  chapterTitle?: string
  references?: string[]
}


export type HadithList = {
  items: Hadith[]
  total: number
  page: number

  pages: number
}


export type HadithSearchResult = {
  items: Hadith[]
  total: number
}