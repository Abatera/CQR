/**
 * Integrity checks for the Quran dataset (docs/05-quran-data.md):
 * - each file matches the SHA-256 checksum recorded when it was downloaded;
 * - 114 surahs and 6,236 verses (Kufan numbering, used with Hafs);
 * - the display and search texts and the metadata agree on every verse count;
 * - the Tanzil copyright notice is present.
 * Spot-checking against a printed mushaf or quran.com is still done by hand.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tanzilNotice } from '../src/lib/quran-parse.ts';
import { QURAN_DIR, QURAN_FILES } from './paths.ts';
import { loadQuran } from './quran-node.ts';

let failed = false;
const ok = (msg: string) => console.log(`  ok    ${msg}`);
const fail = (msg: string) => {
  failed = true;
  console.log(`  FAIL  ${msg}`);
};

const record = JSON.parse(readFileSync(join(QURAN_DIR, 'SOURCE.json'), 'utf8')) as Record<string, { sha256: string }>;
for (const f of QURAN_FILES) {
  const bytes = readFileSync(join(QURAN_DIR, f.name));
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha === record[f.name]?.sha256) ok(`${f.name} matches its recorded checksum`);
  else fail(`${f.name} does not match the checksum in SOURCE.json. The file has changed.`);
}

const q = loadQuran();
const total = (s: { ayat: unknown[] }[]) => s.reduce((n, x) => n + x.ayat.length, 0);
for (const [name, text] of [['Uthmani', q.uthmani], ['Simple-clean', q.simple]] as const) {
  if (text.length === 114) ok(`${name}: 114 surahs`);
  else fail(`${name}: ${text.length} surahs, expected 114`);
  if (total(text) === 6236) ok(`${name}: 6,236 verses`);
  else fail(`${name}: ${total(text)} verses, expected 6,236`);
}

const mismatches = q.meta.filter(
  (m) => q.uthmani[m.index - 1]?.ayat.length !== m.ayas || q.simple[m.index - 1]?.ayat.length !== m.ayas,
);
if (q.meta.length === 114 && mismatches.length === 0) ok('metadata, Uthmani and Simple-clean agree on every verse count');
else fail(`verse counts disagree for surahs: ${mismatches.map((m) => m.index).join(', ') || '(metadata incomplete)'}`);

for (const name of ['quran-uthmani.xml', 'quran-simple-clean.xml']) {
  const notice = tanzilNotice(readFileSync(join(QURAN_DIR, name), 'utf8'));
  if (/Tanzil Project/.test(notice) && /CHANGING IT IS NOT ALLOWED/.test(notice)) ok(`${name}: Tanzil copyright notice present`);
  else fail(`${name}: Tanzil copyright notice missing`);
}

if (failed) {
  console.log('\nThe Quran dataset failed its integrity checks.');
  process.exit(1);
}
console.log('\nThe Quran dataset passed all integrity checks.');
