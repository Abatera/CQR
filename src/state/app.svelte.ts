import type { Bundle, Issue } from '../lib/validate';
import type { CqrEvent, Lane, Source } from '../lib/schema';
import type { Lang } from '../lib/i18n';
import { loadQuranData, type QuranData } from '../quran/quran-data';
import { href, parseHash, type Route } from './route';

export interface ContentData extends Bundle {
  issues: Issue[];
}

const HIDDEN_LANES_KEY = 'cqr.hiddenLanes';
const LANG_KEY = 'cqr.lang';

function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function loadHiddenLanes(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HIDDEN_LANES_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** True on the local dev server, where the editor can write content files. */
export const CAN_EDIT = import.meta.env.DEV;

class AppState {
  content = $state.raw<ContentData | null>(null);
  contentError = $state<string | null>(null);
  quran = $state.raw<QuranData | null>(null);
  quranError = $state<string | null>(null);
  route = $state<Route>(parseHash(location.hash));
  hiddenLanes = $state<string[]>(loadHiddenLanes());
  /** The language the content is read in (D21). The rest of the interface stays in English for now. */
  lang = $state<Lang>(loadLang());
  /** Set by the editor forms while they have unsaved changes. */
  editorDirty = $state(false);

  eventsById = $derived(new Map<string, CqrEvent>((this.content?.events ?? []).map((e) => [e.id, e])));
  lanesById = $derived(new Map<string, Lane>((this.content?.lanes ?? []).map((l) => [l.id, l])));
  sourcesById = $derived(new Map<string, Source>((this.content?.sources ?? []).map((s) => [s.id, s])));

  selectedId = $derived(this.route.view === 'explore' ? this.route.eventId : undefined);
  selected = $derived(this.selectedId ? this.eventsById.get(this.selectedId) : undefined);

  /** Lanes in display order: pinned first, then by order. */
  lanes = $derived(
    [...(this.content?.lanes ?? [])].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.order - b.order),
  );
  visibleLanes = $derived(this.lanes.filter((l) => l.pinned || !this.hiddenLanes.includes(l.id)));

  /** Events in visible lanes, in time order. Arrow keys step through these. */
  visibleEvents = $derived.by(() => {
    const ids = new Set(this.visibleLanes.map((l) => l.id));
    return (this.content?.events ?? []).filter((e) => ids.has(e.lane));
  });

  async loadContent() {
    try {
      const res = await fetch('./content.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.content = (await res.json()) as ContentData;
      this.contentError = null;
    } catch (e) {
      this.contentError = `Could not load the content: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  setContent(content: ContentData) {
    this.content = content;
  }

  async loadQuran() {
    if (this.quran) return this.quran;
    try {
      this.quran = await loadQuranData();
      this.quranError = null;
    } catch (e) {
      this.quranError = `Could not load the Quran text: ${e instanceof Error ? e.message : String(e)}`;
    }
    return this.quran;
  }

  navigate(r: Route) {
    const h = href(r);
    if (location.hash !== h) location.hash = h;
    else this.route = r;
  }

  select(id: string | undefined) {
    this.navigate({ view: 'explore', eventId: id });
  }

  /** Selects the next (+1) or previous (-1) visible event in time order. */
  step(dir: 1 | -1) {
    const list = this.visibleEvents;
    if (!list.length) return;
    const i = this.selectedId ? list.findIndex((e) => e.id === this.selectedId) : -1;
    const next = i < 0 ? (dir > 0 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, i + dir));
    this.select(list[next].id);
  }

  setLang(lang: Lang) {
    this.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Private browsing: the choice lasts for this visit only.
    }
  }

  toggleLane(id: string) {
    this.hiddenLanes = this.hiddenLanes.includes(id) ? this.hiddenLanes.filter((x) => x !== id) : [...this.hiddenLanes, id];
    localStorage.setItem(HIDDEN_LANES_KEY, JSON.stringify(this.hiddenLanes));
  }
}

export const app = new AppState();

window.addEventListener('hashchange', () => {
  app.route = parseHash(location.hash);
});
