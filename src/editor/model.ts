/**
 * Form models for the editor. A form model is the content item with every optional
 * part filled in (empty strings, empty lists), so form fields can bind to it.
 * `fromForm` turns it back into content: blanks are removed by `clean`.
 */
import {
  clean,
  refId,
  refLocator,
  tidySourceRef,
  type Collection,
  type CqrEvent,
  type Era,
  type Geometry,
  type LangText,
  type Lane,
  type Source,
  type SourceRef,
} from '../lib/schema';

export interface LangForm {
  en: string;
  ar: string;
}
export interface RefForm {
  id: string;
  locator: string;
}

const lang = (t?: LangText): LangForm => ({ en: t?.en ?? '', ar: t?.ar ?? '' });
const refs = (r?: SourceRef[]): RefForm[] => (r ?? []).map((x) => ({ id: refId(x), locator: refLocator(x) ?? '' }));
const outRefs = (r: RefForm[]): SourceRef[] => r.filter((x) => x.id).map((x) => tidySourceRef({ id: x.id, locator: x.locator }));
const deep = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export interface EventForm {
  id: string;
  kind: 'event' | 'period';
  lane: string;
  review: 'draft' | 'reviewed';
  title: LangForm;
  summary: LangForm;
  when: {
    from: number | undefined;
    to: number | undefined;
    certainty: CqrEvent['when']['certainty'];
    basis: LangForm;
    alternatives: { from: number | undefined; to: number | undefined; basis: LangForm; sources: RefForm[] }[];
  };
  place: {
    status: CqrEvent['place']['status'];
    names: { name: string; type: 'ancient' | 'modern'; language: string }[];
    description: LangForm;
    geometry: Geometry | undefined;
    opinions: { name: LangForm; geometry: Geometry | undefined; sources: RefForm[] }[];
  };
  quran: string[];
  tafsir: { text: LangForm; source: RefForm[] }[];
  history: { claim: LangForm; status: 'established' | 'debated'; sources: RefForm[] }[];
  connection: { text: LangForm; confidence: '' | 'low' | 'medium' | 'high' };
  related: { id: string; type: 'context' | 'consequence' | 'parallel' }[];
  tags: string;
  notes: string;
}

export function eventToForm(e?: CqrEvent): EventForm {
  return {
    id: e?.id ?? '',
    kind: e?.kind ?? 'event',
    lane: e?.lane ?? '',
    review: e?.review ?? 'draft',
    title: lang(e?.title),
    summary: lang(e?.summary),
    when: {
      from: e?.when.from,
      to: e?.when.to,
      certainty: e?.when.certainty ?? 'estimated',
      basis: lang(e?.when.basis),
      alternatives: (e?.when.alternatives ?? []).map((a) => ({ from: a.from, to: a.to, basis: lang(a.basis), sources: refs(a.sources) })),
    },
    place: {
      status: e?.place.status ?? 'unknown',
      names: (e?.place.names ?? []).map((n) => ({ name: n.name, type: n.type, language: n.language ?? '' })),
      description: lang(e?.place.description),
      geometry: e?.place.geometry ? deep(e.place.geometry) : undefined,
      opinions: (e?.place.opinions ?? []).map((o) => ({
        name: lang(o.name),
        geometry: o.geometry ? deep(o.geometry) : undefined,
        sources: refs(o.sources),
      })),
    },
    quran: [...(e?.quran ?? [])],
    tafsir: (e?.tafsir ?? []).map((t) => ({ text: lang(t.text), source: t.source ? refs([t.source]) : [] })),
    history: (e?.history ?? []).map((h) => ({ claim: lang(h.claim), status: h.status, sources: refs(h.sources) })),
    connection: { text: lang(e?.connection?.text), confidence: e?.connection?.confidence ?? '' },
    related: (e?.related ?? []).map((r) => ({ ...r })),
    tags: (e?.tags ?? []).join(', '),
    notes: e?.notes ?? '',
  };
}

