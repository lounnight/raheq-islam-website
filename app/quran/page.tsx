import { AppShell } from '@/components/app-shell'
import { getSurahs, getQuranPageData } from '@/services/quran-service'
import { getMushafPageLayout } from '@/services/quran/mushaf-layout'
import { getSurahPages, getMadinahPageRanges } from '@/lib/quran-page-map'
import {
  filterMushafPageToSurah,
  filterPageDataToSurah,
} from '@/lib/quran/surah-content'
import { QuranSurahList } from '@/components/quran/quran-surah-list'
import { SurahReader, type SurahPageEntry } from '@/components/quran/surah-reader'
import type { SurahMeta } from '@/types/quran'

async function buildSurahPages(sura: SurahMeta): Promise<SurahPageEntry[]> {
  const pages = getSurahPages(sura.number, sura.numberOfAyahs)

  return Promise.all(
    pages.map(async (page) => {
      const [rawData, rawLayout] = await Promise.all([
        getQuranPageData(page),
        getMushafPageLayout(page).catch((err) => {
          console.error(`Failed to load mushaf layout for page ${page}`, err)
          return null
        }),
      ])
      const pageData = filterPageDataToSurah(rawData, sura.number)
      const layout = rawLayout ? filterMushafPageToSurah(rawLayout, sura.number) : null

      return { pageNumber: page, pageData, layout }
    })
  )
}

function resolveSurahForPage(page: number, surahs: SurahMeta[]): SurahMeta | undefined {
  const ranges = getMadinahPageRanges(page)
  if (!ranges.length) return undefined
  const target = ranges.find((r) => r.start === 1) ?? ranges[ranges.length - 1]
  return surahs.find((s) => s.number === target.surah)
}

export default async function QuranPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; surah?: string; ayah?: string }>
}) {
  const { page: pageStr, surah: surahStr, ayah: ayahStr } = await searchParams
  const surahs = await getSurahs()
  const focusAyah = ayahStr ? Number.parseInt(ayahStr, 10) : null

  if (surahStr) {
    const sNum = parseInt(surahStr, 10)
    const sura = surahs.find((s) => s.number === sNum)
    if (sura && sura.numberOfAyahs > 0) {
      const pages = await buildSurahPages(sura)
      return (
        <AppShell>
          <SurahReader
            surahs={surahs}
            sura={sura}
            pages={pages}
            focusAyah={focusAyah && focusAyah >= 1 ? focusAyah : null}
          />
        </AppShell>
      )
    }
  }

  if (pageStr) {
    const p = parseInt(pageStr, 10)
    if (!isNaN(p) && p >= 1 && p <= 604) {
      const sura = resolveSurahForPage(p, surahs)
      if (sura && sura.numberOfAyahs > 0) {
        const pages = await buildSurahPages(sura)
        return (
          <AppShell>
            <SurahReader
              surahs={surahs}
              sura={sura}
              pages={pages}
              focusAyah={focusAyah && focusAyah >= 1 ? focusAyah : null}
            />
          </AppShell>
        )
      }
    }
  }

  return (
    <AppShell>
      <QuranSurahList surahs={surahs} />
    </AppShell>
  )
}

