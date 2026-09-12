"use client";

import { useQuranPageFont } from "@/hooks/use-quran-font";
import type { QuranPageData, MushafPageLayout } from "@/types/quran";
import { MushafHeader } from "./mushaf-header";
import { MushafFooter } from "./mushaf-footer";
import { MushafSurahHeading, type SurahHeading } from "./mushaf-surah-heading";
import { MushafText } from "./mushaf-text";
import { pageFontFaceName } from "@/lib/quran/fonts";
import { toArabicIndic } from "./mushaf-utils";
import {
  MUSHAF_PAGE_STYLE,
  PAGE_LINE_HEIGHT,
  PAGE_LINE_COUNT,
} from "./mushaf-layout";

export function getPageSurahHeadings(
  pageData: QuranPageData,
  surahName?: string
): SurahHeading[] {
  const map = new Map<number, SurahHeading>()

  for (const heading of pageData.surahHeaderInfo ?? []) {
    map.set(heading.surahNumber, {
      surahNumber: heading.surahNumber,
      name: heading.name || surahName || `سورة ${heading.surahNumber}`,
    })
  }

  for (const verse of pageData.verses ?? []) {
    if (verse.verse_number !== 1) continue
    if (map.has(verse.surah_number)) continue
    map.set(verse.surah_number, {
      surahNumber: verse.surah_number,
      name: surahName || `سورة ${verse.surah_number}`,
    })
  }

  return [...map.values()].sort((a, b) => a.surahNumber - b.surahNumber)
}

type QuranPageRendererProps = {
  pageData: QuranPageData;
  layout?: MushafPageLayout | null;
  surahName?: string;
  showFooter?: boolean;
  showHeader?: boolean;
};

export function QuranPageRenderer({
  pageData,
  layout,
  surahName,
  showFooter = true,
  showHeader = true,
}: QuranPageRendererProps) {
  const page = pageData.pageNumber;
  const { fontName, status } = useQuranPageFont(page);

  const layoutHeaderLines = layout
    ? layout.lines.filter((l) => l.type === "surah-header")
    : [];
  const firstVerse = pageData.verses[0];
  const headings = getPageSurahHeadings(pageData, surahName);

  const primarySurahName =
    surahName ||
    headings[0]?.name ||
    (layoutHeaderLines[0]?.type === "surah-header"
      ? `سورة ${extractSurahName(layoutHeaderLines[0].text)}`
      : "") ||
    (firstVerse ? `سورة ${toArabicIndic(firstVerse.surah_number)}` : "");

  const textReady = status === "ready";
  const layoutFailed = !layout;

  const layoutHeaderSurahNumbers = new Set(
    layoutHeaderLines
      .filter((line): line is Extract<typeof line, { type: "surah-header" }> => line.type === "surah-header")
      .map((line) => line.surah)
  );

  const syntheticHeadings = headings.filter(
    (heading) => !layoutHeaderSurahNumbers.has(heading.surahNumber)
  );

  const visibleHeadings = !layout ? headings : syntheticHeadings;
  const showStandaloneHeadings = (!layout && headings.length > 0) || syntheticHeadings.length > 0;

  const qcfFamily = `'${pageFontFaceName(page)}'`;

  return (
    <div className="mushaf-scroller mx-auto w-full max-w-[640px] [container-type:inline-size]" dir="rtl">
      <article
        className="mushaf-page madinah-mushaf-page relative text-foreground [container-type:inline-size] [font-size:calc(var(--mushaf-font-factor,5.1)*1cqw)]"
        dir="rtl"
        lang="ar"
        aria-label={`صفحة المصحف رقم ${toArabicIndic(page)}`}
        data-page-number={page}
        data-line-count={layout?.lines.length ?? PAGE_LINE_COUNT}
        style={MUSHAF_PAGE_STYLE}
      >
        <div className="mushaf-page-inner relative z-[1] flex flex-col">
          {showHeader && (
            <MushafHeader
              juzNumber={pageData.juzNumber}
              hizbNumber={pageData.hizbNumber}
              pageNumber={page}
              surahTitle={primarySurahName}
            />
          )}

          {showStandaloneHeadings && <MushafSurahHeading headings={visibleHeadings} />}

          {status === "error" ? (
            <div className="px-[1em] py-[2em] text-center text-destructive" role="alert">
              <p>تعذّر تحميل خط هذه الصفحة القرآني.</p>
              <p style={{ fontSize: "0.85em" }}>(QCF {fontName})</p>
            </div>
          ) : !textReady ? (
            <div className="px-[1em] py-[2em] text-center text-muted-foreground" aria-live="polite">
              <p>جاري تجهيز صفحة المصحف…</p>
              <small>تحميل خط المصحف ({toArabicIndic(page)})</small>
            </div>
          ) : layoutFailed ? (
            <div className="px-[1em] py-[2em] text-center text-destructive" role="alert">
              <p>تعذّر تحميل بنية صفحة المصحف.</p>
              <p style={{ fontSize: "0.85em" }}>لا يمكن عرض النص دون تخطيط الأسطر.</p>
            </div>
          ) : (
            <main
              className="mushaf-text-region [padding-inline:var(--mushaf-inset-x,8.4%)]"
              aria-label="نص الصفحة القرآني"
              style={{ marginTop: '10px', marginBottom: '10px' }}
            >
              <MushafText
                layout={layout!}
                fontFamily={qcfFamily}
                lineHeight={PAGE_LINE_HEIGHT}
              />
            </main>
          )}

          {showFooter && <MushafFooter pageNumber={page} />}
        </div>
      </article>
    </div>
  );
}


function extractSurahName(text: string): string {
  return text.replace(/^سُورَةُ\s+/, "").trim() || text;
}