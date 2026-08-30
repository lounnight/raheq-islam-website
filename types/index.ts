export type Prayer = { name: string; time: string; arabic: string; isNext?: boolean }
export type Surah = { id: number; name: string; englishName: string; verses: number; type: string; progress?: number }
export type Dhikr = { id: string; text: string; count: number; category: string }

export const navItems = [
  { href: '/', label: 'الرئيسية', icon: 'home' },
  { href: '/quran', label: 'القرآن الكريم', icon: 'book-open' },
  { href: '/hadith', label: 'الأحاديث', icon: 'scroll-text' },
  { href: '/adhkar', label: 'الأذكار', icon: 'heart' },
  { href: '/questions', label: 'الأسئلة', icon: 'list-checks' },
  { href: '/prayer', label: 'أوقات الصلاة', icon: 'clock' },
] as const
