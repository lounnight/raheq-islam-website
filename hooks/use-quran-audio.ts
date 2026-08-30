'use client'

import { useEffect, useState } from 'react'
import {
  advancePosition,
  ayahCountsFromSurahList,
  BITRATE_FALLBACK_LADDER,
  bitrateForReciter,
  buildAyahAudioUrl,
  getAudioReciters,
  getStoredReciterId,
  globalAyahId,
  retreatPosition,
  storeReciterId,
} from '@/services/quran-audio-service'

export type QuranAudioState = {
  reciterId: string | null
  currentAyah: string | null
  surah: number | null
  ayah: number | null
  isPlaying: boolean
  duration: number
  currentTime: number
  progress: number
  error: string | null
  isLoading: boolean
}

const INITIAL_STATE: QuranAudioState = {
  reciterId: null,
  currentAyah: null,
  surah: null,
  ayah: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  progress: 0,
  error: null,
  isLoading: false,
}

class QuranAudioController {
  private audio: HTMLAudioElement | null = null
  private coreListeners = new Set<() => void>()
  private timeListeners = new Set<() => void>()
  private state: QuranAudioState = INITIAL_STATE
  private counts: Record<number, number> | null = null
  private countsPromise: Promise<Record<number, number>> | null = null
  private wantPlay = false
  private workingBitrate: number | null = null
  private triedBitrates = new Set<number>()
  private activeBitrate: number | null = null

  subscribeCore = (fn: () => void): (() => void) => {
    this.coreListeners.add(fn)
    return () => this.coreListeners.delete(fn)
  }
  subscribeTime = (fn: () => void): (() => void) => {
    this.timeListeners.add(fn)
    return () => this.timeListeners.delete(fn)
  }
  getState = (): QuranAudioState => this.state

  private patch(core: Partial<QuranAudioState>, time = false) {
    this.state = { ...this.state, ...core }
    if (time) this.timeListeners.forEach((fn) => fn())
    this.coreListeners.forEach((fn) => fn())
  }

