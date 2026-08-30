import type { Hadith } from '@/types/hadith'

export const curatedHadiths: Hadith[] = [
  {
    id: 'curated:intention',
    bookId: 'bukhari',
    bookName: 'صحيح البخاري',
    hadithNumber: 1,
    arabic:
      'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    narrator: 'عَنْ عُمَرَ بْنِ الْخَطَّابِ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['رواه البخاري ومسلم'],
  },
  {
    id: 'curated:mercy',
    bookId: 'muslim',
    bookName: 'صحيح مسلم',
    hadithNumber: 2599,
    arabic:
      'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ',
    narrator: 'عَنْ عَبْدِ اللهِ بْنِ عَمْرٍو',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['رواه أبو داود والترمذي'],
  },
  {
    id: 'curated:neighbor',
    bookId: 'bukhari',
    bookName: 'صحيح البخاري',
    hadithNumber: 6016,
    arabic:
      'مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ',
    narrator: 'عَنْ أَبِي هُرَيْرَةَ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['متفق عليه'],
  },
  {
    id: 'curated:tongue',
    bookId: 'bukhari',
    bookName: 'صحيح البخاري',
    hadithNumber: 6018,
    arabic:
      'مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    narrator: 'عَنْ أَبِي هُرَيْرَةَ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['متفق عليه'],
  },
  {
    id: 'curated:love',
    bookId: 'bukhari',
    bookName: 'صحيح البخاري',
    hadithNumber: 13,
    arabic:
      'لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    narrator: 'عَنْ أَنَسِ بْنِ مَالِكٍ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['متفق عليه'],
  },
  {
    id: 'curated:ease',
    bookId: 'muslim',
    bookName: 'صحيح مسلم',
    hadithNumber: 2699,
    arabic:
      'يَسِّرُوا وَلا تُعَسِّرُوا، وَبَشِّرُوا وَلا تُنَفِّرُوا',
    narrator: 'عَنْ أَنَسِ بْنِ مَالِكٍ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['متفق عليه'],
  },
  {
    id: 'curated:cleanliness',
    bookId: 'muslim',
    bookName: 'صحيح مسلم',
    hadithNumber: 223,
    arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ',
    narrator: 'عَنْ أَبِي مَالِكٍ الأَشْعَرِيِّ',
    grades: ['Sahih'],
    grading: 'صحيح',
    references: ['رواه مسلم'],
  },
]

export function getCuratedHadithForDate(date: Date = new Date()): Hadith | null {
  if (curatedHadiths.length === 0) return null
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return curatedHadiths[dayIndex % curatedHadiths.length]
}
