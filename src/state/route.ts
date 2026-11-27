import { COLLECTIONS, type Collection } from '../lib/schema';

/**
 * Every view has a URL in the hash, so it can be shared and bookmarked:
 *   #/                      home: what the site is, journeys, how to read an entry
 *   #/explore               explore, nothing selected
 *   #/event/<id>            explore, with an event selected
 *   #/journeys              the list of guided journeys
 *   #/journey/<id>[/<n>]    a journey, at step n (counted from 1)
 *   #/quran                 Quran reader
 *   #/quran/<s>[/<a>]       a surah, optionally scrolled to a verse
 *   #/quran/search/<query>  search results
 *   #/edit/<collection>[/<id>|/new]   editor (local dev server only)
 */
export type Route =
  | { view: 'home' }
  | { view: 'explore'; eventId?: string }
  | { view: 'journeys' }
  | { view: 'journey'; id: string; step: number }
  | { view: 'quran'; surah?: number; ayah?: number; query?: string }
  | { view: 'edit'; collection: Collection; id?: string; isNew?: boolean }
  | { view: 'about' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [head, a, b] = parts;
  switch (head) {
    case 'explore':
      return { view: 'explore' };
    case 'event':
      return { view: 'explore', eventId: a };
    case 'journeys':
      return { view: 'journeys' };
    case 'journey':
      return a ? { view: 'journey', id: a, step: Math.max(1, Number(b) || 1) } : { view: 'journeys' };
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
      return { view: 'home' };
  }
}

export function href(r: Route): string {
  const enc = encodeURIComponent;
  switch (r.view) {
    case 'home':
      return '#/';
    case 'explore':
      return r.eventId ? `#/event/${enc(r.eventId)}` : '#/explore';
    case 'journeys':
      return '#/journeys';
    case 'journey':
      return `#/journey/${enc(r.id)}${r.step > 1 ? `/${r.step}` : ''}`;
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
