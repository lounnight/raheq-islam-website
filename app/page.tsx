'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Heart, MapPin, ScrollText } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import type { Hadith } from '@/types/hadith'
import type { SurahMeta } from '@/types/quran'
import {
  getStoredPrayerSettings,
  calculatePrayerData,
  DEFAULT_PRAYER_SETTINGS
} from '@/lib/prayer-storage'
import { getLastReadingProgress, type ReadingProgress } from '@/lib/quran-reading-storage'
import { getSurahStartPage } from '@/lib/quran-page-map'
import { toArabicIndic } from '@/components/quran/mushaf-utils'
import { formatHijriDate, formatGregorianDate } from '@/lib/hijri-date'

function SectionTitle({ title, href = '#', action = 'عرض الكل' }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        {action}
        <ArrowLeft className="size-4" />
      </Link>
    </div>
  )
}

export default function Page() {
  const [settings, setSettings] = useState(DEFAULT_PRAYER_SETTINGS)
  const [now, setNow] = useState<Date | null>(null)
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null)
  const [lastReading, setLastReading] = useState<ReadingProgress | null>(null)
  const [surahs, setSurahs] = useState<SurahMeta[]>([])

  useEffect(() => {
    setSettings(getStoredPrayerSettings())
    setNow(new Date())
    setLastReading(getLastReadingProgress())

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetch('/api/hadith?curated=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((h: Hadith | null) => setDailyHadith(h))
      .catch(() => setDailyHadith(null))
  }, [])

  useEffect(() => {
    fetch('/api/quran')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SurahMeta[]) => setSurahs(data))
      .catch(() => setSurahs([]))
  }, [])

  const prayerData = useMemo(() => {
    if (!now) return null
    return calculatePrayerData(settings, now)
  }, [settings, now])

  const lastReadingSurah = useMemo(() => {
    if (!lastReading) return null
    return surahs.find((s) => s.number === lastReading.surah) ?? null
  }, [lastReading, surahs])

  const lastReadingPageIndex = useMemo(() => {
    if (!lastReading) return null
    const startPage = getSurahStartPage(lastReading.surah)
    if (startPage === undefined) return null
    return lastReading.page - startPage + 1
  }, [lastReading])

  const lastReadingProgress = useMemo(() => {
    if (!lastReading || lastReading.totalPages === 0) return 0
    return Math.round((lastReadingPageIndex ?? 1) / lastReading.totalPages * 100)
  }, [lastReading, lastReadingPageIndex])

  const hijriDateStr = useMemo(() => {
    if (!now) return ''
    return formatHijriDate(now)
  }, [now])

  const gregorianDateStr = useMemo(() => {
    if (!now) return ''
    return formatGregorianDate(now)
  }, [now])

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">{hijriDateStr || '\u00A0'}</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">السلام عليكم</h1>
            <p className="mt-2 text-muted-foreground">مرحبًا بك في رحيق الإسلام، نرجو لك يومًا مباركًا.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <CalendarDays className="size-5 text-muted-foreground" />
            <span>{gregorianDateStr || '\u00A0'}</span>
          </div>
        </section>

        
        <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الصلاة القادمة</p>
                <h2 className="mt-2 text-2xl font-bold">
                  صلاة {prayerData ? prayerData.nextName : '\u00A0'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">متبقي على الأذان</p>
              </div>
              <div className="grid size-12 place-items-center rounded-xl bg-muted">
                <Clock3 className="size-4" />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="font-mono text-4xl font-semibold tracking-wider">
                {prayerData ? prayerData.countdownStr : '--:--:--'}
              </span>
              <span className="text-2xl font-semibold">
                {prayerData ? prayerData.nextTimeStr : '--:--'}
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${prayerData ? prayerData.progressPercent : 0}%` }}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {prayerData ? prayerData.locationName : '\u00A0'}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <SectionTitle title="مواقيت اليوم" href="/prayer" />
            <div className="flex flex-col gap-1">
              {prayerData
                ? prayerData.prayers
                    .filter((p) => p.name !== 'الشروق')
                    .map((prayer) => (
                      <div
                        key={prayer.name}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                          prayer.isNext ? 'bg-muted' : ''
                        }`}
                      >
                        <span className="text-sm">{prayer.name}</span>
                        <span
                          className={`font-mono text-sm ${
                            prayer.isNext ? 'font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {prayer.time}
                        </span>
                      </div>
                    ))
                : (
                  <div className="flex flex-col gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">&nbsp;</span>
                        <span className="font-mono text-sm text-muted-foreground">--:--</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="وصول سريع" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { href: '/quran', label: 'القرآن الكريم', sub: 'اقرأ وتدبر', icon: <BookOpen className="mb-8 size-6 text-muted-foreground group-hover:text-foreground" /> },
              { href: '/hadith', label: 'الأحاديث', sub: 'من السنة النبوية', icon: <ScrollText className="mb-8 size-6 text-muted-foreground group-hover:text-foreground" /> },
              { href: '/adhkar', label: 'الأذكار', sub: 'حصّن يومك', icon: <Heart className="mb-8 size-6 text-muted-foreground group-hover:text-foreground" /> },
              { href: '/prayer', label: 'أوقات الصلاة', sub: 'مواقيت مدينتك', icon: <Clock3 className="mb-8 size-6 text-muted-foreground group-hover:text-foreground" /> }
            ].map(({ href, label, sub, icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
              >
                {icon}
                <b className="block">{label}</b>
                <span className="mt-1 block text-xs text-muted-foreground">{sub}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-xl border bg-card p-6">
            <SectionTitle title="الحديث اليوم" href="/hadith" />
            {dailyHadith ? (
              <>
                <p className="text-lg leading-loose">&quot;{dailyHadith.arabic}&quot;</p>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span>{dailyHadith.narrator || dailyHadith.bookName}</span>
                    {dailyHadith.grading && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {dailyHadith.grading}
                      </span>
                    )}
                  </span>
                  <span>حديث رقم {dailyHadith.hadithNumber}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">حديث اليوم غير متاح حاليًا.</p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6">
            <SectionTitle title="آخر قراءة" href="/quran" />
            {lastReading && lastReadingSurah ? (
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-xl bg-muted text-xl font-semibold">
                  {toArabicIndic(lastReadingPageIndex ?? 1)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">سورة {lastReadingSurah.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    صفحة {toArabicIndic(lastReadingPageIndex ?? 1)} من {toArabicIndic(lastReading.totalPages)}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${lastReadingProgress}%` }}
                    />
                  </div>
                </div>
                <Link href={`/quran?surah=${lastReading.surah}`}>
                  <Button variant="outline" size="icon" aria-label="متابعة القراءة">
                    <ArrowLeft className="size-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-xl bg-muted text-xl font-semibold">١</div>
                <div className="flex-1">
                  <p className="font-semibold">سورة الفاتحة</p>
                  <p className="mt-1 text-sm text-muted-foreground">ابدأ رحلتك مع القرآن الكريم</p>
                  <div className="mt-3 h-1.5 rounded-full bg-muted">
                    <div className="h-full w-0 rounded-full bg-primary" />
                  </div>
                </div>
                <Link href="/quran">
                  <Button variant="outline" size="icon" aria-label="ابدأ القراءة">
                    <ArrowLeft className="size-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-muted/40 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border bg-background">
              <Heart className="size-4" />
            </span>
            <div>
              <p className="font-medium">وردك اليوم</p>
              <p className="mt-1 text-sm text-muted-foreground">اجعل لسانك رطبًا بذكر الله</p>
            </div>
            <Button variant="outline" className="mr-auto">
              <Link href="/adhkar">ابدأ الآن</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}