import type { Dhikr, Prayer, Surah } from '@/types'

export const prayers: Prayer[] = [
  { name: 'الفجر', arabic: 'فجر', time: '04:32' },
  { name: 'الشروق', arabic: 'شروق', time: '05:54' },
  { name: 'الظهر', arabic: 'ظهر', time: '12:06', isNext: true },
  { name: 'العصر', arabic: 'عصر', time: '15:32' },
  { name: 'المغرب', arabic: 'مغرب', time: '18:18' },
  { name: 'العشاء', arabic: 'عشاء', time: '19:42' },
]

export const surahs: Surah[] = [
  { id: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', verses: 7, type: 'مكية', progress: 72 },
  { id: 2, name: 'البقرة', englishName: 'Al-Baqarah', verses: 286, type: 'مدنية' },
  { id: 3, name: 'آل عمران', englishName: 'Aal-E-Imran', verses: 200, type: 'مدنية' },
  { id: 4, name: 'النساء', englishName: 'An-Nisa', verses: 176, type: 'مدنية' },
  { id: 5, name: 'المائدة', englishName: 'Al-Ma’idah', verses: 120, type: 'مدنية' },
  { id: 6, name: 'الأنعام', englishName: 'Al-An’am', verses: 165, type: 'مكية' },
  { id: 7, name: 'الأعراف', englishName: 'Al-A’raf', verses: 206, type: 'مكية' },
  { id: 8, name: 'الأنفال', englishName: 'Al-Anfal', verses: 75, type: 'مدنية' },
]

export const adhkar: Dhikr[] = [
  { id: '1', category: 'أذكار الصباح', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ.', count: 1 },
  { id: '2', category: 'أذكار الصباح', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.', count: 3 },
  { id: '3', category: 'أذكار المساء', text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ.', count: 1 },
]

