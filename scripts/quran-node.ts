import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ayahCounts, parseQuranMeta, parseQuranXml, type ParsedSurah, type SurahMeta } from '../src/lib/quran-parse.ts';
import { QURAN_DIR } from './paths.ts';

export interface QuranNode {
  uthmani: ParsedSurah[];
  simple: ParsedSurah[];
  meta: SurahMeta[];
  /** counts[s] = number of verses in surah s, from the Uthmani text. */
  counts: number[];
}

let cache: QuranNode | null = null;

export function loadQuran(): QuranNode {
  if (cache) return cache;
  const file = (n: string) => {
    const p = join(QURAN_DIR, n);
    if (!existsSync(p)) throw new Error(`Missing ${p}. Run "npm run quran:fetch" to download the Quran dataset.`);
    return readFileSync(p, 'utf8');
  };
  const uthmani = parseQuranXml(file('quran-uthmani.xml'));
  const simple = parseQuranXml(file('quran-simple-clean.xml'));
  const meta = parseQuranMeta(file('quran-data.xml'));
  cache = { uthmani, simple, meta, counts: ayahCounts(uthmani) };
  return cache;
}
