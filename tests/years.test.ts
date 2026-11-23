import { describe, expect, it } from 'vitest';
import { axisTicks, formatRange, formatYear, fromAstro, rangesOverlap, spanYears, toAstro } from '../src/lib/years';

describe('years', () => {
  it('has no year 0', () => {
    expect(toAstro(-1)).toBe(0);
    expect(toAstro(1)).toBe(1);
    expect(fromAstro(0)).toBe(-1);
    expect(fromAstro(toAstro(-1010))).toBe(-1010);
  });

  it('counts durations across the BCE/CE boundary', () => {
    expect(spanYears(-1, 1)).toBe(2); // 1 BCE and 1 CE
    expect(spanYears(-10, 10)).toBe(20);
    expect(spanYears(-1010, -970)).toBe(41);
  });

  it('formats years and ranges', () => {
    expect(formatYear(-1010)).toBe('1010 BCE');
    expect(formatYear(622)).toBe('622 CE');
    expect(formatRange(-1010, -970)).toBe('1010–970 BCE');
    expect(formatRange(-30, 14)).toBe('30 BCE – 14 CE');
    expect(formatRange(-1177, -1177)).toBe('1177 BCE');
  });

  it('detects overlapping ranges', () => {
    expect(rangesOverlap(-1010, -970, -1000, -901)).toBe(true);
    expect(rangesOverlap(-1010, -970, -969, -900)).toBe(false);
  });

  it('makes round ticks without a year 0', () => {
    const ticks = axisTicks(toAstro(-1300), toAstro(-800), 1000);
    expect(ticks.map((t) => t.year)).toContain(-1000);
    expect(ticks.every((t) => t.year % 50 === 0)).toBe(true);
    const across = axisTicks(toAstro(-300), toAstro(300), 1000);
    expect(across.some((t) => t.year === 0)).toBe(false);
  });
});
