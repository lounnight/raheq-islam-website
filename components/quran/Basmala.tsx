'use client'

import { useTheme } from '@/components/theme-provider'

export function BasmalaSvg({ theme: forcedTheme }: { theme?: 'light' | 'dark' } = {}) {
  const { theme: siteTheme } = useTheme()
  const theme = forcedTheme ?? siteTheme

  const filterStyle =
    theme === 'dark' ? { filter: 'brightness(0) invert(1)' } : { filter: 'brightness(0)' }

  return (
    <img
      src="/bismillah.svg"
      alt="بسم الله الرحمن الرحيم"
      className="mushaf-basmala-image inline-block h-[1.35em] w-auto align-middle opacity-[0.92]"
      style={{ ...filterStyle }}
      width={220}
      height={45}
      loading="lazy"
      decoding="async"
    />
  )
}
