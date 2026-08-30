'use client'

import { toArabicIndic } from './mushaf-utils'

type MushafFooterProps = {
  pageNumber: number
}

export function MushafFooter({ pageNumber }: MushafFooterProps) {
  return (
    <footer className="flex items-center justify-center border-t border-border pt-[0.5em]">
      <span className="line hidden" />
      <span className="pagebox text-[0.9em] font-semibold">{toArabicIndic(pageNumber)}</span>
      <span className="line r hidden" />
    </footer>
  )
}