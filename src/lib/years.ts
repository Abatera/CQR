/**
 * Historical years are signed integers: negative for BCE, positive for CE, never 0.
 * The year before 1 CE is -1 (1 BCE).
 *
 * For positions and durations the app converts them to astronomical year numbers,
 * which are continuous (1 BCE = 0, 2 BCE = -1, ...). Every computation that spans
 * the BCE/CE boundary must go through these helpers.
 */

export type Year = number;

/** Historical year to astronomical year number. */
export function toAstro(year: Year): number {
  return year < 0 ? year + 1 : year;
}

/** Astronomical year number to historical year. */
export function fromAstro(astro: number): Year {
  return astro <= 0 ? astro - 1 : astro;
}

/** Position on a continuous axis of the start of a historical year. */
export function yearStart(year: Year): number {
  return toAstro(year);
}

/** Position on a continuous axis of the end of a historical year. */
export function yearEnd(year: Year): number {
  return toAstro(year) + 1;
}

/** Number of years from the start of `from` to the end of `to`, both inclusive. */
export function spanYears(from: Year, to: Year): number {
  return toAstro(to) - toAstro(from) + 1;
}

export function isValidYear(year: unknown): year is Year {
  return typeof year === 'number' && Number.isInteger(year) && year !== 0;
}

/** Era suffixes: BCE/CE in English, ق.م/م (before/after the birth of Christ) in Arabic. */
const ERA = { en: { bce: 'BCE', ce: 'CE' }, ar: { bce: 'ق.م', ce: 'م' } } as const;

export function formatYear(year: Year, lang: 'en' | 'ar' = 'en'): string {
  return year < 0 ? `${-year} ${ERA[lang].bce}` : `${year} ${ERA[lang].ce}`;
}

/** "1010–970 BCE", "30 BCE – 14 CE", "1177 BCE"; in Arabic "1010–970 ق.م". */
export function formatRange(from: Year, to: Year, lang: 'en' | 'ar' = 'en'): string {
  if (from === to) return formatYear(from, lang);
  if (from < 0 && to < 0) return `${-from}–${-to} ${ERA[lang].bce}`;
  if (from > 0 && to > 0) return `${from}–${to} ${ERA[lang].ce}`;
  return `${formatYear(from, lang)} – ${formatYear(to, lang)}`;
}

/** Whether two inclusive year ranges overlap. */
export function rangesOverlap(aFrom: Year, aTo: Year, bFrom: Year, bTo: Year): boolean {
  return toAstro(aFrom) <= toAstro(bTo) && toAstro(bFrom) <= toAstro(aTo);
}

const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];

export interface Tick {
  /** Historical year the tick marks. */
  year: Year;
  /** Position on the continuous axis (start of that year). */
  pos: number;
  label: string;
}

/**
 * Round-numbered ticks for the visible range [startPos, endPos] of the continuous
 * axis, spaced at least `minPx` apart on an axis `widthPx` wide.
 */
export function axisTicks(startPos: number, endPos: number, widthPx: number, minPx = 80): Tick[] {
  const span = endPos - startPos;
  if (!(span > 0) || !(widthPx > 0)) return [];
  const yearsPerPx = span / widthPx;
  const step = TICK_STEPS.find((s) => s / yearsPerPx >= minPx) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: Tick[] = [];
  const first = Math.floor(fromAstro(Math.floor(startPos)) / step) * step;
  for (let y = first; toAstro(y) <= endPos; y += step) {
    if (y === 0) continue;
    const pos = toAstro(y);
    if (pos < startPos) continue;
    ticks.push({ year: y, pos, label: formatYear(y) });
  }
  return ticks;
}
