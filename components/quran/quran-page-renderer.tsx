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
  const primarySurahName =
    surahName ||
    (layoutHeaderLines[0]?.type === "surah-header"
      ? `سورة ${extractSurahName(layoutHeaderLines[0].text)}`
      : "") ||
    pageData.surahHeaderInfo[0]?.name ||
    (firstVerse ? `سورة ${toArabicIndic(firstVerse.surah_number)}` : "");

  const textReady = status === "ready";
  const layoutFailed = !layout;

  const headings: SurahHeading[] = pageData.surahHeaderInfo
    .filter((h) => !(page === 1 && h.surahNumber === 1))
    .map((h) => ({ surahNumber: h.surahNumber, name: h.name }));

  const showStandaloneHeadings = !layout && headings.length > 0;

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

          {showStandaloneHeadings && <MushafSurahHeading headings={headings} />}

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
              style={{ marginTop: '20px', marginBottom: '20px' }}
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