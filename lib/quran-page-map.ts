import { MADINAH_PAGES } from './data/madinah-pages'
import type { MadinahPageRange } from '@/types/quran'
import { MUSH_CANONICAL_PAGE_COUNT } from './quran/fonts'


export const MUSH_TOTAL_PAGES = MUSH_CANONICAL_PAGE_COUNT

const byPage: (MadinahPageRange[] | undefined)[] = MADINAH_PAGES.map((p) => p.ranges)


export function getMadinahPageRanges(page: number): MadinahPageRange[] {
  const clamped = Math.max(1, Math.min(MUSH_TOTAL_PAGES, Math.floor(page)))
  return byPage[clamped - 1] ?? []
}


export function getSurahStartPage(surah: number): number | undefined {
  for (let i = 0; i < MADINAH_PAGES.length; i++) {
    for (const r of MADINAH_PAGES[i].ranges) {
      if (r.surah === surah && r.start === 1) return MADINAH_PAGES[i].page
    }
  }
  return undefined
}

export function getTotalPages(): number {
  return MUSH_TOTAL_PAGES
}

export function getSurahPages(surah: number, totalAyahs: number): number[] {
  const startPage = getSurahStartPage(surah)
  if (startPage === undefined) return []

  let endPage = MADINAH_PAGES.length
  for (const page of MADINAH_PAGES) {
    if (page.ranges.some((r) => r.surah === surah && r.end === totalAyahs)) {
      endPage = page.page
      break
    }
  }

  const pages: number[] = []
  for (let i = startPage; i <= endPage; i++) pages.push(i)
  return pages
}