/**
 * Validates the whole content set: the schema of each item, then the references
 * between items, then the sourcing rules from docs/03-content-principles.md.
 *
 * Works on already-parsed data, so it runs in Node (build, dev server) and could
 * run in the browser.
 */
import type { z } from 'zod';
import { checkRef } from './quran-ref.ts';
import {
  SCHEMAS,
  refId,
  type Collection,
  type CqrEvent,
  type Era,
  type Lane,
  type Source,
  type SourceRef,
} from './schema.ts';

export interface Issue {
  level: 'error' | 'warning';
  collection: Collection;
  /** The item's ID, when it has one. */
  id?: string;
  /** File path relative to the repo root, with forward slashes. */
  file: string;
  /** Path to the field inside the item, e.g. "history[0].sources". */
  path?: string;
  message: string;
}

export interface RawItem {
  file: string;
  data: unknown;
}

export interface RawContent {
  lanes: RawItem[];
  eras: RawItem[];
  sources: RawItem[];
  events: RawItem[];
  /** Problems reading or parsing the files themselves. */
  fileIssues: Issue[];
}

export interface Bundle {
  lanes: Lane[];
  eras: Era[];
  sources: Source[];
  events: CqrEvent[];
}

export interface ValidationResult {
  bundle: Bundle;
  issues: Issue[];
}

export function formatPath(path: readonly PropertyKey[]): string {
  let out = '';
  for (const p of path) {
    if (typeof p === 'number') out += `[${p}]`;
    else out += out ? `.${String(p)}` : String(p);
  }
  return out;
}

export function issueKey(i: Issue): string {
  return [i.level, i.collection, i.id ?? '', i.file, i.path ?? '', i.message].join('|');
}

/** Converts zod issues to content issues. Used by the editor forms too. */
export function zodIssues(error: z.ZodError, collection: Collection, file: string, id?: string): Issue[] {
  return error.issues.map((zi) => ({
    level: 'error' as const,
    collection,
    id,
    file,
    path: formatPath(zi.path) || undefined,
    message: /received undefined$/.test(zi.message) ? 'This is required.' : zi.message,
  }));
}

function itemId(data: unknown): string | undefined {
  return data && typeof data === 'object' && typeof (data as { id?: unknown }).id === 'string'
    ? (data as { id: string }).id
    : undefined;
}

export function validateContent(raw: RawContent, ayahCounts: readonly number[]): ValidationResult {
  const issues: Issue[] = [...raw.fileIssues];

  function parseAll<C extends Collection>(collection: C) {
    const schema = SCHEMAS[collection];
    const out: { file: string; value: z.infer<(typeof SCHEMAS)[C]> }[] = [];
    const seen = new Map<string, string>();
    for (const item of raw[collection]) {
      const id = itemId(item.data);
      const res = schema.safeParse(item.data);
      if (!res.success) {
        issues.push(...zodIssues(res.error, collection, item.file, id));
        continue;
      }
      const value = res.data as z.infer<(typeof SCHEMAS)[C]>;
      const prev = seen.get(value.id);
      if (prev) {
        issues.push({ level: 'error', collection, id: value.id, file: item.file, path: 'id', message: `The ID "${value.id}" is already used in ${prev}.` });
        continue;
      }
      seen.set(value.id, item.file);
      out.push({ file: item.file, value });
    }
    return out;
  }

  const lanes = parseAll('lanes');
  const eras = parseAll('eras');
  const sources = parseAll('sources');
  const events = parseAll('events');

  const laneIds = new Set(lanes.map((l) => l.value.id));
  const sourceIds = new Set(sources.map((s) => s.value.id));
  const eventIds = new Set(events.map((e) => e.value.id));

  function checkSources(refs: readonly SourceRef[] | undefined, at: string, push: (path: string, msg: string) => void) {
    refs?.forEach((r, i) => {
      if (!sourceIds.has(refId(r))) push(`${at}[${i}]`, `The source "${refId(r)}" is not in content/sources.yaml.`);
    });
  }

  for (const { file, value: era } of eras) {
    const push = (level: Issue['level'], path: string, message: string) =>
      issues.push({ level, collection: 'eras', id: era.id, file, path, message });
    checkSources(era.sources, 'sources', (p, m) => push('error', p, m));
    if (!era.sources?.length) push(era.review === 'reviewed' ? 'error' : 'warning', 'sources', 'An era needs at least one source for its dates.');
  }

  for (const { file, value: ev } of events) {
    const push = (level: Issue['level'], path: string, message: string) =>
      issues.push({ level, collection: 'events', id: ev.id, file, path, message });
    const sourcing: Issue['level'] = ev.review === 'reviewed' ? 'error' : 'warning';
    const refErr = (p: string, m: string) => push('error', p, m);

    const expectedFile = `content/events/${ev.id}.yaml`;
    if (file !== expectedFile) push('error', 'id', `The file name must match the ID: expected ${expectedFile}.`);

    if (!laneIds.has(ev.lane)) push('error', 'lane', `The lane "${ev.lane}" is not in content/lanes.yaml.`);

    ev.when.alternatives?.forEach((alt, i) => {
      checkSources(alt.sources, `when.alternatives[${i}].sources`, refErr);
      if (!alt.sources?.length) push(sourcing, `when.alternatives[${i}].sources`, 'An alternative date needs a source.');
    });

    ev.place.opinions?.forEach((op, i) => {
      checkSources(op.sources, `place.opinions[${i}].sources`, refErr);
      if (!op.sources?.length) push(sourcing, `place.opinions[${i}].sources`, 'Each opinion on a location needs a source.');
    });

    ev.quran?.forEach((ref, i) => {
      const err = checkRef(ref, ayahCounts);
      if (err) push('error', `quran[${i}]`, err);
    });

    ev.tafsir?.forEach((t, i) => {
      if (t.source) checkSources([t.source], `tafsir[${i}].source`, (_p, m) => refErr(`tafsir[${i}].source`, m));
      else push(sourcing, `tafsir[${i}].source`, 'Tafsir must name the commentator and the work.');
    });

    ev.history?.forEach((h, i) => {
      checkSources(h.sources, `history[${i}].sources`, refErr);
      if (!h.sources?.length) push(sourcing, `history[${i}].sources`, 'Every historical claim needs at least one source.');
    });

    if (ev.connection && !ev.connection.confidence) {
      push(sourcing, 'connection.confidence', 'The connection needs a confidence level (set by the owner).');
    }

    const relSeen = new Set<string>();
    ev.related?.forEach((r, i) => {
      if (r.id === ev.id) push('error', `related[${i}].id`, 'An event cannot be related to itself.');
      else if (!eventIds.has(r.id)) push('error', `related[${i}].id`, `The event "${r.id}" does not exist.`);
      if (relSeen.has(r.id)) push('error', `related[${i}].id`, `"${r.id}" is listed twice.`);
      relSeen.add(r.id);
    });
  }

  const bundle: Bundle = {
    lanes: lanes.map((l) => l.value).sort((a, b) => a.order - b.order),
    eras: eras.map((e) => e.value).sort((a, b) => a.from - b.from),
    sources: sources.map((s) => s.value),
    events: events.map((e) => e.value).sort((a, b) => a.when.from - b.when.from || a.when.to - b.when.to),
  };
  return { bundle, issues };
}

/** Errors present in `after` that were not in `before`. */
export function newErrors(before: Issue[], after: Issue[]): Issue[] {
  const keys = new Set(before.map(issueKey));
  return after.filter((i) => i.level === 'error' && !keys.has(issueKey(i)));
}
