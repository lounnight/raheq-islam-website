import { redirect } from 'next/navigation'

export default async function QuranSurahRedirect({
  params
}: {
  params: Promise<{ surahId: string }>
}) {
  const { surahId } = await params
  const sNum = parseInt(surahId, 10)
  redirect(`/quran?surah=${sNum}`)
}
