import type { Collection } from '../lib/schema';

/**
 * Every view has a URL in the hash, so it can be shared and bookmarked:
 *   #/                      explore, nothing selected
 *   #/event/<id>            explore, with an event selected
 *   #/quran                 Quran reader
 *   #/quran/<s>[/<a>]       a surah, optionally scrolled to a verse
 *   #/quran/search/<query>  search results
 *   #/edit/<collection>[/<id>|/new]   editor (local dev server only)
 */
export type Route =
  | { view: 'explore'; eventId?: string }
  | { view: 'quran'; surah?: number; ayah?: number; query?: string }
  | { view: 'edit'; collection: Collection; id?: string; isNew?: boolean }
  | { view: 'about' };

const COLLECTIONS: Collection[] = ['events', 'lanes', 'eras', 'sources'];

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [head, a, b] = parts;
  switch (head) {
    case 'event':
      return { view: 'explore', eventId: a };
    case 'quran':
      if (a === 'search') return { view: 'quran', query: parts.slice(2).join('/') };
      return { view: 'quran', surah: a ? Number(a) || undefined : undefined, ayah: b ? Number(b) || undefined : undefined };
    case 'edit': {
      const collection = COLLECTIONS.includes(a as Collection) ? (a as Collection) : 'events';
      if (b === 'new') return { view: 'edit', collection, isNew: true };
      return { view: 'edit', collection, id: b };
    }
    case 'about':
      return { view: 'about' };
    default:
      return { view: 'explore' };
  }
}

export function href(r: Route): string {
  const enc = encodeURIComponent;
  switch (r.view) {
    case 'explore':
      return r.eventId ? `#/event/${enc(r.eventId)}` : '#/';
    case 'quran':
      if (r.query) return `#/quran/search/${enc(r.query)}`;
      if (r.surah) return `#/quran/${r.surah}${r.ayah ? `/${r.ayah}` : ''}`;
      return '#/quran';
    case 'edit':
      return `#/edit/${r.collection}${r.isNew ? '/new' : r.id ? `/${enc(r.id)}` : ''}`;
    case 'about':
      return '#/about';
  }
}
