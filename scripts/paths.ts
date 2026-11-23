import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = join(ROOT, 'content');
export const EVENTS_DIR = join(CONTENT_DIR, 'events');
export const QURAN_DIR = join(ROOT, 'data', 'third-party', 'quran');

const TANZIL = 'https://tanzil.net/pub/download/index.php';

/**
 * The Tanzil files the app uses. The options match Tanzil's defaults on its download
 * page (pause marks, sajdah signs, superscript alefs and tatweel on; rub-el-hizb off).
 * The XML format is used because it keeps the basmala apart from verse 1, whereas
 * the plain-text format prefixes it to the first verse of each surah.
 */
export const QURAN_FILES = [
  {
    name: 'quran-uthmani.xml',
    description: 'Tanzil Uthmani text (Hafs), for display',
    url: `${TANZIL}?marks=true&sajdah=true&alef=true&tatweel=true&quranType=uthmani&outType=xml&agree=true`,
  },
  {
    name: 'quran-simple-clean.xml',
    description: 'Tanzil Simple-clean text (no diacritics), for search',
    url: `${TANZIL}?quranType=simple-clean&outType=xml&agree=true`,
  },
  {
    name: 'quran-data.xml',
    description: 'Tanzil Quran metadata (surah names, verse counts, revelation type)',
    url: 'https://tanzil.net/res/text/metadata/quran-data.xml',
  },
] as const;
