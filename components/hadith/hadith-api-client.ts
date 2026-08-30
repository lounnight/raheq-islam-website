'use client'

import type { Hadith } from '@/types/hadith'


export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    let message = 'Failed to fetch Hadith data'
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}


export function fetchRandomHadith(): Promise<Hadith> {
  return apiFetch<Hadith>('/api/hadith?random=1')
}
