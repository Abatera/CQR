import { describe, expect, it } from 'vitest';
import { stack } from '../src/timeline/layout';

describe('timeline stacking', () => {
  it('puts overlapping items in separate rows and reuses free rows', () => {
    const rows = stack([
      { start: 0, end: 100 },
      { start: 50, end: 150 },
      { start: 200, end: 300 },
      { start: 60, end: 80 },
    ]);
    expect(rows[0]).toBe(0);
    expect(rows[1]).toBe(1);
    expect(rows[2]).toBe(0);
    expect(rows[3]).toBe(2);
  });
});
