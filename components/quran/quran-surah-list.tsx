'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, BookOpen, Search, SquarePen, Trash2 } from 'lucide-react'

import type { SurahMeta } from '@/types/quran'
import { Input } from '@/components/ui/input'
import { getJuzList, getQuartersList } from '@/services/quran-service'
import { getVerseText } from '@/services/quran-source-service'
import {
  buildHizbDivisions,
  buildJuzDivisions,
  type DivisionVM,
} from '@/lib/quran/divisions'
import {
  ayahKey,
  deleteAyahNote,
  getAyahBookmarks,
  getAyahNotes,
  parseAyahKey,
  saveAyahNote,
  type AyahNote,
} from '@/lib/ayah-storage'
import { normalizeArabicText } from '@/lib/arabic-search'
import type { QuranSearchResults } from '@/services/quran-search-service'
import { AyahNoteEditor } from './ayah-note-editor'
import { toArabicIndic } from './mushaf-utils'

type QuranSurahListProps = {
  surahs: SurahMeta[]
}

type IndexTab = 'all' | 'juz' | 'hizb' | 'saved' | 'notes'


const ayahSearchCache = new Map<string, QuranSearchResults>()


function toAyahEntry(key: string): { surah: number; ayah: number } | null {
  const parsed = parseAyahKey(key)
  return parsed ? { surah: parsed.surah, ayah: parsed.verse } : null
}

