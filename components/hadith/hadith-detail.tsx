'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Hadith, HadithBook } from '@/types/hadith'
import { apiFetch } from './hadith-api-client'

type DetailProps = {
  bookId: string
  hadithNumber: number
  initialBook?: HadithBook | null
}

type State = 'loading' | 'error' | 'ready'

export function HadithDetailPage({ bookId, hadithNumber, initialBook }: DetailProps) {
  const [state, setState] = useState<State>('loading')
  const [hadith, setHadith] = useState<Hadith | null>(null)

  useEffect(() => {
    setState('loading')
    apiFetch<Hadith>(`/api/hadith?book=${encodeURIComponent(bookId)}&hadithNumber=${hadithNumber}`)
      .then((h) => {
        setHadith(h)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [bookId, hadithNumber])

  const bookName = hadith?.bookName || initialBook?.nameAr || bookId

  return (
    <AppShell>
      <article className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/hadith/${bookId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" data-icon="inline-start" />
            العودة إلى {bookName}
          </Link>
        </div>

        {state === 'loading' && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <AlertCircle className="size-8" />
            <p>تعذّر تحميل هذا الحديث. حاول مرة أخرى لاحقًا.</p>
          </div>
        )}

        {state === 'ready' && hadith && (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">الأحاديث · {bookName}</p>
              <h1 className="mt-2 text-3xl font-bold">حديث رقم {hadith.hadithNumber}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {hadith.grading && <Badge>{hadith.grading}</Badge>}
                {hadith.grades && hadith.grades.map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-8">
              <h2 className="mb-4 text-sm font-semibold text-muted-foreground">المتن</h2>
              <p className="text-2xl leading-[2.2]" dir="rtl" lang="ar">{hadith.arabic}</p>

              <div className="mt-10 grid gap-5 border-t pt-6 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">الكتاب</p>
                  <p className="mt-1 font-medium">{bookName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">رقم الحديث</p>
                  <p className="mt-1 font-medium">{hadith.hadithNumber}</p>
                </div>
                {hadith.narrator && (
                  <div>
                    <p className="text-muted-foreground">الراوي</p>
                    <p className="mt-1 font-medium">{hadith.narrator}</p>
                  </div>
                )}
                {hadith.chapterId && (
                  <div>
                    <p className="text-muted-foreground">الباب</p>
                    <p className="mt-1 font-medium">{hadith.chapterTitle || `الباب ${hadith.chapterId}`}</p>
                  </div>
                )}
              </div>

              {hadith.references && hadith.references.length > 0 && (
                <div className="mt-8 border-t pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">المراجع</h3>
                  <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                    {hadith.references.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </article>
    </AppShell>
  )
}
