import { refId, refLocator, type Source, type SourceRef } from './schema.ts';

const CERTAINTY_LABEL: Record<string, string> = {
  established: 'established',
  estimated: 'estimated',
  traditional: 'traditional dating',
  reckoned: 'traditional reckoning',
  debated: 'debated',
  unknown: 'unknown',
};

export const TRADITION_KIND_LABEL: Record<string, string> = {
  hadith: 'Hadith',
  athar: 'Report (Companion or Successor)',
  historian: 'Historian',
  'ahl-al-kitab': 'From the People of the Book',
};

export const GRADE_LABEL: Record<string, string> = {
  sahih: 'sahih (sound)',
  hasan: 'hasan (good)',
  daif: "da'if (weak)",
  'very-weak': 'very weak',
  fabricated: 'fabricated',
  other: 'see note',
};

export function certaintyLabel(c: string): string {
  return CERTAINTY_LABEL[c] ?? c;
}

const LOCATION_LABEL: Record<string, string> = {
  known: 'known location',
  proposed: 'proposed location',
  unknown: 'location unknown',
};

export function locationLabel(s: string): string {
  return LOCATION_LABEL[s] ?? s;
}

/**
 * The name used in a short citation. Western names use the surname ("Eric H. Cline" → "Cline").
 * Classical Arabic names keep the part they are known by: "Ibn Kathir", "Ibn Hajar al-'Asqalani"
 * → "Ibn Hajar", "al-Hakim al-Naysaburi" → "al-Hakim", "Muhammad Nasir al-Din al-Albani" → "al-Albani".
 */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  const ibn = parts.indexOf('Ibn');
  if (ibn >= 0 && ibn < parts.length - 1) return `Ibn ${parts[ibn + 1]}`;
  if (parts[0].startsWith('al-')) return parts[0];
  return parts[parts.length - 1] ?? name;
}

/** "Cline 2021, pp. 102–110" */
export function shortCite(source: Source | undefined, ref: SourceRef): string {
  const loc = refLocator(ref);
  if (!source) return `${refId(ref)} (missing source)`;
  const who = source.authors?.length
    ? source.authors.length > 2
      ? `${surname(source.authors[0])} et al.`
      : source.authors.map(surname).join(' and ')
    : source.title;
  return `${who}${source.year ? ` ${source.year}` : ''}${loc ? `, ${loc}` : ''}`;
}

/** A full bibliography entry as plain text. */
export function fullCite(s: Source): string {
  const parts: string[] = [];
  if (s.authors?.length) parts.push(s.authors.join(', '));
  if (s.editors?.length) parts.push(`${s.editors.join(', ')} (ed${s.editors.length > 1 ? 's' : ''}.)`);
  const title = s.type === 'article' || s.type === 'chapter' ? `"${s.title}"` : s.title;
  parts.push(s.title_original ? `${title} (${s.title_original})` : title);
  if (s.container) parts.push(`${s.type === 'chapter' ? 'In ' : ''}${s.container}`);
  if (s.edition) parts.push(`${s.edition} edition`);
  if (s.volume) parts.push(`vol. ${s.volume}${s.issue ? `, no. ${s.issue}` : ''}`);
  const pub = [s.place, s.publisher].filter(Boolean).join(': ');
  if (pub) parts.push(pub);
  if (s.year) parts.push(String(s.year));
  if (s.pages) parts.push(`pp. ${s.pages}`);
  if (s.doi) parts.push(`doi:${s.doi}`);
  return parts.join('. ').replace(/\.\./g, '.') + '.';
}

/** "david-armor" from "David and the making of armor". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}
