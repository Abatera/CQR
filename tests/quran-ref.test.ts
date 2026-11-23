import { describe, expect, it } from 'vitest';
import { checkRef, formatRef, parseRef, refIncludes } from '../src/lib/quran-ref';

// A small stand-in for the dataset's verse counts: surah 1 has 7 verses, 2 has 286.
const counts = [0, 7, 286];

describe('quran references', () => {
  it('parses single verses and ranges', () => {
    expect(parseRef('34:10')).toEqual({ surah: 34, from: 10, to: 10 });
    expect(parseRef('34:10-11')).toEqual({ surah: 34, from: 10, to: 11 });
    expect(parseRef('34')).toBeNull();
    expect(parseRef('a:b')).toBeNull();
    expect(formatRef({ surah: 2, from: 246, to: 249 })).toBe('2:246-249');
  });

  it('checks references against the verse counts', () => {
    expect(checkRef('1:7', counts)).toBeNull();
    expect(checkRef('2:246-249', counts)).toBeNull();
    expect(checkRef('1:8', counts)).toMatch(/has 7 verses/);
    expect(checkRef('3:1', counts)).toMatch(/does not exist/);
    expect(checkRef('2:249-246', counts)).toMatch(/reversed/);
    expect(checkRef('2:010', counts)).toMatch(/Write/);
  });

  it('knows which verses a reference includes', () => {
    const r = parseRef('34:10-11')!;
    expect(refIncludes(r, 34, 11)).toBe(true);
    expect(refIncludes(r, 34, 12)).toBe(false);
  });
});
