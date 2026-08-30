import { HadithBrowse } from '@/components/hadith/hadith-browse'
import { getBooks } from '@/services/hadith'
import type { HadithBook } from '@/types/hadith'

export const revalidate = 86_400

export default async function HadithPage() {
  let books: HadithBook[] = []
  let error = false
  try {
    books = await getBooks()
  } catch {
    error = true
  }

  return <HadithBrowse initialBooks={books} hasError={error} />
}
