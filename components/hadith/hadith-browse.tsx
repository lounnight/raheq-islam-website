'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, BookOpen, Dices, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Hadith, HadithBook, HadithSearchResult } from '@/types/hadith'
import { apiFetch } from './hadith-api-client'

type BrowseProps = {
  initialBooks: HadithBook[]
  hasError?: boolean
}

type LoadState = 'idle' | 'loading' | 'error'

export function HadithBrowse({ initialBooks, hasError = false }: BrowseProps) {
  const [books] = useState<HadithBook[]>(initialBooks)
  const [random, setRandom] = useState<Hadith | null>(null)
  const [randomState, setRandomState] = useState<LoadState>(hasError ? 'error' : 'idle')
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<LoadState>('idle')
  const [results, setResults] = useState<HadithSearchResult | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSearchState('idle')
      setResults(null)
      return
    }
    setSearchState('loading')
    const t = setTimeout(() => {
      apiFetch<HadithSearchResult>(`/api/hadith?search=${encodeURIComponent(q)}`)
        .then((data) => {
          setResults(data)
          setSearchState('idle')
        })
        .catch(() => setSearchState('error'))
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const loadRandom = () => {
    setRandomState('loading')
    apiFetch<Hadith>('/api/hadith?random=1')
      .then((h) => {
        setRandom(h)
        setRandomState('idle')
      })
      .catch(() => setRandomState('error'))
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">من السنة النبوية</p>
          <h1 className="mt-2 text-3xl font-bold">الأحاديث</h1>
          <p className="mt-2 text-muted-foreground">تصفح الأحاديث النبوية من كتب السنة.</p>
        </div>

        
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">حديث عشوائي</p>
              <h2 className="mt-1 text-xl font-semibold">حديث اليوم · من كتب السنة</h2>
            </div>
            <Button variant="outline" onClick={loadRandom} disabled={randomState === 'loading'}>
              <Dices className="size-4" data-icon="inline-start" />
              {randomState === 'loading' ? 'جارٍ التحميل...' : 'حديث آخر'}
            </Button>
          </div>

          {randomState === 'loading' && (
            <div className="mt-5 flex flex-col gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}

          {randomState === 'error' && (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              تعذّر تحميل حديث عشوائي. حاول مرة أخرى لاحقًا.
            </div>
          )}

          {random && randomState === 'idle' && (
            <article className="mt-5">
              <p className="text-lg leading-loose">{random.arabic}</p>
              {random.narrator && (
                <p className="mt-3 text-sm text-muted-foreground">الراوي: {random.narrator}</p>
              )}
              <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
                <span>{random.bookName}</span>
                <span>حديث رقم {random.hadithNumber}</span>
              </div>
            </article>
          )}
        </section>

        
        <section className="flex flex-col gap-3">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              className="h-10 pr-10"
              placeholder="البحث في الأحاديث..."
              aria-label="البحث في الأحاديث"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {searchState === 'loading' && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {searchState === 'error' && (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><AlertCircle className="size-4" /> تعذّر البحث. حاول مرة أخرى لاحقًا.</p>
            </div>
          )}

          {searchState === 'idle' && results && (
            <div className="flex flex-col gap-3">
              {results.items.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                  لا توجد نتائج مطابقة للبحث «{query.trim()}». جرّب كلمات مختلفة.
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{results.total} نتيجة</p>
                  {results.items.map((h) => (
                    <Link
                      key={h.id}
                      href={`/hadith/${h.bookId}/${h.hadithNumber}`}
                      className="rounded-xl border bg-card p-5 hover:bg-muted"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Badge variant="secondary">{h.bookName || h.bookId}</Badge>
                        <span className="text-xs text-muted-foreground">حديث رقم {h.hadithNumber}</span>
                      </div>
                      <p className="text-base leading-loose">{h.arabic}</p>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        
        <section>
          <h2 className="mb-4 text-lg font-semibold">كتب الحديث</h2>
          {hasError && books.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
              <AlertCircle className="mx-auto mb-3 size-6" />
              تعذّر تحميل الكتب. حاول مرة أخرى لاحقًا.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/hadith/${book.id}`}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                    <BookOpen className="size-5 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{book.nameAr}</b>
                  </span>
                  {book.totalHadiths > 0 && (
                    <Badge variant="secondary">{book.totalHadiths} حديث</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
