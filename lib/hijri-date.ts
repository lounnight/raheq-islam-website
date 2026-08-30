
const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
]

const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
]

const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
]

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']


function toArabicIndic(value: number | string): string {
  const s = String(value)
  let out = ''
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') out += ARABIC_INDIC[ch.charCodeAt(0) - 48]
    else out += ch
  }
  return out
}

export function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  let jd =
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045

  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const lRem = l - 10631 * n + 354
  const j =
    Math.floor((10985 - lRem) / 5316) * Math.floor((50 * lRem) / 17719) +
    Math.floor(lRem / 5670) * Math.floor((43 * lRem) / 15238)
  const lFinal = lRem - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const month = Math.floor((24 * lFinal) / 709)
  const day = lFinal - Math.floor((709 * month) / 24)
  const year = 30 * n + j - 30

  return { year, month, day }
}


export function getArabicDayName(date: Date): string {
  return ARABIC_DAYS[date.getDay()]
}


export function getHijriMonthName(month: number): string {
  return HIJRI_MONTHS[month - 1] ?? ''
}


export function getGregorianMonthName(month: number): string {
  return GREGORIAN_MONTHS_AR[month - 1] ?? ''
}


export function formatHijriDate(date: Date): string {
  const hijri = gregorianToHijri(date)
  const dayName = getArabicDayName(date)
  const monthName = getHijriMonthName(hijri.month)
  return `${dayName}، ${toArabicIndic(hijri.day)} ${monthName} ${toArabicIndic(hijri.year)} هـ`
}


export function formatGregorianDate(date: Date): string {
  const day = date.getDate()
  const monthName = getGregorianMonthName(date.getMonth() + 1)
  const year = date.getFullYear()
  return `${toArabicIndic(day)} ${monthName} ${toArabicIndic(year)}`
}
