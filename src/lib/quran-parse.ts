/**
 * Parses the Tanzil XML files as downloaded. Works in Node and in the browser.
 * The text is read as is: nothing here changes a character of it.
 */

export interface SurahMeta {
  index: number;
  ayas: number;
  /** Arabic name, from the Tanzil metadata. */
  name: string;
  /** Transliterated name, e.g. "Al-Baqara". */
  tname: string;
  /** English name, e.g. "The Cow". */
  ename: string;
  type: string;
  order: number;
}

export interface ParsedSurah {
  index: number;
  name: string;
  ayat: { index: number; text: string; bismillah?: string }[];
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', lt: '<', gt: '>', apos: "'" };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}

/** Parses a Tanzil Quran text file in XML format. */
export function parseQuranXml(xml: string): ParsedSurah[] {
  const body = xml.replace(/<!--[\s\S]*?-->/g, '');
  const surahs: ParsedSurah[] = [];
  let current: ParsedSurah | null = null;
  for (const m of body.matchAll(/<(sura|aya)\b([^>]*?)\/?>/g)) {
    const a = attrs(m[2]);
    if (m[1] === 'sura') {
      current = { index: Number(a.index), name: a.name ?? '', ayat: [] };
      surahs.push(current);
    } else if (current) {
      const aya: ParsedSurah['ayat'][number] = { index: Number(a.index), text: a.text ?? '' };
      if (a.bismillah) aya.bismillah = a.bismillah;
      current.ayat.push(aya);
    }
  }
  return surahs;
}

/** Parses the surah list from Tanzil's quran-data.xml. */
export function parseQuranMeta(xml: string): SurahMeta[] {
  const suras = /<suras\b[^>]*>([\s\S]*?)<\/suras>/.exec(xml)?.[1] ?? '';
  return [...suras.matchAll(/<sura\b([^>]*?)\/>/g)].map((m) => {
    const a = attrs(m[1]);
    return {
      index: Number(a.index),
      ayas: Number(a.ayas),
      name: a.name ?? '',
      tname: a.tname ?? '',
      ename: a.ename ?? '',
      type: a.type ?? '',
      order: Number(a.order),
    };
  });
}

/** Verse counts per surah from parsed text: counts[s] is the number of verses in surah s. */
export function ayahCounts(surahs: ParsedSurah[]): number[] {
  const counts = [0];
  for (const s of surahs) counts[s.index] = s.ayat.length;
  return counts;
}

/** The copyright block at the top of a Tanzil file, without the comment markers. */
export function tanzilNotice(xml: string): string {
  const c = /<!--([\s\S]*?)-->/.exec(xml)?.[1] ?? '';
  return c
    .split('\n')
    .map((l) => l.replace(/^\s*#\s?/, '').trimEnd())
    .filter((l) => !/^=+$/.test(l))
    .join('\n')
    .trim();
}
