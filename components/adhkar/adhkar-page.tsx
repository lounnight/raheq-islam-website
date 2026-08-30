'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import type { AdhkarData, Dua, DuasData } from '@/types/adhkar'

type AdhkarPageProps = {
  data?: AdhkarData
  hasError?: boolean
  duas?: DuasData
  duasHasError?: boolean
}

type ProgressState = Record<string, number>

type Mode = 'athkar' | 'duas'

type DuaGroup = { id: number; category: string; array: Dua[] }

const TASHKIL_PATTERN = /[\u064B-\u0652\u0640\u06D6-\u06ED]/g
const ALEF_VARIANTS_PATTERN = /[\u0622\u0623\u0625\u0671\u0670]/g

function normalizeSearch(value: string): string {
  return value
    .replace(TASHKIL_PATTERN, '')
    .replace(ALEF_VARIANTS_PATTERN, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLocaleLowerCase('ar')
}

export function AdhkarPage({ data, hasError = false, duas, duasHasError = false }: AdhkarPageProps) {
  const [mode, setMode] = useState<Mode>('athkar')
  const [selectedId, setSelectedId] = useState<number | null>(data?.[0]?.id ?? null)
  const [progress, setProgress] = useState<ProgressState>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const selected = data?.find((category) => category.id === selectedId) ?? data?.[0]

  const duaGroups = useMemo<DuaGroup[]>(
    () => [
      { id: 1, category: 'أدعية القرآن', array: duas?.quran ?? [] },
      { id: 2, category: 'أدعية السنة', array: duas?.sunnah ?? [] },
    ],
    [duas],
  )
  const [selectedDuaGroupId, setSelectedDuaGroupId] = useState<number | null>(duaGroups[0]?.id ?? null)
  const [duaSearchQuery, setDuaSearchQuery] = useState('')
  const [duaCategoryQuery, setDuaCategoryQuery] = useState('')
  const selectedDuaGroup =
    duaGroups.find((group) => group.id === selectedDuaGroupId) ?? duaGroups[0]

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(categoryQuery.trim())
    if (!query) return data ?? []
    return (data ?? []).filter((category) =>
      normalizeSearch(category.category).includes(query),
    )
  }, [categoryQuery, data])

  const filteredDuaGroups = useMemo(() => {
    const query = normalizeSearch(duaCategoryQuery.trim())
    if (!query) return duaGroups
    return duaGroups.filter((group) =>
      normalizeSearch(group.category).includes(query),
    )
  }, [duaCategoryQuery, duaGroups])

  const filteredDhikr = useMemo(() => {
    if (!selected) return []
    const query = normalizeSearch(searchQuery.trim())
    if (!query) return selected.array
    return selected.array.filter((dhikr) =>
      normalizeSearch(`${dhikr.text} ${dhikr.notes ?? ''}`).includes(query),
    )
  }, [searchQuery, selected])

  const filteredDuas = useMemo(() => {
    if (!selectedDuaGroup) return []
    const query = normalizeSearch(duaSearchQuery.trim())
    if (!query) return selectedDuaGroup.array
    return selectedDuaGroup.array.filter((dua) =>
      normalizeSearch(`${dua.text} ${dua.reference}`).includes(query),
    )
  }, [duaSearchQuery, selectedDuaGroup])

  const categoryProgress = useMemo(() => {
    if (!selected) return { completed: 0, total: 0 }
    return {
      completed: selected.array.filter(
        (dhikr) => (progress[`${selected.id}:${dhikr.id}`] ?? 0) >= dhikr.count,
      ).length,
      total: selected.array.length,
    }
  }, [progress, selected])

  const increment = (categoryId: number, dhikrId: number, target: number) => {
    const key = `${categoryId}:${dhikrId}`
    setProgress((current) => ({
      ...current,
      [key]: Math.min((current[key] ?? 0) + 1, target),
    }))
  }

  const reset = (categoryId: number, dhikrId: number) => {
    setProgress((current) => {
      const next = { ...current }
      delete next[`${categoryId}:${dhikrId}`]
      return next
    })
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">وردك اليوم</p>
          <h1 className="text-3xl font-bold tracking-tight">الأذكار</h1>
          <p className="text-muted-foreground">حصّن يومك بذكر الله تعالى.</p>
        </header>

        <div
          role="group"
          aria-label="التبديل بين الأذكار والأدعية"
          className="flex w-fit rounded-xl border bg-card p-1"
        >
          <Button
            type="button"
            variant={mode === 'athkar' ? 'default' : 'ghost'}
            aria-pressed={mode === 'athkar'}
            onClick={() => setMode('athkar')}
          >
            أذكار
          </Button>
          <Button
            type="button"
            variant={mode === 'duas' ? 'default' : 'ghost'}
            aria-pressed={mode === 'duas'}
            onClick={() => setMode('duas')}
          >
            أدعية
          </Button>
        </div>

        {mode === 'athkar' ? (
          hasError ? (
            <section className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-14 text-center">
              <h2 className="text-xl font-semibold">تعذر تحميل الأذكار</h2>
              <p className="text-muted-foreground">حدث خطأ أثناء تحميل بيانات الأذكار. يرجى المحاولة مرة أخرى.</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
            </section>
          ) : !data?.length ? (
            <section className="rounded-xl border bg-card px-6 py-14 text-center text-muted-foreground">لا توجد أذكار متاحة حاليًا.</section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
              <nav aria-label="تصنيفات الأذكار" className="rounded-xl border bg-card p-4 lg:sticky lg:top-24">
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-base font-semibold">اختر التصنيف</h2>
                    <p className="mt-1 text-sm text-muted-foreground">تصفح الأذكار حسب نوعها</p>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="search"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                      placeholder="ابحث عن تصنيف..."
                      aria-label="البحث عن تصنيف"
                      className="h-10 pr-10"
                    />
                  </div>
                </div>
                <ul className="mt-4 flex max-h-[32rem] min-h-72 flex-col gap-2 overflow-y-auto" role="list">
                  {filteredCategories.length === 0 ? (
                    <li className="py-8 text-center text-sm text-muted-foreground">لا يوجد تصنيف مطابق.</li>
                  ) : filteredCategories.map((category) => (
                    <li key={category.id}>
                      <button
                        type="button"
                        aria-current={category.id === selected?.id ? 'page' : undefined}
                        className={`w-full rounded-lg px-4 py-3.5 text-right text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category.id === selected?.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                        onClick={() => {
                          setSelectedId(category.id)
                          setSearchQuery('')
                        }}
                      >
                        {category.category}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {selected && (
              <section className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">تقدم الأذكار</p>
                      <h2 className="text-2xl font-semibold">{selected.category}</h2>
                    </div>
                    <Badge variant={categoryProgress.completed === categoryProgress.total ? 'default' : 'secondary'}>
                      {categoryProgress.completed} / {categoryProgress.total} مكتمل
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="ابحث باسم الذكر أو نصه..."
                      aria-label="البحث عن ذكر"
                      className="h-10 pr-10"
                    />
                  </div>
                </div>

                {selected.array.length === 0 ? (
                  <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">لا توجد أذكار في هذا التصنيف.</div>
                ) : filteredDhikr.length === 0 ? (
                  <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">لم يتم العثور على ذكر مطابق للبحث.</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredDhikr.map((dhikr) => {
                      const key = `${selected.id}:${dhikr.id}`
                      const current = progress[key] ?? 0
                      const isComplete = current >= dhikr.count
                      return (
                        <article key={key} className="rounded-xl border bg-card p-6 shadow-sm">
                          <button
                            type="button"
                            className="flex w-full flex-col gap-5 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => increment(selected.id, dhikr.id, dhikr.count)}
                            disabled={isComplete}
                            aria-label={isComplete ? 'تم إكمال الذكر' : 'اضغط لزيادة العداد'}
                          >
                            <p className="text-lg leading-loose">{dhikr.text}</p>
                            {dhikr.notes && <p className="text-sm text-muted-foreground">{dhikr.notes}</p>}
                            <div className="flex items-center gap-4">
                              <Progress value={(current / dhikr.count) * 100} className="flex-1" />
                              <span className="min-w-16 text-sm tabular-nums text-muted-foreground">{current} / {dhikr.count}</span>
                            </div>
                          </button>
                          <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                            <span className="text-sm text-muted-foreground">عدد التكرار: {dhikr.count}</span>
                            <Button variant="ghost" size="sm" onClick={() => reset(selected.id, dhikr.id)} disabled={current === 0}>
                              <RotateCcw className="size-4" data-icon="inline-start" />
                              إعادة
                            </Button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
              )}
            </div>
          )
        ) : duasHasError ? (
          <section className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-14 text-center">
            <h2 className="text-xl font-semibold">تعذر تحميل الأدعية</h2>
            <p className="text-muted-foreground">حدث خطأ أثناء تحميل بيانات الأدعية. يرجى المحاولة مرة أخرى.</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
            <nav aria-label="تصنيفات الأدعية" className="rounded-xl border bg-card p-4 lg:sticky lg:top-24">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-semibold">اختر التصنيف</h2>
                  <p className="mt-1 text-sm text-muted-foreground">تصفح الأدعية حسب مصدرها</p>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={duaCategoryQuery}
                    onChange={(event) => setDuaCategoryQuery(event.target.value)}
                    placeholder="ابحث عن تصنيف..."
                    aria-label="البحث عن تصنيف"
                    className="h-10 pr-10"
                  />
                </div>
              </div>
              <ul className="mt-4 flex max-h-[32rem] flex-col gap-2 overflow-y-auto" role="list">
                {filteredDuaGroups.length === 0 ? (
                  <li className="py-8 text-center text-sm text-muted-foreground">لا يوجد تصنيف مطابق.</li>
                ) : filteredDuaGroups.map((group) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      aria-current={group.id === selectedDuaGroup?.id ? 'page' : undefined}
                      className={`w-full rounded-lg px-4 py-3.5 text-right text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${group.id === selectedDuaGroup?.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                      onClick={() => {
                        setSelectedDuaGroupId(group.id)
                        setDuaSearchQuery('')
                      }}
                    >
                      {group.category}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {selectedDuaGroup && (
            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">أدعية مأثورة</p>
                    <h2 className="text-2xl font-semibold">{selectedDuaGroup.category}</h2>
                  </div>
                  <Badge variant="secondary">{selectedDuaGroup.array.length} دعاء</Badge>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={duaSearchQuery}
                    onChange={(event) => setDuaSearchQuery(event.target.value)}
                    placeholder="ابحث باسم الدعاء أو نصه..."
                    aria-label="البحث عن دعاء"
                    className="h-10 pr-10"
                  />
                </div>
              </div>

              {selectedDuaGroup.array.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">لا توجد أدعية في هذا التصنيف.</div>
              ) : filteredDuas.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">لم يتم العثور على دعاء مطابق للبحث.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredDuas.map((dua, index) => {
                    const key = `${selectedDuaGroup.id}:${index}`
                    return (
                      <article key={key} className="rounded-xl border bg-card p-6 shadow-sm">
                        <p className="text-lg leading-loose">{dua.text}</p>
                        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                          <Badge variant="secondary">{dua.reference}</Badge>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
