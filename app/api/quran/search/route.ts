import { NextRequest, NextResponse } from 'next/server'
import { searchQuran } from '@/services/quran-search-service'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const query = q.trim()
  if (!query) {
    return NextResponse.json({ surahs: [], ayahs: [] })
  }
  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  try {
    const results = await searchQuran(query)
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Quran search is temporarily unavailable' },
      { status: 502 },
    )
  }
}
