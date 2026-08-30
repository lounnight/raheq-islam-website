import { NextRequest, NextResponse } from 'next/server'
import { getSurahs, getQuranPageData } from '@/services/quran-service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const pageStr = searchParams.get('page')
  const surahStr = searchParams.get('surah')

  try {
    if (pageStr) {
      const pageNum = parseInt(pageStr, 10)
      if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
        return NextResponse.json({ error: 'Invalid page number' }, { status: 400 })
      }
      const data = await getQuranPageData(pageNum)
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        }
      })
    }

    if (surahStr) {
      const surahs = await getSurahs()
      const sNum = parseInt(surahStr, 10)
      const surah = surahs.find((s) => s.number === sNum)
      if (!surah) {
        return NextResponse.json({ error: 'Surah not found' }, { status: 404 })
      }
      return NextResponse.json(surah)
    }

    const surahs = await getSurahs()
    return NextResponse.json(surahs, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Quran data' }, { status: 500 })
  }
}
