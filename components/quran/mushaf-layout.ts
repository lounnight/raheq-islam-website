import type { CSSProperties } from "react";



export const PAGE_ASPECT_RATIO = 1.4142;
export const PAGE_LINE_COUNT = 15;
export const PAGE_LINE_HEIGHT = 1.9;
export const PAGE_FONT_FACTOR = 4.8;

export const PAGE_INSET_X = "8.4%";
export const PAGE_INSET_TOP = "7.7%";
export const PAGE_INSET_BOTTOM = "7.2%";

export const MUSHAF_PAGE_STYLE = {
  "--mushaf-page-ratio": String(PAGE_ASPECT_RATIO),
  "--mushaf-line-count": String(PAGE_LINE_COUNT),
  "--mushaf-line-height": String(PAGE_LINE_HEIGHT),
  "--mushaf-inset-x": PAGE_INSET_X,
  "--mushaf-inset-top": PAGE_INSET_TOP,
  "--mushaf-inset-bottom": PAGE_INSET_BOTTOM,
  "--mushaf-font-factor": String(PAGE_FONT_FACTOR),
} as CSSProperties & Record<`--${string}`, string>;