/**
 * Rewrites the content files in the style the editor writes. Run it after editing
 * YAML by hand, so that later saves from the editor produce small diffs.
 * Comments at the top of files and before list items are kept.
 */
import { formatContent } from './content-fs.ts';

const { changed, skipped } = await formatContent();
for (const f of changed) console.log(`formatted ${f}`);
for (const f of skipped) console.log(`skipped (has validation errors; run npm run validate) ${f}`);
if (!changed.length) console.log('All content files are already formatted.');
