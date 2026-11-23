/**
 * Quran references: "surah:ayah" for one verse, "surah:ayah-ayah" for a range
 * within one surah. Examples: "34:10-11", "21:80".
 */

export interface QuranRef {
  surah: number;
  from: number;
  to: number;
}

const REF_RE = /^\s*(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*$/;

export function parseRef(text: string): QuranRef | null {
  const m = REF_RE.exec(text);
  if (!m) return null;
  const surah = Number(m[1]);
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  return { surah, from, to };
}

export function formatRef(ref: QuranRef): string {
  return ref.from === ref.to ? `${ref.surah}:${ref.from}` : `${ref.surah}:${ref.from}-${ref.to}`;
}

/**
 * Checks a reference against the dataset's verse counts, where `ayahCounts[s]` is
 * the number of verses in surah s (index 0 unused). Returns an error message, or
 * null if the reference exists.
 */
export function checkRef(text: string, ayahCounts: readonly number[]): string | null {
  const ref = parseRef(text);
  if (!ref) return `"${text}" is not a reference. Use "surah:ayah" or "surah:ayah-ayah", e.g. "34:10-11".`;
  if (formatRef(ref) !== text) return `Write "${text}" as "${formatRef(ref)}".`;
  const count = ayahCounts[ref.surah];
  if (!count) return `Surah ${ref.surah} does not exist (there are ${ayahCounts.length - 1}).`;
  if (ref.from < 1 || ref.to > count) return `Surah ${ref.surah} has ${count} verses, so ${text} does not exist.`;
  if (ref.from > ref.to) return `In ${text} the range is reversed.`;
  return null;
}

/** Whether a reference includes the verse surah:ayah. */
export function refIncludes(ref: QuranRef, surah: number, ayah: number): boolean {
  return ref.surah === surah && ayah >= ref.from && ayah <= ref.to;
}
