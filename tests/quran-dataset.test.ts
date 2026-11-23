/**
 * Tests against the real Tanzil files in data/third-party/quran/.
 * Search queries are typed the way a reader would type them.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeArabic } from '../src/lib/arabic';
import { ayahCounts, parseQuranMeta, parseQuranXml, tanzilNotice } from '../src/lib/quran-parse';
import { highlightSegments, searchQuran, type QuranData } from '../src/quran/quran-data';

const dir = join(__dirname, '..', 'data', 'third-party', 'quran');
const read = (n: string) => readFileSync(join(dir, n), 'utf8');

const uXml = read('quran-uthmani.xml');
const u = parseQuranXml(uXml);
const s = parseQuranXml(read('quran-simple-clean.xml'));
const meta = parseQuranMeta(read('quran-data.xml'));

const data: QuranData = {
  surahs: meta,
  verses: [[], ...u.map((su, i) => su.ayat.map((a, j) => ({ surah: su.index, ayah: a.index, text: a.text, bismillah: a.bismillah, search: normalizeArabic(s[i].ayat[j].text) })))],
  counts: ayahCounts(u),
  notice: tanzilNotice(uXml),
};

describe('Tanzil dataset', () => {
  it('has 114 surahs and 6,236 verses', () => {
    expect(u).toHaveLength(114);
    expect(data.counts.reduce((a, b) => a + b, 0)).toBe(6236);
    expect(meta.map((m) => m.ayas)).toEqual(data.counts.slice(1));
  });

  it('keeps the basmala apart from verse 1, except in Al-Fatiha and At-Tawbah', () => {
    expect(u[0].ayat[0].bismillah).toBeUndefined();
    expect(u[8].ayat[0].bismillah).toBeUndefined();
    expect(u.filter((x) => x.ayat[0].bismillah)).toHaveLength(112);
  });

  it('carries the Tanzil notice', () => {
    expect(data.notice).toMatch(/Tanzil Project/);
  });

  it('finds the iron of 34:10 and highlights it in the Uthmani text', () => {
    const query = 'الحديد';
    const hits = searchQuran(data, query, 'word');
    const h = hits.find((x) => x.verse.surah === 34 && x.verse.ayah === 10);
    expect(h).toBeDefined();
    const segs = highlightSegments(h!.verse, h, query);
    expect(segs.filter((x) => x.hit)).toHaveLength(1);
    expect(segs.map((x) => x.text).join('')).toBe(h!.verse.text);
  });

  it('matches part of a word only in substring mode', () => {
    const sub = searchQuran(data, 'حديد', 'substring').length;
    const word = searchQuran(data, 'حديد', 'word').length;
    expect(sub).toBeGreaterThan(word);
  });
});
