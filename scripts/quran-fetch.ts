/**
 * Downloads the Tanzil Quran text (Hafs) and metadata into data/third-party/quran/.
 *
 * The files are saved byte for byte as Tanzil serves them. Tanzil's terms allow
 * verbatim copies only, so nothing in this project edits them. SOURCE.json records
 * where each file came from, when, and its SHA-256 checksum. `npm run quran:verify`
 * checks the checksums and the verse counts.
 *
 * Run only when deliberately updating the dataset: a new download can differ from
 * the reviewed copy (Tanzil publishes corrections at https://tanzil.net/updates/).
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { QURAN_DIR, QURAN_FILES } from './paths.ts';

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(QURAN_DIR, { recursive: true });
const record: Record<string, unknown> = {};

for (const file of QURAN_FILES) {
  process.stdout.write(`Downloading ${file.name} ... `);
  const bytes = await download(file.url);
  await writeFile(join(QURAN_DIR, file.name), bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  record[file.name] = {
    description: file.description,
    url: file.url,
    downloaded: new Date().toISOString(),
    bytes: bytes.length,
    sha256,
  };
  console.log(`${bytes.length} bytes, sha256 ${sha256.slice(0, 16)}...`);
}

await writeFile(join(QURAN_DIR, 'SOURCE.json'), JSON.stringify(record, null, 2) + '\n');
console.log('Wrote SOURCE.json. Now run: npm run quran:verify');
