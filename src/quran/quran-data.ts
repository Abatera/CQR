/**
 * Loads the Tanzil files in the browser, exactly as downloaded, and provides verse
 * lookup and search. Search runs on the Simple-clean text (the spelling people
 * type); results are shown in the Uthmani text (docs/05-quran-data.md).
 */
import { normalizeArabic } from '../lib/arabic';
import { parseRef, type QuranRef } from '../lib/quran-ref';
import { ayahCounts, parseQuranMeta, parseQuranXml, tanzilNotice, type SurahMeta } from '../lib/quran-parse';

export interface Verse {
  surah: number;
  ayah: number;
  /** Uthmani text, for display. */
  text: string;
  /** The basmala shown before verse 1, if the surah has one apart from its verses. */
  bismillah?: string;
  /** Normalized Simple-clean text, for search. */
  search: string;
}

export interface QuranData {
  surahs: SurahMeta[];
  /** verses[s][a - 1] */
  verses: Verse[][];
  counts: number[];
  notice: string;
}

let loading: Promise<QuranData> | null = null;

async function fetchText(name: string): Promise<string> {
  const res = await fetch(`./data/quran/${name}`);
  if (!res.ok) throw new Error(`Could not load ${name} (HTTP ${res.status}).`);
  return res.text();
}

export function loadQuranData(): Promise<QuranData> {
  loading ??= (async () => {
    const [uXml, sXml, mXml] = await Promise.all([
      fetchText('quran-uthmani.xml'),
      fetchText('quran-simple-clean.xml'),
      fetchText('quran-data.xml'),
    ]);
    const u = parseQuranXml(uXml);
    const s = parseQuranXml(sXml);
    const surahs = parseQuranMeta(mXml);
    const verses: Verse[][] = [[]];
    for (const surah of u) {
      const simple = s[surah.index - 1];
      verses[surah.index] = surah.ayat.map((a, i) => ({
        surah: surah.index,
        ayah: a.index,
        text: a.text,
        bismillah: a.bismillah,
        search: normalizeArabic(simple?.ayat[i]?.text ?? ''),
      }));
    }
    return { surahs, verses, counts: ayahCounts(u), notice: tanzilNotice(uXml) };
  })();
  loading.catch(() => (loading = null));
  return loading;
}

export function versesFor(q: QuranData, ref: QuranRef | string): Verse[] {
  const r = typeof ref === 'string' ? parseRef(ref) : ref;
  if (!r) return [];
  const list = q.verses[r.surah];
  if (!list) return [];
  return list.slice(r.from - 1, r.to);
}

export type SearchMode = 'substring' | 'word';

export interface SearchHit {
  verse: Verse;
  /** Indices of the matched words in the Simple-clean text. */
  words: Set<number>;
}

function wordIndexAt(text: string, offset: number): number {
  let n = 0;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === ' ') n++;
  return n;
}

/** Finds the query in every verse. Returns all hits in Quran order. */
export function searchQuran(q: QuranData, query: string, mode: SearchMode): SearchHit[] {
  const needle = normalizeArabic(query);
  if (!needle) return [];
  const hits: SearchHit[] = [];
  for (let s = 1; s < q.verses.length; s++) {
    for (const v of q.verses[s]) {
      const hay = v.search;
      let from = 0;
      let words: Set<number> | null = null;
      for (;;) {
        const i = hay.indexOf(needle, from);
        if (i < 0) break;
        const end = i + needle.length;
        const isWord = (i === 0 || hay[i - 1] === ' ') && (end === hay.length || hay[end] === ' ');
        if (mode === 'substring' || isWord) {
          words ??= new Set();
          const first = wordIndexAt(hay, i);
          const last = wordIndexAt(hay, end - 1);
          for (let w = first; w <= last; w++) words.add(w);
        }
        from = i + 1;
      }
      if (words) hits.push({ verse: v, words });
    }
  }
  return hits;
}

// Tokens of the Uthmani text that are only pause or sajdah marks, not words.
const MARK_ONLY_RE = /^[ۖ-ۭ]+$/;

export interface Segment {
  text: string;
  hit: boolean;
}

/**
 * Splits the Uthmani text at spaces and marks the words that correspond to search
 * hits. Where the two texts have the same number of words, words are matched by
 * position. Otherwise (about 6% of verses, where the spellings split words
 * differently) each Uthmani word is compared with the query directly.
 */
export function highlightSegments(verse: Verse, hit: SearchHit | undefined, query: string): Segment[] {
  const tokens = verse.text.split(' ');
  if (!hit) return [{ text: verse.text, hit: false }];
  const simpleCount = verse.search.split(' ').length;
  const wordTokens = tokens.filter((t) => !MARK_ONLY_RE.test(t)).length;
  const needleWords = normalizeArabic(query).split(' ');
  let w = -1;
  return tokens.map((t, i) => {
    const isWord = !MARK_ONLY_RE.test(t);
    if (isWord) w++;
    let isHit = false;
    if (isWord) {
      if (wordTokens === simpleCount) isHit = hit.words.has(w);
      else {
        const n = normalizeArabic(t);
        isHit = needleWords.some((nw) => nw.length > 1 && (n.includes(nw) || nw.includes(n)));
      }
    }
    return { text: (i > 0 ? ' ' : '') + t, hit: isHit };
  });
}