export function QuranSurahList({ surahs }: QuranSurahListProps) {
  const router = useRouter()
  const [tab, setTab] = useState<IndexTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [ayahResults, setAyahResults] = useState<QuranSearchResults | null>(null)
  const [searchingAyahs, setSearchingAyahs] = useState(false)

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setAyahResults(null)
      setSearchingAyahs(false)
      return
    }
    setSearchingAyahs(true)
    let ok = true
    const t = setTimeout(() => {
      const cached = ayahSearchCache.get(q)
      if (cached) {
        setAyahResults(cached)
        setSearchingAyahs(false)
        return
      }
      fetch(`/api/quran/search?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: QuranSearchResults) => {
          if (!ok) return
          ayahSearchCache.set(q, data)
          setAyahResults(data)
          setSearchingAyahs(false)
        })
        .catch(() => {
          if (ok) setSearchingAyahs(false)
        })
    }, 300)
    return () => {
      ok = false
      clearTimeout(t)
    }
  }, [searchQuery])

  const [savedKeys, setSavedKeys] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, AyahNote>>({})
  const [noteEditorAyah, setNoteEditorAyah] = useState<{ surah: number; verse: number } | null>(null)

  useEffect(() => {
    setSavedKeys(Object.keys(getAyahBookmarks()))
    setNotes(getAyahNotes())
  }, [])


  const navigateToAyah = (surah: number, ayah: number) => {
    router.push(`/quran?surah=${surah}&ayah=${ayah}`)
  }

  const handleDeleteNote = (surah: number, ayah: number) => {
    const key = ayahKey(surah, ayah)
    deleteAyahNote(key)
    setNotes((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6 pt-2" dir="rtl">
      
      <div className="flex flex-col gap-4 border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold text-primary">كتاب الله المجيد</span>
          <h1 className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">
            القرآن الكريم
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            فهرس ١١٤ سورة مباركة لقراءة وتدبر كلام الله عز وجل.
          </p>
        </div>

        
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في القرآن الكريم"
            className="w-full pr-9 text-xs"
            aria-label="بحث في القرآن"
          />
        </div>
      </div>

      
      <section className="quran-index-box overflow-hidden rounded-[0.75rem] border bg-card" aria-label="فهرس القرآن">
        
        <div
          role="tablist"
          aria-label="أقسام الفهرس"
          className="quran-index-tabs flex items-center justify-between gap-2 overflow-x-auto border-b p-1.5"
        >
          <div className="flex shrink-0 items-center gap-1">
            <IndexTabButton active={tab === 'all'} onClick={() => setTab('all')} label="الكل" />
            <IndexTabButton active={tab === 'juz'} onClick={() => setTab('juz')} label="الأجزاء" />
            <IndexTabButton active={tab === 'hizb'} onClick={() => setTab('hizb')} label="الأحزاب" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IndexTabButton
              active={tab === 'saved'}
              onClick={() => setTab('saved')}
              label="المحفوظة"
              icon={<Bookmark className="size-[13px]" aria-hidden="true" />}
            />
            <IndexTabButton
              active={tab === 'notes'}
              onClick={() => setTab('notes')}
              label="الملاحظات"
              icon={<SquarePen className="size-[13px]" aria-hidden="true" />}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {tab === 'all' && (
            <AllSurahsTab
              surahs={surahs}
              searchQuery={searchQuery}
              ayahResults={ayahResults}
              searchingAyahs={searchingAyahs}
              onOpenAyah={navigateToAyah}
            />
          )}
          {tab === 'juz' && <JuzTab surahs={surahs} onOpen={navigateToAyah} />}
          {tab === 'hizb' && <HizbTab surahs={surahs} onOpen={navigateToAyah} />}
          {tab === 'saved' && (
            <SavedTab surahs={surahs} savedKeys={savedKeys} onOpen={navigateToAyah} />
          )}
          {tab === 'notes' && (
            <NotesTab
              surahs={surahs}
              notes={notes}
              onOpen={navigateToAyah}
              onEdit={(surah, ayah) => setNoteEditorAyah({ surah, verse: ayah })}
              onDelete={handleDeleteNote}
            />
          )}
        </div>
      </section>

      
      {noteEditorAyah && (
        <AyahNoteEditor
          ayah={noteEditorAyah}
          surahName={surahs.find((s) => s.number === noteEditorAyah.surah)?.name ?? ''}
          onClose={() => {
            setNotes(getAyahNotes())
            setNoteEditorAyah(null)
          }}
          onSave={(ayahRef, text) => {
            saveAyahNote(ayahKey(ayahRef.surah, ayahRef.verse), text)
            setNotes(getAyahNotes())
            setNoteEditorAyah(null)
          }}
          onDelete={(ayahRef) => {
            handleDeleteNote(ayahRef.surah, ayahRef.verse)
            setNoteEditorAyah(null)
          }}
        />
      )}
    </div>
  )
}


function IndexTabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="quran-index-tab flex shrink-0 items-center gap-1.5 cursor-pointer whitespace-nowrap rounded-t-[0.45rem] border border-transparent border-b-2 bg-transparent px-[0.9rem] py-[0.4rem] text-[0.8rem] font-semibold text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[active=true]:border-primary data-[active=true]:bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] data-[active=true]:text-primary data-[active=true]:font-bold"
      data-active={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}


function AllSurahsTab({
  surahs,
  searchQuery,
  ayahResults,
  searchingAyahs,
  onOpenAyah,
}: {
  surahs: SurahMeta[]
  searchQuery: string
  ayahResults: QuranSearchResults | null
  searchingAyahs: boolean
  onOpenAyah: (surah: number, ayah: number) => void
}) {
  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return surahs
    const nq = normalizeArabicText(q).toLowerCase()
    return surahs.filter(
      (s) =>
        normalizeArabicText(s.name).includes(nq) ||
        s.englishName.toLowerCase().includes(q.toLowerCase()) ||
        String(s.number).includes(q)
    )
  }, [surahs, searchQuery])

  const showAyahResults = searchQuery.trim().length >= 2

  return (
    <div className="flex flex-col gap-6">
      {showAyahResults && (
        <AyahSearchSection
          results={ayahResults}
          searching={searchingAyahs}
          query={searchQuery.trim()}
          onOpenAyah={onOpenAyah}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filteredSurahs.map((s) => (
        <Link
          key={s.number}
          href={`/quran?surah=${s.number}`}
          className="group flex items-center justify-between border p-4 hover:bg-accent/60"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center border text-xs font-bold">
              {s.number}
            </div>
            <div>
              <h3 className="quran-surah-name text-sm font-bold text-foreground [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">سورة {s.name}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} · {s.numberOfAyahs} آيات
              </p>
            </div>
          </div>
          <div className="text-left">
            <span className="block text-xs font-semibold text-primary">
              صفحة {s.startPage || 1}
            </span>
            <span className="text-[10px] text-muted-foreground">{s.englishName}</span>
          </div>
        </Link>
      ))}
      </div>
    </div>
  )
}


function AyahSearchSection({
  results,
  searching,
  query,
  onOpenAyah,
}: {
  results: QuranSearchResults | null
  searching: boolean
  query: string
  onOpenAyah: (surah: number, ayah: number) => void
}) {
  if (searching && !results) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <p className="text-xs font-semibold text-muted-foreground">جارٍ البحث في الآيات...</p>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse border bg-muted/50" />
        ))}
      </div>
    )
  }
  if (!results) return null

  const { surahs, ayahs } = results
  if (surahs.length === 0 && ayahs.length === 0) {
    return (
      <p className="border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        لا توجد نتائج مطابقة لـ «{query}». جرّب كلمات أخرى.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {surahs.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground">السور</h3>
          <div className="flex flex-wrap gap-2">
            {surahs.map((s) => (
              <button
                key={s.number}
                type="button"
                onClick={() => onOpenAyah(s.number, 1)}
                className="quran-surah-name border px-3 py-1.5 text-sm font-semibold hover:bg-accent/60 [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]"
              >
                سورة {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {ayahs.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
            الآيات {ayahs.length >= 30 ? '(أول ٣٠ نتيجة)' : ''}
          </h3>
          <div className="grid gap-2">
            {ayahs.map((a) => (
              <button
                key={`${a.surah}:${a.verse}`}
                type="button"
                onClick={() => onOpenAyah(a.surah, a.verse)}
                className="border p-3 text-right transition-colors hover:bg-accent/60"
                aria-label={`الانتقال إلى سورة ${a.surahName} الآية ${a.verse}`}
              >
                <p className="mb-1.5 text-[11px] font-semibold text-primary">
                  سورة {a.surahName} — الآية {toArabicIndic(a.verse)}
                </p>
                <p className="quran-plain-text line-clamp-2 text-sm leading-loose text-foreground">
                  {a.text}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}


function useDivisions(tab: 'juz' | 'hizb' | null): DivisionVM[] | null {
  const [divisions, setDivisions] = useState<DivisionVM[] | null>(null)
  useEffect(() => {
    if (!tab) return
    if (tab === 'juz') {
      if (divisions) return
      let ok = true
      getJuzList()
        .then(buildJuzDivisions)
        .then((d) => ok && setDivisions(d))
        .catch(() => ok && setDivisions([]))
      return () => {
        ok = false
      }
    }
    if (divisions) return
    let ok = true
    getQuartersList()
      .then(buildHizbDivisions)
      .then((d) => ok && setDivisions(d))
      .catch(() => ok && setDivisions([]))
    return () => {
      ok = false
    }
  }, [tab])
  return divisions
}


function DivisionCard({
  division,
  titlePrefix,
  surahs,
  onOpen,
}: {
  division: DivisionVM
  titlePrefix: string
  surahs: SurahMeta[]
  onOpen: (surah: number, ayah: number) => void
}) {
  const startSurah = surahs.find((s) => s.number === division.start.surah)
  return (
    <button
      type="button"
      className="flex items-center justify-between border p-4 text-right hover:bg-accent/60"
      onClick={() => onOpen(division.start.surah, division.start.ayah)}
      aria-label={`${titlePrefix} ${toArabicIndic(division.id)} — الانتقال إلى بدايته`}
    >
      <div>
        <h3 className="text-sm font-bold text-foreground">
          {titlePrefix} {toArabicIndic(division.id)}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          <span className="quran-surah-name [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
            {startSurah ? `سورة ${startSurah.name}` : `السورة ${division.start.surah}`}
          </span>{' '}
          · الآية {toArabicIndic(division.start.ayah)}
        </p>
      </div>
      <div className="text-left">
        {startSurah?.startPage ? (
          <span className="block text-xs font-semibold text-primary">
            صفحة {toArabicIndic(startSurah.startPage)}
          </span>
        ) : null}
        <span className="text-[10px] text-muted-foreground">
          {startSurah?.englishName ?? ''}
        </span>
      </div>
    </button>
  )
}

function DivisionsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[74px] animate-pulse border bg-muted/50" />
      ))}
    </div>
  )
}


function JuzTab({
  surahs,
  onOpen,
}: {
  surahs: SurahMeta[]
  onOpen: (surah: number, ayah: number) => void
}) {
  const divisions = useDivisions('juz')
  if (!divisions) return <DivisionsSkeleton count={12} />
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {divisions.map((d) => (
        <DivisionCard
          key={d.id}
          division={d}
          titlePrefix="الجزء"
          surahs={surahs}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}


function HizbTab({
  surahs,
  onOpen,
}: {
  surahs: SurahMeta[]
  onOpen: (surah: number, ayah: number) => void
}) {
  const divisions = useDivisions('hizb')
  if (!divisions) return <DivisionsSkeleton count={12} />
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {divisions.map((d) => (
        <DivisionCard
          key={d.id}
          division={d}
          titlePrefix="الحزب"
          surahs={surahs}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}


function useVerseText(surah: number, ayah: number): string | null {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let ok = true
    getVerseText(surah, ayah)
      .then((t) => ok && setText(t ?? null))
      .catch(() => {})
    return () => {
      ok = false
    }
  }, [surah, ayah])
  return text
}


function AyahEntryCard({
  surahs,
  surah,
  ayah,
  onOpen,
  children,
}: {
  surahs: SurahMeta[]
  surah: number
  ayah: number
  onOpen: (surah: number, ayah: number) => void
  children?: React.ReactNode
}) {
  const meta = surahs.find((s) => s.number === surah)
  const text = useVerseText(surah, ayah)
  return (
    <div className="flex flex-col gap-2 border p-4">
      <button
        type="button"
        className="group flex items-center justify-between text-right"
        onClick={() => onOpen(surah, ayah)}
        aria-label={`الانتقال إلى ${meta?.name ?? ''} الآية ${toArabicIndic(ayah)}`}
      >
        <span className="flex items-center gap-2">
          <BookOpen className="text-primary" aria-hidden="true" />
          <span className="quran-surah-name text-sm font-bold text-foreground group-hover:text-primary [font-family:var(--font-amiri),'Amiri_Quran','UthmanTN1_Ver10',Cairo,serif]">
            سورة {meta?.name ?? surah}
          </span>
          <span className="text-[11px] text-muted-foreground">
            · الآية {toArabicIndic(ayah)}
          </span>
        </span>
        {meta?.startPage ? (
          <span className="text-[10px] text-muted-foreground">
            صفحة {toArabicIndic(meta.startPage)}
          </span>
        ) : null}
      </button>

      <button
        type="button"
        className="text-right font-arabic text-[1.05rem] leading-loose text-foreground/90 hover:text-primary"
        onClick={() => onOpen(surah, ayah)}
      >
        {text ?? <span className="inline-block h-5 w-3/4 animate-pulse bg-muted" aria-hidden="true" />}
      </button>

      {children}
    </div>
  )
}


function SavedTab({
  surahs,
  savedKeys,
  onOpen,
}: {
  surahs: SurahMeta[]
  savedKeys: string[]
  onOpen: (surah: number, ayah: number) => void
}) {
  const entries = useMemo(
    () =>
      savedKeys
        .map(toAyahEntry)
        .filter((v) => v !== null)
        .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah),
    [savedKeys]
  )

  if (!entries.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        لا توجد آيات محفوظة بعد
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(({ surah, ayah }) => (
        <AyahEntryCard
          key={ayahKey(surah, ayah)}
          surahs={surahs}
          surah={surah}
          ayah={ayah}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}


function NotesTab({
  surahs,
  notes,
  onOpen,
  onEdit,
  onDelete,
}: {
  surahs: SurahMeta[]
  notes: Record<string, AyahNote>
  onOpen: (surah: number, ayah: number) => void
  onEdit: (surah: number, ayah: number) => void
  onDelete: (surah: number, ayah: number) => void
}) {
  const entries = useMemo(
    () =>
      Object.keys(notes)
        .map(toAyahEntry)
        .filter((v) => v !== null)
        .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah),
    [notes]
  )

  if (!entries.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        لا توجد ملاحظات بعد
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(({ surah, ayah }) => {
        const key = ayahKey(surah, ayah)
        const note = notes[key]
        return (
          <AyahEntryCard
            key={key}
            surahs={surahs}
            surah={surah}
            ayah={ayah}
            onOpen={onOpen}
          >
            <div className="border-t pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground">ملاحظتي:</p>
              <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                {note?.text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="quran-index-note-btn inline-flex cursor-pointer items-center gap-[0.25rem] rounded-[0.4rem] border border-border bg-muted px-[0.6rem] py-[0.25rem] text-[0.7rem] font-semibold text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onEdit(surah, ayah)}
                  aria-label={`تعديل الملاحظة على الآية ${toArabicIndic(ayah)}`}
                >
                  <SquarePen className="size-[12px]" aria-hidden="true" />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  className="quran-index-note-btn quran-index-note-btn--delete inline-flex cursor-pointer items-center gap-[0.25rem] rounded-[0.4rem] border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-muted px-[0.6rem] py-[0.25rem] text-[0.7rem] font-semibold text-destructive transition-colors duration-100 hover:bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] hover:text-destructive"
                  onClick={() => onDelete(surah, ayah)}
                  aria-label={`حذف الملاحظة على الآية ${toArabicIndic(ayah)}`}
                >
                  <Trash2 className="size-[12px]" aria-hidden="true" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          </AyahEntryCard>
        )
      })}
    </div>
  )
}



