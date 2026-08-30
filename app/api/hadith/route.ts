import { NextRequest, NextResponse } from 'next/server'
import {
  getBooks,
  getBook,
  getChapters,
  getHadith,
  getHadiths,
  searchHadith,
  getRandomHadith,
} from '@/services/hadith'
import { AVAILABLE_BOOKS } from '@/services/hadith/fawaz-api'
import { getCuratedHadithForDate } from '@/data/hadith'

type ErrorBody = { error: true; message: string }

function badRequest(message: string): NextResponse<ErrorBody> {
  return NextResponse.json({ error: true, message }, { status: 400 })
}

function upstreamFailure(): NextResponse<ErrorBody> {
  return NextResponse.json(
    { error: true, message: 'Unable to fetch Hadith data' },
    { status: 502 },
  )
}

function internalError(): NextResponse<ErrorBody> {
  return NextResponse.json(
    { error: true, message: 'Internal server error' },
    { status: 500 },
  )
}

function isAvailableBook(value: string | null): value is string {
  return value !== null && (AVAILABLE_BOOKS as readonly string[]).includes(value)
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  try {
    if (params.get('curated') === '1' || params.get('curated') === 'true') {
      const hadith = getCuratedHadithForDate()
      return hadith ? NextResponse.json(hadith) : internalError()
    }

    if (params.get('random') === '1' || params.get('random') === 'true') {
      const hadith = await getRandomHadith()
      return hadith
        ? NextResponse.json(hadith)
        : internalError()
    }

    const book = params.get('book')
    const bookOk = book ? isAvailableBook(book) : true

    const search = params.get('search')
    if (search !== null) {
      const trimmed = search.trim()
      if (!trimmed) return badRequest('Search query is empty')
      if (!bookOk) return badRequest('Unknown book')
      const results = await searchHadith(trimmed, book ?? undefined)
      return NextResponse.json(results)
    }

    if (params.get('chapters') !== null) {
      if (!bookOk || !book) return badRequest('Book is required for chapters')
      const chapters = await getChapters(book)
      return NextResponse.json(chapters)
    }

    const numberParam = params.get('hadithNumber')
    if (numberParam !== null) {
      if (!bookOk || !book) return badRequest('Book is required for a hadith number')
      const hadithNumber = parseInt(numberParam, 10)
      if (Number.isNaN(hadithNumber) || hadithNumber <= 0) {
        return badRequest('Invalid hadith number')
      }
      const hadith = await getHadith(book, hadithNumber)
      return hadith ? NextResponse.json(hadith) : badRequest('Hadith not found')
    }

    if (book && bookOk && (params.get('page') !== null || params.get('chapter') !== null)) {
      const page = parseInt(params.get('page') ?? '1', 10)
      const limitRaw = parseInt(params.get('limit') ?? '25', 10)
      const chapter = params.get('chapter') ?? undefined
      const list = await getHadiths(
        book,
        chapter,
        Number.isNaN(page) || page < 1 ? 1 : page,
        Number.isNaN(limitRaw) || limitRaw < 1 ? 25 : Math.min(limitRaw, 50),
      )
      return NextResponse.json(list)
    }

    if (book) {
      if (!bookOk) return badRequest('Unknown book')
      const single = await getBook(book)
      return single ? NextResponse.json(single) : badRequest('Book not found')
    }

    const books = await getBooks()
    return NextResponse.json(books)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('Fawaz')) {
      return upstreamFailure()
    }
    return internalError()
  }
}

export async function POST() {
  return NextResponse.json({ error: true, message: 'Method Not Allowed' }, { status: 405 })
}