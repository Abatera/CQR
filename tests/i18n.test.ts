import { describe, expect, it } from 'vitest';
import { coreText, pick, versesText, yearsText } from '../src/lib/i18n';
import { validateContent, type RawContent } from '../src/lib/validate';
import { formatRange, formatYear } from '../src/lib/years';

describe('reading content in Arabic', () => {
  it('shows the Arabic when there is one, and falls back to English with its own direction', () => {
    expect(pick({ en: 'Noah', ar: 'نوح' }, 'ar')).toEqual({ text: 'نوح', lang: 'ar', dir: 'rtl' });
    expect(pick({ en: 'Noah' }, 'ar')).toEqual({ text: 'Noah', lang: 'en', dir: 'ltr' });
    expect(pick({ en: 'Noah', ar: 'نوح' }, 'en')).toEqual({ text: 'Noah', lang: 'en', dir: 'ltr' });
    expect(pick(undefined, 'ar').text).toBe('');
  });

  it('writes years with ق.م and م in Arabic', () => {
    expect(formatYear(-1010, 'ar')).toBe('1010 ق.م');
    expect(formatYear(632, 'ar')).toBe('632 م');
    expect(formatRange(-1010, -970, 'ar')).toBe('1010–970 ق.م');
    expect(formatRange(-6, 28, 'ar')).toBe('6 ق.م – 28 م');
    expect(formatRange(-1010, -970)).toBe('1010–970 BCE');
  });

  it('agrees Arabic nouns with their numbers', () => {
    expect(versesText(1, 'ar')).toBe('آية واحدة');
    expect(versesText(2, 'ar')).toBe('آيتان');
    expect(versesText(7, 'ar')).toBe('7 آيات');
    expect(versesText(11, 'ar')).toBe('11 آية');
    expect(versesText(3, 'en')).toBe('3 verses');
    expect(yearsText(950, 'ar')).toBe('950 سنة');
    expect(coreText('4300–3351 ق.م', 950, 'ar')).toContain('(950 سنة):');
  });
});

describe('the honorific check in Arabic', () => {
  const event = (summaryAr: string, original?: string) => ({
    id: 'test-event',
    kind: 'event',
    lane: 'quran',
    review: 'draft',
    title: { en: 'Test' },
    summary: { en: 'A test event.', ar: summaryAr },
    when: { from: -1010, to: -970, certainty: 'traditional', basis: { en: 'Tradition.' } },
    place: { status: 'unknown', description: { en: 'Not named.' } },
    ...(original
      ? { tradition: [{ kind: 'historian', attribution: { en: 'Ibn Kathir' }, text: { en: 'A report.' }, original, source: 'src-a' }] }
      : {}),
  });
  const raw = (ev: unknown): RawContent => ({
    lanes: [{ file: 'content/lanes.yaml', data: { id: 'quran', name: { en: 'Quran' }, order: 0 } }],
    eras: [],
    sources: [{ file: 'content/sources.yaml', data: { id: 'src-a', type: 'book', title: 'A book' } }],
    events: [{ file: 'content/events/test-event.yaml', data: ev }],
    fileIssues: [],
  });
  const flagged = (ev: unknown) =>
    validateContent(raw(ev), [0, 7, 286]).issues.filter((i) => i.message.includes('ﷺ')).map((i) => i.path);

  it('asks for ﷺ after the Prophet’s name', () => {
    expect(flagged(event('بين عيسى ومحمد ستمئة سنة.'))).toEqual(['summary.ar']);
    expect(flagged(event('بُعث محمدٌ في مكة.'))).toEqual(['summary.ar']);
  });

  it('accepts ﷺ, and other people named Muhammad', () => {
    expect(flagged(event('بين عيسى ومحمد ﷺ ستمئة سنة.'))).toEqual([]);
    expect(flagged(event('رواه محمد بن السائب الكلبي، ومن طريق هشام بن محمد الكلبي.'))).toEqual([]);
    expect(flagged(event('قال محمد عبده ومحمد ناصر الدين الألباني ومحمد الطاهر بن عاشور.'))).toEqual([]);
  });

  it('does not check the source’s own words', () => {
    expect(flagged(event('نصٌّ.', 'قال رسول الله محمد'))).toEqual([]);
  });
});
