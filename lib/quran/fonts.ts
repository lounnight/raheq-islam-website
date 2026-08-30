
export const MUSH_CANONICAL_PAGE_COUNT = 604


export const MUSH_UI_FONT =
  "var(--font-amiri), 'Amiri Quran', 'UthmanTN1 Ver10', 'Cairo', serif"


export function pageFontFaceName(pageNumber: number): string {
  return `QCF2${String(pageNumber).padStart(3, '0')}`
}


export function pageFontUrl(pageNumber: number): string {
  return `/fonts/p${pageNumber}.ttf`
}

export function isValidPage(page: number): boolean {
  return page >= 1 && page <= MUSH_CANONICAL_PAGE_COUNT
}