
const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toArabicIndic(value: number | string): string {
  const s = String(value)
  let out = ''
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') out += ARABIC_INDIC[ch.charCodeAt(0) - 48]
    else out += ch
  }
  return out
}


export const BISMILLAH = 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ'

export const JUZ_LABEL = 'جزء'
export const HIZB_LABEL = 'حزب'

export function shouldShowBismillah(surahNumber: number): boolean {
  return surahNumber !== 1 && surahNumber !== 9
}