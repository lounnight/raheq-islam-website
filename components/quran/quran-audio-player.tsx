'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'

import type { SurahMeta } from '@/types/quran'
import {
  getAudioReciters,
  type AudioReciter,
} from '@/services/quran-audio-service'
import {
  useQuranAudioActions,
  useQuranAudioCore,
  useQuranAudioTime,
} from '@/hooks/use-quran-audio'
import { toArabicIndic } from './mushaf-utils'

export interface QuranAudioPlayerProps {
  surahs: SurahMeta[]

  surahName: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function QuranAudioPlayer({ surahs, surahName }: QuranAudioPlayerProps) {
  const core = useQuranAudioCore()
  const time = useQuranAudioTime()
  const actions = useQuranAudioActions()
  const [reciters, setReciters] = useState<AudioReciter[] | null>(null)
  const [recitersError, setRecitersError] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ok = true
    getAudioReciters()
      .then((r) => ok && setReciters(r))
      .catch(() => ok && setRecitersError(true))
    return () => {
      ok = false
    }
  }, [])

  const reciterName = useMemo(() => {
    if (!core.reciterId) return null
    return reciters?.find((r) => r.id === core.reciterId)?.name ?? core.reciterId
  }, [core.reciterId, reciters])

  const currentSurahMeta = core.surah ? surahs.find((s) => s.number === core.surah) : null
  const info = core.currentAyah
    ? `سورة ${currentSurahMeta?.name ?? surahName} — الآية ${toArabicIndic(core.ayah ?? 1)}`
    : 'اختر آية لبدء الاستماع'

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = progressRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const fraction = (rect.right - e.clientX) / rect.width
    actions.seek(fraction)
  }

  if (!core.currentAyah) {
    return null
  }

  return (
    <div
      className="fixed bottom-[1rem] left-1/2 z-40 w-[calc(100%-2rem)] max-w-[56rem] -translate-x-1/2 rounded-[0.75rem] border border-border bg-card shadow-[0_8px_24px_-10px_rgb(0_0_0/0.35)]"
      role="region"
      aria-label="مشغل التلاوة"
    >
      
      {core.error && (
        <div
          className="flex items-center gap-[0.4rem] border-b border-[color-mix(in_oklab,var(--destructive)_25%,transparent)] px-[0.75rem] py-[0.35rem] text-[0.72rem] text-destructive [background:color-mix(in_oklab,var(--destructive)_8%,transparent)]"
          role="alert"
        >
          <AlertCircle className="size-[14px]" aria-hidden="true" />
          <span>{core.error}</span>
          <button
            type="button"
            className="ms-auto cursor-pointer border-none bg-transparent font-bold text-inherit underline"
            onClick={() => void actions.retry()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 p-2">
        
        <button
          type="button"
          className="grid size-[2.4rem] shrink-0 cursor-pointer place-items-center rounded-full border border-primary bg-primary text-primary-foreground transition-colors duration-100 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            if (core.surah && core.ayah) {
              if (core.isPlaying) {
                actions.toggle()
              } else {
                void actions.playFrom(core.surah, core.ayah)
              }
            }
          }}
          disabled={!core.currentAyah}
          aria-label={core.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          {core.isPlaying ? <Pause className="size-[16px]" /> : <Play className="size-[16px]" />}
        </button>
        <button
          type="button"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-muted text-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => void actions.previous()}
          disabled={!core.currentAyah}
          aria-label="الآية السابقة"
          title="الآية السابقة"
        >
          <ChevronRight className="size-[16px]" />
        </button>
        <button
          type="button"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-muted text-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => void actions.next()}
          disabled={!core.currentAyah}
          aria-label="الآية التالية"
          title="الآية التالية"
        >
          <ChevronLeft className="size-[16px]" />
        </button>

        
        <select
          className="h-8 max-w-[11rem] shrink-0 cursor-pointer rounded-[0.4rem] border border-border bg-transparent px-[0.4rem] text-[0.75rem] text-foreground outline-none"
          value={core.reciterId ?? ''}
          onChange={(e) => void actions.setReciter(e.target.value)}
          aria-label="اختيار القارئ"
          disabled={recitersError || !reciters}
        >
          {recitersError && <option value="">تعذر تحميل القراء</option>}
          {!reciters && !recitersError && <option value="">جارٍ التحميل…</option>}
          {reciters?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name || r.englishName}
            </option>
          ))}
        </select>

        
        <span className="min-w-0 overflow-hidden text-[0.72rem] font-semibold whitespace-nowrap text-muted-foreground [text-overflow:ellipsis]" aria-live="polite">
          {info}
          {reciterName && core.currentAyah ? ` · ${reciterName}` : ''}
        </span>

        
        <div
          ref={progressRef}
          className="relative h-[0.4rem] min-w-[4rem] flex-1 cursor-pointer overflow-hidden rounded-full bg-muted"
          onClick={handleSeek}
          role="slider"
          aria-label="تقدم الآية"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(time.progress * 100)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') actions.seek(Math.max(0, time.progress - 0.05))
            if (e.key === 'ArrowRight') actions.seek(Math.min(1, time.progress + 0.05))
          }}
        >
          <span
            className="absolute inset-y-0 right-0 rounded-full bg-primary [transition:width_0.25s_linear]"
            style={{ width: `${time.progress * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[0.68rem] text-muted-foreground tabular-nums" dir="ltr">
          {formatTime(time.currentTime)} / {formatTime(time.duration)}
        </span>

        
        <button
          type="button"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-muted text-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
          onClick={actions.stop}
          aria-label="إيقاف التلاوة وإغلاق المشغل"
          title="إيقاف وإغلاق"
        >
          <X className="size-[16px]" />
        </button>
      </div>
    </div>
  )
}
