import { HadithDetailPage } from '@/components/hadith/hadith-detail'
import { getBook } from '@/services/hadith'

export default async function HadithDetail({
  params,
}: {
  params: Promise<{ bookId: string; hadithNumber: string }>
}) {
  const { bookId, hadithNumber } = await params
  const num = parseInt(hadithNumber, 10)

  const initialBook = await getBook(bookId).catch(() => null)

  return <HadithDetailPage bookId={bookId} hadithNumber={Number.isNaN(num) ? 0 : num} initialBook={initialBook} />
}