  private patchTime(time: Partial<QuranAudioState>) {
    this.state = { ...this.state, ...time }
    this.timeListeners.forEach((fn) => fn())
  }

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio
    const audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('play', () => this.patch({ isPlaying: true, error: null }))
    audio.addEventListener('canplay', () => {
      if (this.activeBitrate) {
        this.workingBitrate = this.activeBitrate
        this.triedBitrates.clear()
      }
    })
    audio.addEventListener('pause', () => this.patch({ isPlaying: false }))
    audio.addEventListener('ended', () => void this.handleEnded())
    audio.addEventListener('loadedmetadata', () =>
      this.patchTime({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 })
    )
    audio.addEventListener('timeupdate', () => {
      const duration = this.state.duration || audio.duration || 0
      this.patchTime({
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : duration,
        progress: duration > 0 ? Math.min(1, audio.currentTime / duration) : 0,
      })
    })
    audio.addEventListener('error', () => {
      if (!audio.src || !this.wantPlay || !this.state.surah || !this.state.ayah) return
      const nextBitrate = BITRATE_FALLBACK_LADDER.find(
        (br) => !this.triedBitrates.has(br) && br !== this.activeBitrate
      )
      if (nextBitrate) {
        this.triedBitrates.add(this.activeBitrate ?? 0)
        void this.playFrom(this.state.surah, this.state.ayah, undefined, nextBitrate)
        return
      }
      this.wantPlay = false
      this.patch(
        { error: 'تعذر تشغيل الصوت — تحقق من الاتصال وحاول مجددًا.', isPlaying: false },
        true
      )
    })
    this.audio = audio
    return audio
  }

  private ensureCounts(): Promise<Record<number, number>> {
    if (this.counts) return Promise.resolve(this.counts)
    if (!this.countsPromise) {
      this.countsPromise = import('@/services/quran-service')
        .then((m) => m.getSurahs())
        .then((surahs) => {
          this.counts = ayahCountsFromSurahList(surahs)
          return this.counts
        })
    }
    return this.countsPromise
  }

  private async resolveReciter(explicit?: string): Promise<string> {
    if (explicit) {
      storeReciterId(explicit)
      this.patch({ reciterId: explicit })
      return explicit
    }
    const stored = this.state.reciterId ?? getStoredReciterId()
    if (stored) {
      this.patch({ reciterId: stored })
      return stored
    }
    const reciters = await getAudioReciters()
    const first = reciters[0]
    storeReciterId(first.id)
    this.patch({ reciterId: first.id })
    return first.id
  }

  async playFrom(
    surah: number,
    ayah: number,
    reciterId?: string,
    bitrateOverride?: number
  ): Promise<void> {
    try {
      const reciter = await this.resolveReciter(reciterId)
      const counts = await this.ensureCounts()
      const globalId = globalAyahId(surah, ayah, counts)
      const audio = this.ensureAudio()
      const bitrate =
        bitrateOverride ??
        this.workingBitrate ??
        bitrateForReciter(reciter)
      this.activeBitrate = bitrate
      this.wantPlay = true
      this.patch({
        currentAyah: `${surah}:${ayah}`,
        surah,
        ayah,
        error: null,
        isLoading: true,
        duration: 0,
        currentTime: 0,
        progress: 0,
      })
      audio.src = buildAyahAudioUrl(reciter, globalId, bitrate)
      await audio.play()
    } catch (err) {
      this.wantPlay = false
      this.patch(
        {
          error:
            err instanceof Error && err.message.includes('reciters')
              ? 'تعذر تحميل قائمة القراء — حاول مجددًا.'
              : 'تعذر تشغيل الصوت — حاول مجددًا.',
          isPlaying: false,
          isLoading: false,
        },
        true
      )
    }
  }

  private async handleEnded(): Promise<void> {
    const counts = await this.ensureCounts()
    if (!this.state.surah || !this.state.ayah) return
    const next = advancePosition(this.state.surah, this.state.ayah, counts)
    if (!next) {
      this.wantPlay = false
      this.patch({ isPlaying: false, isLoading: false }, true)
      return
    }
    await this.playFrom(next.surah, next.ayah)
  }

  async next(): Promise<void> {
    const counts = await this.ensureCounts()
    if (!this.state.surah || !this.state.ayah) return
    const next = advancePosition(this.state.surah, this.state.ayah, counts)
    if (next) await this.playFrom(next.surah, next.ayah)
  }

  async previous(): Promise<void> {
    const counts = await this.ensureCounts()
    if (!this.state.surah || !this.state.ayah) return
    const prev = retreatPosition(this.state.surah, this.state.ayah, counts)
    if (prev) await this.playFrom(prev.surah, prev.ayah)
  }

  toggle(): void {
    const audio = this.ensureAudio()
    if (this.state.isPlaying) {
      this.wantPlay = false
      audio.pause()
      return
    }
    if (this.state.currentAyah && audio.src) {
      this.wantPlay = true
      void audio.play().catch(() => {
        if (this.state.surah && this.state.ayah) {
          void this.playFrom(this.state.surah, this.state.ayah)
        }
      })
    }
  }

  seek(fraction: number): void {
    const audio = this.audio
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    audio.currentTime = Math.max(0, Math.min(1, fraction)) * audio.duration
  }

  setReciter(reciterId: string): void {
    storeReciterId(reciterId)
    this.patch({ reciterId })
    this.workingBitrate = null
    this.triedBitrates.clear()
  }

  selectAyah(surah: number, ayah: number): void {
    const key = `${surah}:${ayah}`
    this.patch({
      currentAyah: key,
      surah,
      ayah,
      isPlaying: false,
      error: null,
    })
  }

  async retry(): Promise<void> {
    if (this.state.surah && this.state.ayah) {
      await this.playFrom(this.state.surah, this.state.ayah)
    }
  }

  stop(): void {
    this.wantPlay = false
    if (this.audio) {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
    }
    this.patch(
      {
        currentAyah: null,
        surah: null,
        ayah: null,
        isPlaying: false,
        duration: 0,
        currentTime: 0,
        progress: 0,
        error: null,
        isLoading: false,
      },
      true
    )
  }
}

export const quranAudio = new QuranAudioController()

export function useQuranAudioCore(): QuranAudioState {
  const [state, setState] = useState(quranAudio.getState)
  useEffect(() => quranAudio.subscribeCore(() => setState(quranAudio.getState())), [])
  return state
}

export function useQuranAudioTime(): Pick<
  QuranAudioState,
  'duration' | 'currentTime' | 'progress'
> {
  const [time, setTime] = useState(() => ({
    duration: quranAudio.getState().duration,
    currentTime: quranAudio.getState().currentTime,
    progress: quranAudio.getState().progress,
  }))
  useEffect(
    () =>
      quranAudio.subscribeTime(() => {
        const s = quranAudio.getState()
        setTime((prev) =>
          prev.duration === s.duration &&
          prev.currentTime === s.currentTime &&
          prev.progress === s.progress
            ? prev // referentially stable — avoids needless re-renders
            : { duration: s.duration, currentTime: s.currentTime, progress: s.progress }
        )
      }),
    []
  )
  return time
}

export function useQuranAudioActions() {
  return {
    playFrom: (surah: number, ayah: number) => quranAudio.playFrom(surah, ayah),
    toggle: () => quranAudio.toggle(),
    next: () => quranAudio.next(),
    previous: () => quranAudio.previous(),
    seek: (fraction: number) => quranAudio.seek(fraction),
    setReciter: (id: string) => quranAudio.setReciter(id),
    selectAyah: (surah: number, ayah: number) => quranAudio.selectAyah(surah, ayah),
    retry: () => quranAudio.retry(),
    stop: () => quranAudio.stop(),
  }
}

export type QuranAudioActions = ReturnType<typeof useQuranAudioActions>
