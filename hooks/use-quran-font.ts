'use client'

import { useCallback, useEffect, useState } from 'react'
import { pageFontFaceName, pageFontUrl } from '@/lib/quran/fonts'

export type QcfFontStatus = 'loading' | 'ready' | 'error'

const fontStatus = new Map<string, QcfFontStatus>()

type Listener = (status: QcfFontStatus) => void
const listeners = new Map<string, Listener[]>()

function listen(font: string, cb: Listener): () => void {
  const arr = listeners.get(font) ?? []
  arr.push(cb)
  listeners.set(font, arr)
  return () => {
    const next = (listeners.get(font) ?? []).filter((f) => f !== cb)
    if (next.length) listeners.set(font, next)
    else listeners.delete(font)
  }
}

function emit(font: string, status: QcfFontStatus) {
  fontStatus.set(font, status)
  ;(listeners.get(font) ?? []).forEach((cb) => cb(status))
}

let inFlightFonts = new Set<string>()

async function loadFontFace(font: string, url: string) {
  if (fontStatus.get(font) === 'ready') return
  if (inFlightFonts.has(font)) return
  inFlightFonts.add(font)
  try {
    const face = new FontFace(font, `url('${url}') format('truetype')`)
    const loaded = await face.load()
    document.fonts.add(loaded)
    emit(font, 'ready')
  } catch (err) {
    console.error(`[quran-font] Failed to load QCF page font "${font}" from "${url}"`, err)
    emit(font, 'error')
  } finally {
    inFlightFonts.delete(font)
  }
}

export function useQuranPageFont(pageNumber: number) {
  const fontName = pageFontFaceName(pageNumber)
  const fontUrl = pageFontUrl(pageNumber)

  const [status, setStatus] = useState<QcfFontStatus>(
    () => fontStatus.get(fontName) ?? 'loading'
  )

  useEffect(() => {
    let active = true
    const apply = (s: QcfFontStatus) => {
      if (active) setStatus(s)
    }

    const current = fontStatus.get(fontName)
    if (current === 'ready') {
      apply('ready')
      return undefined
    }

    apply(current ?? 'loading')
    if (current === 'loading') {
      return listen(fontName, apply)
    }

    fontStatus.set(fontName, 'loading')
    const unsubscribe = listen(fontName, apply)
    loadFontFace(fontName, fontUrl)
    return () => {
      unsubscribe()
      active = false
    }
  }, [fontName, fontUrl])

  const reload = useCallback(() => {
    fontStatus.delete(fontName)
    inFlightFonts.delete(fontName)
    setStatus('loading')
    loadFontFace(fontName, fontUrl)
  }, [fontName, fontUrl])

  return { fontName, fontUrl, status, reload }
}
