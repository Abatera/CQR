/**
 * Validates all content: the schema of every item, references between items,
 * Quran references against the dataset, and the sourcing rules.
 * Exits with status 1 if there are errors. Warnings (mostly unsourced claims in
 * drafts) do not fail the build, but every one must be resolved before an event
 * is marked "reviewed".
 */
import { readContent } from './content-fs.ts';
import { loadQuran } from './quran-node.ts';
import { validateContent, type Issue } from '../src/lib/validate.ts';

const quiet = process.argv.includes('--quiet');
const raw = await readContent();
const { bundle, issues } = validateContent(raw, loadQuran().counts);

const errors = issues.filter((i) => i.level === 'error');
const warnings = issues.filter((i) => i.level === 'warning');

function print(list: Issue[], label: string) {
  const byFile = new Map<string, Issue[]>();
  for (const i of list) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);
  for (const [file, items] of byFile) {
    console.log(`\n${label} ${file}`);
    for (const i of items) console.log(`  ${i.id ? `[${i.id}] ` : ''}${i.path ? `${i.path}: ` : ''}${i.message}`);
  }
}

if (errors.length) print(errors, 'ERROR');
if (warnings.length && !quiet) print(warnings, 'warning');

const drafts = bundle.events.filter((e) => e.review === 'draft').length;
console.log(
  `\n${bundle.events.length} events (${drafts} drafts), ${bundle.lanes.length} lanes, ${bundle.eras.length} eras, ${bundle.sources.length} sources.`,
);
console.log(`${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exit(1);