export function eventFromForm(f: EventForm): unknown {
  const place = f.place;
  return clean({
    id: f.id,
    kind: f.kind,
    lane: f.lane,
    review: f.review,
    title: f.title,
    summary: f.summary,
    when: {
      from: f.when.from,
      to: f.when.to,
      certainty: f.when.certainty,
      basis: f.when.basis,
      alternatives: f.when.alternatives.map((a) => ({ from: a.from, to: a.to, basis: a.basis, sources: outRefs(a.sources) })),
    },
    place: {
      status: place.status,
      names: place.names,
      description: place.description,
      // An unknown place is described, not pinned: drop any geometry left over in the form.
      geometry: place.status === 'unknown' ? undefined : place.geometry,
      opinions:
        place.status === 'proposed'
          ? place.opinions.map((o) => ({ name: o.name, geometry: o.geometry, sources: outRefs(o.sources) }))
          : undefined,
    },
    quran: f.quran.map((q) => q.trim()),
    tafsir: f.tafsir.map((t) => ({ text: t.text, source: outRefs(t.source)[0] })),
    history: f.history.map((h) => ({ claim: h.claim, status: h.status, sources: outRefs(h.sources) })),
    connection: f.connection.text.en || f.connection.text.ar ? { text: f.connection.text, confidence: f.connection.confidence || undefined } : undefined,
    related: f.related.filter((r) => r.id),
    tags: f.tags.split(',').map((t) => t.trim()),
    notes: f.notes,
  });
}

export interface LaneForm {
  id: string;
  name: LangForm;
  order: number | undefined;
  pinned: boolean;
  color: string;
  description: LangForm;
}

export function laneToForm(l?: Lane, nextOrder = 0): LaneForm {
  return {
    id: l?.id ?? '',
    name: lang(l?.name),
    order: l?.order ?? nextOrder,
    pinned: l?.pinned ?? false,
    color: l?.color ?? '#607d8b',
    description: lang(l?.description),
  };
}

export function laneFromForm(f: LaneForm): unknown {
  return clean({ ...f, order: f.order ?? 0 });
}

export interface EraForm {
  id: string;
  name: LangForm;
  from: number | undefined;
  to: number | undefined;
  region: LangForm;
  color: string;
  useColor: boolean;
  review: 'draft' | 'reviewed';
  sources: RefForm[];
  notes: string;
}

export function eraToForm(e?: Era): EraForm {
  return {
    id: e?.id ?? '',
    name: lang(e?.name),
    from: e?.from,
    to: e?.to,
    region: lang(e?.region),
    color: e?.color ?? '#9b5d5d',
    useColor: !!e?.color,
    review: e?.review ?? 'draft',
    sources: refs(e?.sources),
    notes: e?.notes ?? '',
  };
}

export function eraFromForm(f: EraForm): unknown {
  const { useColor, ...rest } = f;
  return clean({ ...rest, color: useColor ? f.color : undefined, sources: outRefs(f.sources) });
}

export interface SourceForm {
  id: string;
  type: Source['type'];
  authors: string;
  editors: string;
  title: string;
  title_original: string;
  container: string;
  edition: string;
  volume: string;
  issue: string;
  pages: string;
  year: string;
  publisher: string;
  place: string;
  doi: string;
  url: string;
  accessed: string;
  notes: string;
}

export function sourceToForm(s?: Source): SourceForm {
  return {
    id: s?.id ?? '',
    type: s?.type ?? 'book',
    authors: (s?.authors ?? []).join('; '),
    editors: (s?.editors ?? []).join('; '),
    title: s?.title ?? '',
    title_original: s?.title_original ?? '',
    container: s?.container ?? '',
    edition: s?.edition ?? '',
    volume: s?.volume ?? '',
    issue: s?.issue ?? '',
    pages: s?.pages ?? '',
    year: s?.year !== undefined ? String(s.year) : '',
    publisher: s?.publisher ?? '',
    place: s?.place ?? '',
    doi: s?.doi ?? '',
    url: s?.url ?? '',
    accessed: s?.accessed ?? '',
    notes: s?.notes ?? '',
  };
}

export function sourceFromForm(f: SourceForm): unknown {
  const year = f.year.trim();
  return clean({
    ...f,
    authors: f.authors.split(';').map((a) => a.trim()),
    editors: f.editors.split(';').map((a) => a.trim()),
    year: /^\d{1,4}$/.test(year) ? Number(year) : year,
  });
}

export const COLLECTION_LABEL: Record<Collection, { one: string; many: string }> = {
  events: { one: 'event', many: 'Events' },
  lanes: { one: 'lane', many: 'Lanes' },
  eras: { one: 'era', many: 'Eras' },
  sources: { one: 'source', many: 'Sources' },
};
