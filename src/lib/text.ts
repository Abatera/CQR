/** Lowercases Latin text and drops the marks used in transliteration, so "ʿAd", "'Ad" and "ad" all match. */
export function foldLatin(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’ʿʾ`]/g, '')
    .toLowerCase();
}
