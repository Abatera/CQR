/**
 * Arabic text normalization for search. It is applied in memory to the search text
 * and to the query. The Quran source files are never changed.
 */

// Diacritics and Quranic annotation marks: U+064B–U+065F, U+0670, U+06D6–U+06ED.
// Tatweel: U+0640.
const MARKS_RE = /[ً-ٰٟۖ-ۭـ]/g;
const ALEF_RE = /[أإآٱ]/g; // أ إ آ ٱ
const WS_RE = /\s+/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(MARKS_RE, '')
    .replace(ALEF_RE, 'ا') // ا
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/ة/g, 'ه') // ة → ه
    .replace(/ؤ/g, 'و') // ؤ → و
    .replace(/ئ/g, 'ي') // ئ → ي
    .replace(WS_RE, ' ')
    .trim();
}

const ARABIC_LETTER_RE = /[ء-يٱ-ۓ]/;

export function containsArabic(text: string): boolean {
  return ARABIC_LETTER_RE.test(text);
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

/** 34 → "٣٤" */
export function toArabicIndic(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** The verse-end ornament with the verse number, e.g. "۝١٠". */
export function verseEndMark(ayah: number): string {
  return '۝' + toArabicIndic(ayah);
}
