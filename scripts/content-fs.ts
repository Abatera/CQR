/**
 * Reads and writes the content files in content/.
 *
 * Writes go through the yaml Document API so that comments outside the item being
 * changed are kept. Comments inside an item that is saved from the editor are lost.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { Document, isMap, isScalar, isSeq, parseDocument, visit, type YAMLSeq } from 'yaml';
import { EventSchema, SCHEMAS, type Collection } from '../src/lib/schema.ts';
import type { Issue, RawContent, RawItem } from '../src/lib/validate.ts';
import { CONTENT_DIR, EVENTS_DIR, ROOT } from './paths.ts';

export type ListCollection = Exclude<Collection, 'events'>;

const LIST_HEADERS: Record<ListCollection, string> = {
  lanes: ' Timeline lanes. Edit here or in the app editor (npm run dev, then Editor). See docs/04-data-model.md.',
  eras: ' Background era bands for the timeline. Every date range needs a source. See docs/04-data-model.md.',
  sources: ' Bibliography. Every citation in the content refers to an ID in this file. See docs/03-content-principles.md.',
};

export function relPath(abs: string): string {
  return relative(ROOT, abs).split('\\').join('/');
}

export function listFile(collection: ListCollection): string {
  return join(CONTENT_DIR, `${collection}.yaml`);
}

export function eventFile(id: string): string {
  return join(EVENTS_DIR, `${id}.yaml`);
}

function yamlIssue(collection: Collection, file: string, message: string): Issue {
  return { level: 'error', collection, file, message };
}

async function readList(collection: ListCollection, fileIssues: Issue[]): Promise<RawItem[]> {
  const abs = listFile(collection);
  const file = relPath(abs);
  if (!existsSync(abs)) return [];
  const doc = parseDocument(await readFile(abs, 'utf8'));
  if (doc.errors.length) {
    for (const e of doc.errors) fileIssues.push(yamlIssue(collection, file, `YAML error: ${e.message}`));
    return [];
  }
  const data = doc.toJS();
  if (data == null) return [];
  if (!Array.isArray(data)) {
    fileIssues.push(yamlIssue(collection, file, 'This file must contain a list (each item starting with "- ").'));
    return [];
  }
  return data.map((d) => ({ file, data: d }));
}

export async function readContent(): Promise<RawContent> {
  const fileIssues: Issue[] = [];
  const [lanes, eras, sources] = await Promise.all([
    readList('lanes', fileIssues),
    readList('eras', fileIssues),
    readList('sources', fileIssues),
  ]);
  const events: RawItem[] = [];
  if (existsSync(EVENTS_DIR)) {
    const names = (await readdir(EVENTS_DIR)).filter((n) => /\.ya?ml$/.test(n)).sort();
    for (const name of names) {
      const abs = join(EVENTS_DIR, name);
      const file = relPath(abs);
      const doc = parseDocument(await readFile(abs, 'utf8'));
      if (doc.errors.length) {
        for (const e of doc.errors) fileIssues.push(yamlIssue('events', file, `YAML error: ${e.message}`));
        continue;
      }
      events.push({ file, data: doc.toJS() });
    }
  }
  return { lanes, eras, sources, events, fileIssues };
}

const QURAN_REF_RE = /^\d{1,3}:\d{1,3}(?:-\d{1,3})?$/;

/**
 * Formatting that matches the hand-written files:
 * - lists of plain values (coordinates, verse references, tags, source IDs) on one line;
 * - short list items made only of plain values, such as { id: x, type: context }, on one line;
 * - verse references always quoted, because YAML 1.1 parsers read "21:80" as a base-60 number.
 */
function flowShortLists(doc: Document) {
  visit(doc, {
    Scalar(_, node) {
      if (typeof node.value === 'string' && QURAN_REF_RE.test(node.value)) node.type = 'QUOTE_DOUBLE';
    },
    Seq(_, node) {
      if (node.items.length > 0 && node.items.every((n) => isScalar(n))) node.flow = true;
    },
    Map(_, node, path) {
      const parent = path[path.length - 1];
      if (!isSeq(parent) || node.items.length > 3) return;
      if (!node.items.every((p) => isScalar(p.key) && isScalar(p.value))) return;
      const len = node.items.reduce((n, p) => n + String((p.key as { value: unknown }).value).length + String((p.value as { value: unknown }).value).length + 4, 0);
      if (len <= 70) node.flow = true;
    },
  });
}

const TO_STRING = { lineWidth: 0, flowCollectionPadding: true } as const;

function itemNode(doc: Document, data: unknown) {
  const node = doc.createNode(data);
  return node;
}

