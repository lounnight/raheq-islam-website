
export type QuranSourceType = 'tafsir' | 'translation'

export interface QuranSource {

  id: string

  name: string

  language: string

  type: QuranSourceType

  url: string
}


export const QURAN_DATA_BASE =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/quran'


export const TAFSIR_DIR_URL = `${QURAN_DATA_BASE}/tafsser`


export const VERSE_TEXT_URL = `${QURAN_DATA_BASE}/text/quran_normal_text.json`

function sourceUrl(id: string): string {
  return `${TAFSIR_DIR_URL}/${id}.json`
}


function languageName(code: string): string {
  const names: Record<string, string> = {
    ar: 'العربية',
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    es: 'Español',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    ur: 'اردو',
    tr: 'Türkçe',
    id: 'Bahasa Indonesia',
    ms: 'Bahasa Melayu',
    nl: 'Nederlands',
    sv: 'Svenska',
    sw: 'Kiswahili',
    ta: 'தமிழ்',
    th: 'ไทย',
    zh: '简体中文',
    bn: 'বাংলা',
    bs: 'Bosanski',
    ha: 'Hausa',
    ku: 'کوردی',
    ml: 'മലയാളം',
    so: 'Soomaali',
    sq: 'Shqip',
    uz: 'O‘zbekcha',
    pr: 'Pr',
  }
  return names[code] ?? code.toUpperCase()
}

export const TAFSIR_SOURCES: QuranSource[] = [
  { id: 'ar_muyassar', name: 'التفسير الميسر', language: 'ar', type: 'tafsir', url: sourceUrl('ar_muyassar') },
  { id: 'sa3dy', name: 'تفسير السعدي', language: 'ar', type: 'tafsir', url: sourceUrl('sa3dy') },
  { id: 'katheer', name: 'تفسير ابن كثير', language: 'ar', type: 'tafsir', url: sourceUrl('katheer') },
  { id: 'baghawy', name: 'تفسير البغوي', language: 'ar', type: 'tafsir', url: sourceUrl('baghawy') },
  { id: 'qortoby', name: 'تفسير القرطبي', language: 'ar', type: 'tafsir', url: sourceUrl('qortoby') },
  { id: 'tabary', name: 'تفسير الطبري', language: 'ar', type: 'tafsir', url: sourceUrl('tabary') },
  { id: 'waseet', name: 'التفسير الوسيط', language: 'ar', type: 'tafsir', url: sourceUrl('waseet') },
  { id: 'tafheem', name: 'تفهيم القرآن', language: 'ar', type: 'tafsir', url: sourceUrl('tafheem') },
  { id: 'tanweer', name: 'تفسير التحرير والتنوير', language: 'ar', type: 'tafsir', url: sourceUrl('tanweer') },
]

export const TRANSLATION_SOURCES: QuranSource[] = [
  { id: 'en_sahih', name: languageName('en'), language: 'en', type: 'translation', url: sourceUrl('en_sahih') },
  { id: 'fr_hamidullah', name: languageName('fr'), language: 'fr', type: 'translation', url: sourceUrl('fr_hamidullah') },
  { id: 'de_bubenheim', name: languageName('de'), language: 'de', type: 'translation', url: sourceUrl('de_bubenheim') },
  { id: 'es_navio', name: languageName('es'), language: 'es', type: 'translation', url: sourceUrl('es_navio') },
  { id: 'it_piccardo', name: languageName('it'), language: 'it', type: 'translation', url: sourceUrl('it_piccardo') },
  { id: 'pt_elhayek', name: languageName('pt'), language: 'pt', type: 'translation', url: sourceUrl('pt_elhayek') },
  { id: 'ru_kuliev', name: languageName('ru'), language: 'ru', type: 'translation', url: sourceUrl('ru_kuliev') },
  { id: 'tr_diyanet', name: languageName('tr'), language: 'tr', type: 'translation', url: sourceUrl('tr_diyanet') },
  { id: 'ur_jalandhry', name: languageName('ur'), language: 'ur', type: 'translation', url: sourceUrl('ur_jalandhry') },
  { id: 'id_indonesian', name: languageName('id'), language: 'id', type: 'translation', url: sourceUrl('id_indonesian') },
  { id: 'ms_basmeih', name: languageName('ms'), language: 'ms', type: 'translation', url: sourceUrl('ms_basmeih') },
  { id: 'nl_siregar', name: languageName('nl'), language: 'nl', type: 'translation', url: sourceUrl('nl_siregar') },
  { id: 'sv_bernstrom', name: languageName('sv'), language: 'sv', type: 'translation', url: sourceUrl('sv_bernstrom') },
  { id: 'sw_barwani', name: languageName('sw'), language: 'sw', type: 'translation', url: sourceUrl('sw_barwani') },
  { id: 'ta_tamil', name: languageName('ta'), language: 'ta', type: 'translation', url: sourceUrl('ta_tamil') },
  { id: 'th_thai', name: languageName('th'), language: 'th', type: 'translation', url: sourceUrl('th_thai') },
  { id: 'bn_bengali', name: languageName('bn'), language: 'bn', type: 'translation', url: sourceUrl('bn_bengali') },
  { id: 'bs_korkut', name: languageName('bs'), language: 'bs', type: 'translation', url: sourceUrl('bs_korkut') },
  { id: 'ha_gumi', name: languageName('ha'), language: 'ha', type: 'translation', url: sourceUrl('ha_gumi') },
  { id: 'ku_asan', name: languageName('ku'), language: 'ku', type: 'translation', url: sourceUrl('ku_asan') },
  { id: 'ml_abdulhameed', name: languageName('ml'), language: 'ml', type: 'translation', url: sourceUrl('ml_abdulhameed') },
  { id: 'so_abduh', name: languageName('so'), language: 'so', type: 'translation', url: sourceUrl('so_abduh') },
  { id: 'sq_nahi', name: languageName('sq'), language: 'sq', type: 'translation', url: sourceUrl('sq_nahi') },
  { id: 'uz_sodik', name: languageName('uz'), language: 'uz', type: 'translation', url: sourceUrl('uz_sodik') },
  { id: 'zh_jian', name: languageName('zh'), language: 'zh', type: 'translation', url: sourceUrl('zh_jian') },
  { id: 'pr_tagi', name: languageName('pr'), language: 'pr', type: 'translation', url: sourceUrl('pr_tagi') },
]


export const QURAN_SOURCES: QuranSource[] = [...TAFSIR_SOURCES, ...TRANSLATION_SOURCES]

export function getSources(): QuranSource[] {
  return QURAN_SOURCES
}

export function getSource(id: string): QuranSource | undefined {
  return QURAN_SOURCES.find((s) => s.id === id)
}


export const DEFAULT_SOURCE_ID = 'ar_muyassar'


export function ayahKey(surah: number, verse: number): string {
  return `${surah}:${verse}`
}
