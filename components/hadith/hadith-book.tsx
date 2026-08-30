'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { HadithBook, HadithChapter, HadithList } from '@/types/hadith'
import { apiFetch } from './hadith-api-client'

type BookProps = {
  bookId: string
  book?: HadithBook | null
  bookError?: boolean
  chapters: HadithChapter[]
  chaptersError?: boolean
}

type ListState = 'loading' | 'error' | 'ready'

function isValidHadithList(value: unknown): value is HadithList {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as HadithList).items) &&
    typeof (value as HadithList).pages === 'number'
  )
}

export function HadithBookPage({ bookId, book, bookError = false, chapters, chaptersError = false }: BookProps) {
  const [chapter, setChapter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<HadithList | null>(null)
  const [state, setState] = useState<ListState>('loading')

  useEffect(() => {
    setState('loading')
    setPage(1)
    setData(null)
    const params = new URLSearchParams({ book: bookId })
    if (chapter) params.set('chapter', chapter)
    params.set('page', '1')
    params.set('limit', String(25))
    apiFetch<HadithList>(`/api/hadith?${params.toString()}`)
      .then((list) => {
        if (!isValidHadithList(list)) {
          setState('error')
          return
        }
        setData(list)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [bookId, chapter])

  const gotoPage = (next: number) => {
    if (next < 1 || (data && next > data.pages)) return
    setState('loading')
    const params = new URLSearchParams({ book: bookId })
    if (chapter) params.set('chapter', chapter)
    params.set('page', String(next))
    params.set('limit', String(25))
    apiFetch<HadithList>(`/api/hadith?${params.toString()}`)
      .then((list) => {
        if (!isValidHadithList(list)) {
          setState('error')
          return
        }
        setData(list)
        setPage(next)
        setState('ready')
      })
      .catch(() => setState('error'))
  }

  const title = book?.nameAr || bookId

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">الأحاديث · كتب السنة</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          {bookError && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="size-4" /> تعذّر تحميل تفاصيل الكتاب.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          
          <aside className="w-full shrink-0 md:w-64">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">الأبواب</h2>
            {chaptersError && chapters.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="size-4" /> تعذّر تحميل الأبواب.
              </p>
            ) : chapters.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد أبواب متاحة.</p>
            ) : (
              <nav className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setChapter(undefined)}
                  className={`rounded-lg px-3 py-2 text-right text-sm transition-colors ${!chapter ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  كل الأحاديث
                </button>
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChapter(c.id)}
                    className={`rounded-lg px-3 py-2 text-right text-sm transition-colors ${chapter === c.id ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    {c.titleAr ? c.titleAr : `الباب ${c.id}`}
                    {typeof c.hadithsCount === 'number' && (
                      <span className="ml-2 text-xs opacity-70">({c.hadithsCount})</span>
                    )}
                  </button>
                ))}
              </nav>
            )}
          </aside>

          
          <section className="min-w-0 flex-1">
            {state === 'loading' && (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            )}

            {state === 'error' && (
              <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
                <AlertCircle className="mx-auto mb-3 size-6" />
                تعذّر تحميل الأحاديث. حاول مرة أخرى لاحقًا.
              </div>
            )}

            {state === 'ready' && data && data.items.length === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
                لا توجد أحاديث في هذا القسم.
              </div>
            )}

            {state === 'ready' && data && data.items.length > 0 && (
              <div className="flex flex-col gap-4">
                {data.items.map((h) => (
                  <Link
                    key={h.id}
                    href={`/hadith/${bookId}/${h.hadithNumber}`}
                    className="rounded-xl border bg-card p-5 hover:bg-muted"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Badge variant="secondary">حديث رقم {h.hadithNumber}</Badge>
                      {h.grading && <Badge variant="outline">{h.grading}</Badge>}
                    </div>
                    <p className="text-base leading-loose">{h.arabic}</p>
                    {h.narrator && <p className="mt-3 text-sm text-muted-foreground">الراوي: {h.narrator}</p>}
                  </Link>
                ))}

                
                {data.pages > 1 && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
                      <ArrowRight className="size-4" data-icon="inline-start" /> السابق
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      صفحة {page} من {data.pages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => gotoPage(page + 1)}>
                      التالي <ArrowLeft className="size-4" data-icon="inline-end" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}