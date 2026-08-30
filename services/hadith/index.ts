import { AVAILABLE_BOOKS } from './fawaz-api'
import * as fawaz from './fawaz-api'
import type {
  Hadith,
  HadithBook,
  HadithChapter,
  HadithList,
  HadithSearchResult,
} from '@/types/hadith'

export const HADITH_PAGE_SIZE = 25

export async function getBooks(): Promise<HadithBook[]> {
  const books = await fawaz.fetchBooks()
  const byId = new Map(books.map((b) => [b.id, b]))
  return AVAILABLE_BOOKS.map((id) => byId.get(id)
    ?? { id, nameAr: id, nameEn: id, totalHadiths: 0, hasArabic: true })
}

export async function getBook(bookId: string): Promise<HadithBook | null> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) return null
  try {
    return await fawaz.fetchBook(bookId)
  } catch {
    return null
  }
}

export async function getChapters(bookId: string): Promise<HadithChapter[]> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) return []
  try {
    return await fawaz.fetchChapters(bookId)
  } catch {
    return []
  }
}

export async function getHadith(
  bookId: string,
  hadithNumber: number,
): Promise<Hadith | null> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) return null
  const book = await getBook(bookId)
  return fawaz.fetchHadith(bookId, hadithNumber, book?.nameAr)
}

export async function getHadiths(
  bookId: string,
  chapterId?: string,
  page = 1,
  limit = HADITH_PAGE_SIZE,
): Promise<HadithList> {
  if (!(AVAILABLE_BOOKS as readonly string[]).includes(bookId)) {
    return { items: [], total: 0, page, pages: 1 }
  }
  const book = await getBook(bookId)
  return fawaz.fetchHadiths(bookId, chapterId, page, limit, book?.nameAr)
}

export async function searchHadith(
  query: string,
  bookId?: string,
): Promise<HadithSearchResult> {
  return fawaz.fetchSearch(query, bookId)
}

export async function getRandomHadith(): Promise<Hadith | null> {
  const books = await getBooks()
  if (books.length === 0) return null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const book = books[Math.floor(Math.random() * books.length)]
    const max = book.totalHadiths
    if (max <= 0) continue
    const number = 1 + Math.floor(Math.random() * max)
    const hadith = await fawaz.fetchHadith(book.id, number, book.nameAr)
    if (hadith) return hadith
  }
  return null
}
