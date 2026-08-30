import { notFound } from 'next/navigation'
import { HadithBookPage } from '@/components/hadith/hadith-book'
import { getBook, getChapters } from '@/services/hadith'
import type { HadithBook, HadithChapter } from '@/types/hadith'

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params

  const [book, chapters] = await Promise.all([
    getBook(bookId)
      .then((b) => ({ value: b, error: false }))
      .catch(() => ({ value: null as HadithBook | null, error: true })),
    getChapters(bookId)
      .then((c) => ({ value: c, error: false }))
      .catch(() => ({ value: [] as HadithChapter[], error: true })),
  ])

  if (!book.value && !book.error) {
    notFound()
  }

  return (
    <HadithBookPage
      bookId={bookId}
      book={book.value}
      bookError={book.error}
      chapters={chapters.value}
      chaptersError={chapters.error}
    />
  )
}
