import { NextResponse } from 'next/server'
import { getQuestions } from '@/data/questions'

export async function GET() {
  try {
    const { questions, stats } = await getQuestions()
    return NextResponse.json(
      { questions, stats },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      }
    )
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
