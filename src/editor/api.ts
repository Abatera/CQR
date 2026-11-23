/** Client for the dev server's write API (scripts/vite-plugin-cqr.ts). */
import type { Collection } from '../lib/schema';
import type { Issue } from '../lib/validate';
import type { ContentData } from '../state/app.svelte';

export type ApiResult =
  | { ok: true; file: string; content: ContentData }
  | { ok: false; message?: string; errors: Issue[] };

async function post(url: string, body: unknown): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, message: `The dev server did not respond: ${e instanceof Error ? e.message : String(e)}`, errors: [] };
  }
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; file?: string; content?: ContentData; error?: string; errors?: Issue[] };
  if (res.ok && json.ok && json.content && json.file) return { ok: true, file: json.file, content: json.content };
  return { ok: false, message: json.error, errors: json.errors ?? [] };
}

export function saveItem(collection: Collection, data: unknown, create: boolean) {
  return post('/__cqr/api/save', { collection, data, create });
}

export function deleteItem(collection: Collection, id: string) {
  return post('/__cqr/api/delete', { collection, id });
}
