import { describe, expect, it } from 'vitest';
import { containsArabic, normalizeArabic, toArabicIndic, verseEndMark } from '../src/lib/arabic';

describe('arabic normalization', () => {
  it('strips diacritics and tatweel', () => {
    expect(normalizeArabic('كَتَبَ')).toBe('كتب'); // كَتَبَ → كتب
    expect(normalizeArabic('كـتب')).toBe('كتب'); // كـتب → كتب
  });

  it('unifies alef forms, alef maqsura, ta marbuta and hamza seats', () => {
    for (const alef of ['أ', 'إ', 'آ', 'ٱ']) expect(normalizeArabic(alef)).toBe('ا');
    expect(normalizeArabic('ى')).toBe('ي');
    expect(normalizeArabic('ة')).toBe('ه');
    expect(normalizeArabic('ؤ')).toBe('و');
    expect(normalizeArabic('ئ')).toBe('ي');
  });

  it('collapses whitespace', () => {
    expect(normalizeArabic('  ا   ب ')).toBe('ا ب');
  });

  it('detects Arabic and formats verse numbers', () => {
    expect(containsArabic('iron')).toBe(false);
    expect(containsArabic('حديد')).toBe(true);
    expect(toArabicIndic(34)).toBe('٣٤');
    expect(verseEndMark(10)).toBe('۝١٠');
  });
});
