/**
 * Vite plugin for CQR.
 *
 * Dev server (npm run dev):
 *   GET  /content.json          all content, validated, plus the list of issues
 *   GET  /data/quran/<file>     the Tanzil files, served unmodified
 *   POST /__cqr/api/save        create or update an item (used by the editor forms)
 *   POST /__cqr/api/delete      delete an item
 *   Changes to content/ notify the app, which reloads its content.
 *
 * Build (npm run build): validates the content (errors fail the build) and emits
 * content.json and the Tanzil files next to the app. The deployed site is static
 * and read-only: the write API exists only on the local dev server.
 */
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { COLLECTIONS, SCHEMAS, clean, type Collection } from '../src/lib/schema.ts';
import { newErrors, validateContent, zodIssues, type Issue, type RawContent } from '../src/lib/validate.ts';
import {
  deleteEvent,
  deleteListItem,
  exists,
  readContent,
  writeEvent,
  writeListItem,
  type ListCollection,
} from './content-fs.ts';
import { CONTENT_DIR, QURAN_DIR, QURAN_FILES } from './paths.ts';
import { loadQuran } from './quran-node.ts';

const QURAN_NAMES = new Set<string>([...QURAN_FILES.map((f) => f.name), 'SOURCE.json']);

async function compile() {
  const raw = await readContent();
  const result = validateContent(raw, loadQuran().counts);
  return { raw, ...result };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function fileFor(collection: Collection, id: string) {
  return collection === 'events' ? `content/events/${id}.yaml` : `content/${collection}.yaml`;
}

/** The content as it would be after the change, for checking that the change adds no errors. */
function applyChange(raw: RawContent, collection: Collection, id: string, data: unknown | null): RawContent {
  const items = (raw[collection] ?? []).filter((r) => (r.data as { id?: unknown } | null)?.id !== id);
  if (data !== null) items.push({ file: fileFor(collection, id), data });
  return { ...raw, [collection]: items };
}

async function handleSave(body: unknown) {
  const { collection, data, create } = body as { collection: Collection; data: unknown; create: boolean };
  if (!COLLECTIONS.includes(collection)) return { status: 400, body: { error: 'Unknown collection.' } };
  const cleaned = clean(data);
  const parsed = SCHEMAS[collection].safeParse(cleaned);
  const id = (cleaned as { id?: string } | undefined)?.id ?? '';
  if (!parsed.success) {
    return { status: 400, body: { errors: zodIssues(parsed.error, collection, fileFor(collection, id), id) } };
  }
  const value = parsed.data as { id: string };
  const before = await compile();
  if (create && exists(collection, before.raw, value.id)) {
    return {
      status: 409,
      body: { errors: [{ level: 'error', collection, id: value.id, file: fileFor(collection, value.id), path: 'id', message: `The ID "${value.id}" is already taken.` } satisfies Issue] },
    };
  }
  if (!create && !exists(collection, before.raw, value.id)) {
    return { status: 404, body: { error: `"${value.id}" does not exist. It may have been renamed or deleted.` } };
  }
  const after = validateContent(applyChange(before.raw, collection, value.id, value), loadQuran().counts);
  const added = newErrors(before.issues, after.issues);
  if (added.length) return { status: 422, body: { errors: added } };

  const file =
    collection === 'events' ? await writeEvent(value) : await writeListItem(collection as ListCollection, value);
  const fresh = await compile();
  return { status: 200, body: { ok: true, file, content: { ...fresh.bundle, issues: fresh.issues } } };
}

async function handleDelete(body: unknown) {
  const { collection, id } = body as { collection: Collection; id: string };
  if (!COLLECTIONS.includes(collection)) return { status: 400, body: { error: 'Unknown collection.' } };
  const before = await compile();
  if (!exists(collection, before.raw, id)) return { status: 404, body: { error: `"${id}" does not exist.` } };
  const after = validateContent(applyChange(before.raw, collection, id, null), loadQuran().counts);
  const added = newErrors(before.issues, after.issues);
  if (added.length) {
    return {
      status: 422,
      body: { error: `Other content still refers to "${id}". Remove those references first.`, errors: added },
    };
  }
  const file = collection === 'events' ? await deleteEvent(id) : await deleteListItem(collection as ListCollection, id);
  const fresh = await compile();
  return { status: 200, body: { ok: true, file, content: { ...fresh.bundle, issues: fresh.issues } } };
}

export function cqr(): Plugin {
  return {
    name: 'cqr-content',

    configureServer(server) {
      server.watcher.add(CONTENT_DIR);
      const notify = (path: string) => {
        if (path.startsWith(CONTENT_DIR)) server.ws.send({ type: 'custom', event: 'cqr:content' });
      };
      server.watcher.on('add', notify);
      server.watcher.on('change', notify);
      server.watcher.on('unlink', notify);

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        try {
          if (req.method === 'GET' && url === '/content.json') {
            const { bundle, issues } = await compile();
            return send(res, 200, { ...bundle, issues });
          }
          if (req.method === 'GET' && url.startsWith('/data/quran/')) {
            const name = decodeURIComponent(url.slice('/data/quran/'.length));
            if (!QURAN_NAMES.has(name)) return next();
            res.setHeader('Content-Type', name.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/xml; charset=utf-8');
            return res.end(readFileSync(join(QURAN_DIR, name)));
          }
          if (req.method === 'POST' && url === '/__cqr/api/save') {
            const r = await handleSave(await readBody(req));
            return send(res, r.status, r.body);
          }
          if (req.method === 'POST' && url === '/__cqr/api/delete') {
            const r = await handleDelete(await readBody(req));
            return send(res, r.status, r.body);
          }
        } catch (e) {
          return send(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }
        next();
      });
    },

    async generateBundle() {
      const { bundle, issues } = await compile();
      const errors = issues.filter((i) => i.level === 'error');
      if (errors.length) {
        this.error(
          `Content has ${errors.length} error(s). Run "npm run validate" for details.\n` +
            errors.map((i) => `  ${i.file}${i.path ? ` ${i.path}` : ''}: ${i.message}`).join('\n'),
        );
      }
      this.emitFile({ type: 'asset', fileName: 'content.json', source: JSON.stringify({ ...bundle, issues: [] }) });
      for (const name of QURAN_NAMES) {
        this.emitFile({ type: 'asset', fileName: `data/quran/${name}`, source: readFileSync(join(QURAN_DIR, name)) });
      }
    },
  };
}
