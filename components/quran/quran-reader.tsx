'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, ArrowRight, List } from 'lucide-react'

import { useRouter, useSearchParams } from 'next/navigation'
import type { QuranPageData, SurahMeta, MushafPageLayout } from '@/types/quran'
import { getMushafPageLayout } from '@/services/quran/mushaf-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuranPageRenderer } from './quran-page-renderer'


type QuranReaderProps = {
  initialPageData: QuranPageData

  initialLayout: MushafPageLayout | null
  surahs: SurahMeta[]
}

export function QuranReader({ initialPageData, initialLayout, surahs }: QuranReaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentPage, setCurrentPage] = useState<number>(initialPageData.pageNumber)
  const [pageData, setPageData] = useState<QuranPageData>(initialPageData)
  const [layout, setLayout] = useState<MushafPageLayout | null>(initialLayout)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [inputPage, setInputPage] = useState<string>(String(initialPageData.pageNumber))
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false)

  const loadPage = useCallback(async (page: number) => {
    const clamped = Math.max(1, Math.min(604, page))
    setIsLoading(true)
    try {
      const res = await fetch(`/api/quran?page=${clamped}`)
      if (res.ok) {
        const data: QuranPageData = await res.json()
        setPageData(data)
        setCurrentPage(clamped)
        setInputPage(String(clamped))

        window.history.replaceState(null, '', `/quran?page=${clamped}`)
      }
      try {
        const nextLayout = await getMushafPageLayout(clamped)
        setLayout(nextLayout)
      } catch (err) {
        console.error('Failed to load mushaf layout', err)
        setLayout(null)
      }
    } catch (err) {
      console.error('Failed to load page', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNextPage = () => {
    if (currentPage < 604) {
      loadPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadPage(currentPage - 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handlePrevPage()
      } else if (e.key === 'ArrowLeft') {
        handleNextPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage])

  const currentSurahName = useMemo(() => {
    if (!pageData.verses.length) return ''
    const sNum = pageData.verses[0].surah_number
    const surah = surahs.find((s) => s.number === sNum)
    return surah ? `سورة ${surah.name}` : ''
  }, [pageData, surahs])

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      
      <div className="flex flex-wrap items-center justify-between gap-3 border p-3">
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/quran')}>
            <List className="size-4" data-icon="inline-start" />
            <span>فهرس السور</span>
          </Button>

          <select
            value={pageData.verses[0]?.surah_number || 1}
            onChange={(e) => {
              const targetSurahNum = parseInt(e.target.value, 10)
              const s = surahs.find((item) => item.number === targetSurahNum)
              if (s && s.startPage) {
                loadPage(s.startPage)
              }
            }}
            aria-label="اختيار السورة"
            className="h-7 border border-input bg-transparent px-2 text-[0.8rem] font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {surahs.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. سورة {s.name} (صفحة {s.startPage})
              </option>
            ))}
          </select>
        </div>

        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const p = parseInt(inputPage, 10)
            if (!isNaN(p)) loadPage(p)
          }}
          className="flex items-center gap-2"
          dir="rtl"
        >
          <span className="text-xs text-muted-foreground">انتقل إلى صفحة:</span>
          <Input
            type="number"
            min={1}
            max={604}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            aria-label="رقم الصفحة"
            className="w-16 px-1 text-center"
          />
          <Button type="submit" size="sm">انتقال</Button>
          <span className="text-xs text-muted-foreground">من 604</span>
        </form>
      </div>

      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-background/75 backdrop-blur-sm">
            <span className="animate-pulse text-sm font-semibold text-muted-foreground">
              جاري تحميل الصفحة...
            </span>
          </div>
        )}
        <QuranPageRenderer
          key={pageData.pageNumber}
          pageData={pageData}
          layout={layout}
          surahName={currentSurahName}
        />
      </div>

      
      <div className="flex items-center justify-between border-t px-4 py-3">
        
        <Button variant="outline" onClick={handleNextPage} disabled={currentPage >= 604 || isLoading}>
          <ArrowLeft className="size-4" data-icon="inline-start" />
          <span>التالية</span>
        </Button>

        
        <p className="text-sm tabular-nums text-muted-foreground">
          <span className="font-bold text-foreground">{currentPage}</span> / 604
        </p>

        
        <Button variant="outline" onClick={handlePrevPage} disabled={currentPage <= 1 || isLoading}>
          <span>السابقة</span>
          <ArrowRight className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}