export async function writeEvent(data: { id: string }): Promise<string> {
  const abs = eventFile(data.id);
  await mkdir(EVENTS_DIR, { recursive: true });
  const doc = new Document(data);
  if (existsSync(abs)) {
    const old = parseDocument(await readFile(abs, 'utf8'));
    if (old.commentBefore) doc.commentBefore = old.commentBefore;
  }
  flowShortLists(doc);
  await writeFile(abs, doc.toString(TO_STRING), 'utf8');
  return relPath(abs);
}

export async function deleteEvent(id: string): Promise<string> {
  const abs = eventFile(id);
  await unlink(abs);
  return relPath(abs);
}

async function loadListDoc(collection: ListCollection): Promise<{ abs: string; doc: Document; seq: YAMLSeq }> {
  const abs = listFile(collection);
  let doc: Document;
  if (existsSync(abs)) {
    doc = parseDocument(await readFile(abs, 'utf8'));
    if (doc.errors.length) throw new Error(`${relPath(abs)} has YAML errors. Fix them by hand first.`);
  } else {
    doc = new Document([]);
    doc.commentBefore = LIST_HEADERS[collection];
  }
  if (doc.contents == null) doc.contents = doc.createNode([]) as YAMLSeq;
  if (!isSeq(doc.contents)) throw new Error(`${relPath(abs)} must contain a list.`);
  return { abs, doc, seq: doc.contents };
}

function findIndex(seq: YAMLSeq, id: string): number {
  return seq.items.findIndex((n) => isMap(n) && n.get('id') === id);
}

/** Inserts or replaces the item with this ID in a list file. */
export async function writeListItem(collection: ListCollection, data: { id: string }): Promise<string> {
  const { abs, doc, seq } = await loadListDoc(collection);
  const node = itemNode(doc, data);
  const i = findIndex(seq, data.id);
  if (i >= 0) {
    const old = seq.items[i] as { commentBefore?: string | null; spaceBefore?: boolean };
    Object.assign(node as object, { commentBefore: old.commentBefore, spaceBefore: old.spaceBefore });
    seq.items[i] = node;
  } else {
    Object.assign(node as object, { spaceBefore: seq.items.length > 0 });
    seq.items.push(node);
  }
  flowShortLists(doc);
  await writeFile(abs, doc.toString(TO_STRING), 'utf8');
  return relPath(abs);
}

export async function deleteListItem(collection: ListCollection, id: string): Promise<string> {
  const { abs, doc, seq } = await loadListDoc(collection);
  const i = findIndex(seq, id);
  if (i < 0) throw new Error(`"${id}" is not in ${relPath(abs)}.`);
  seq.items.splice(i, 1);
  await writeFile(abs, doc.toString(TO_STRING), 'utf8');
  return relPath(abs);
}

export function exists(collection: Collection, raw: RawContent, id: string): boolean {
  return raw[collection].some((r) => (r.data as { id?: unknown } | null)?.id === id);
}

/**
 * Rewrites every valid item in the style the editor writes, so that later saves from
 * the editor change only the item being saved. Comments before items and at the top
 * of files are kept; items that fail validation are left untouched.
 * Returns the files that changed and the items skipped.
 */
export async function formatContent(): Promise<{ changed: string[]; skipped: string[] }> {
  const changed: string[] = [];
  const skipped: string[] = [];
  for (const collection of ['lanes', 'eras', 'sources'] as const) {
    const abs = listFile(collection);
    if (!existsSync(abs)) continue;
    const before = await readFile(abs, 'utf8');
    const { doc, seq } = await loadListDoc(collection);
    seq.items = seq.items.map((n) => {
      const parsed = SCHEMAS[collection].safeParse((n as { toJSON(): unknown }).toJSON());
      if (!parsed.success) {
        skipped.push(`${relPath(abs)}: ${String((isMap(n) && n.get('id')) || '(no id)')}`);
        return n;
      }
      const node = itemNode(doc, parsed.data);
      const old = n as { commentBefore?: string | null; spaceBefore?: boolean };
      Object.assign(node as object, { commentBefore: old.commentBefore, spaceBefore: old.spaceBefore });
      return node;
    });
    flowShortLists(doc);
    const after = doc.toString(TO_STRING);
    if (after !== before) {
      await writeFile(abs, after, 'utf8');
      changed.push(relPath(abs));
    }
  }
  if (existsSync(EVENTS_DIR)) {
    for (const name of (await readdir(EVENTS_DIR)).filter((n) => /\.ya?ml$/.test(n))) {
      const abs = join(EVENTS_DIR, name);
      const before = await readFile(abs, 'utf8');
      const parsed = EventSchema.safeParse(parseDocument(before).toJS());
      if (!parsed.success || `${parsed.data.id}.yaml` !== name) {
        skipped.push(relPath(abs));
        continue;
      }
      await writeEvent(parsed.data);
      if ((await readFile(abs, 'utf8')) !== before) changed.push(relPath(abs));
    }
  }
  return { changed, skipped };
}
