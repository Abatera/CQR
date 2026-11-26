/**
 * The content schema, shared by the app, the editor forms and the build validator.
 * See docs/04-data-model.md for the reasoning behind each field.
 *
 * This file checks the shape of a single item. Checks that need the rest of the
 * content (that a lane, source or related event exists, that a Quran reference
 * exists in the dataset) live in src/lib/validate.ts.
 */
import { z } from 'zod';
import { parseRef, formatRef } from './quran-ref.ts';

export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const Id = z.string().regex(ID_RE, 'Use lowercase letters, digits and hyphens, e.g. "david-armor".');

/** Text shown to readers, as a language map. English is required for now; Arabic is optional. */
export const LangText = z.strictObject({
  en: z.string().trim().min(1, 'English text is required.'),
  ar: z.string().trim().min(1).optional(),
});

export const YearSchema = z
  .number({ error: 'Enter a year.' })
  .int('A year must be a whole number.')
  .refine((n) => n !== 0, 'There is no year 0. Use -1 for 1 BCE or 1 for 1 CE.')
  .refine((n) => n >= -100000 && n <= 3000, 'The year is out of range.');

/** A citation: a source ID, or a source ID with a precise place in the work. */
export const SourceRef = z.union([
  Id,
  z.strictObject({
    id: Id,
    locator: z.string().trim().min(1).optional(),
  }),
]);

export const QuranRefString = z.string().refine((s) => {
  const r = parseRef(s);
  return r !== null && formatRef(r) === s;
}, 'Use "surah:ayah" or "surah:ayah-ayah", e.g. "34:10-11".');

/**
 * How a date is known. "reckoned" is for times before history can date anything
 * (the prophets before Abraham): years computed from intervals reported in tradition.
 */
export const CERTAINTIES = ['established', 'estimated', 'traditional', 'reckoned', 'debated', 'unknown'] as const;
/**
 * Kinds of report in the Tradition layer:
 * - hadith: attributed to the Prophet ﷺ;
 * - athar: a report from a Companion or a Successor;
 * - historian: an account or reckoning by a Muslim historian or commentator;
 * - ahl-al-kitab: a report from the People of the Book, as transmitted by Muslim scholars or
 *   cited from their scriptures.
 */
export const TRADITION_KINDS = ['hadith', 'athar', 'historian', 'ahl-al-kitab'] as const;
/** Hadith gradings, as given by a named scholar. */
export const GRADES = ['sahih', 'hasan', 'daif', 'very-weak', 'fabricated', 'other'] as const;
export const CLAIM_STATUSES = ['established', 'debated'] as const;
export const CONFIDENCES = ['low', 'medium', 'high'] as const;
export const LOCATION_STATUSES = ['known', 'proposed', 'unknown'] as const;
export const RELATION_TYPES = ['context', 'consequence', 'parallel'] as const;
export const EVENT_KINDS = ['event', 'period'] as const;
export const REVIEW_STATES = ['draft', 'reviewed'] as const;
export const SOURCE_TYPES = ['book', 'article', 'chapter', 'inscription', 'tafsir', 'website', 'other'] as const;
export const NAME_TYPES = ['ancient', 'modern'] as const;

const fromBeforeTo = (v: { from: number; to: number }) => v.from <= v.to;
const FROM_TO_MSG = { message: 'The start year must not be after the end year.', path: ['to'] };

export const DateAlternative = z
  .strictObject({
    from: YearSchema,
    to: YearSchema,
    basis: LangText,
    sources: z.array(SourceRef).optional(),
  })
  .refine(fromBeforeTo, FROM_TO_MSG);

/**
 * The part of a span that a source fixes, inside a longer span that is less certain,
 * e.g. the 950 years Noah spent among his people (Quran 29:14) within his whole life.
 * It is drawn solid inside the bar.
 */
export const CoreSpan = z
  .strictObject({
    from: YearSchema,
    to: YearSchema,
    basis: LangText,
  })
  .refine(fromBeforeTo, FROM_TO_MSG);

export const When = z
  .strictObject({
    from: YearSchema,
    to: YearSchema,
    certainty: z.enum(CERTAINTIES),
    /** What the date rests on, e.g. "traditional biblical chronology". */
    basis: LangText,
    core: CoreSpan.optional(),
    alternatives: z.array(DateAlternative).optional(),
  })
  .refine(fromBeforeTo, FROM_TO_MSG)
  .refine((w) => !w.core || (w.core.from >= w.from && w.core.to <= w.to), {
    message: 'The certain part must lie inside the whole span.',
    path: ['core'],
  });

/** [longitude, latitude], as in GeoJSON. */
export const LonLat = z.tuple([
  z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.'),
  z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
]);

export const PointGeometry = z.strictObject({
  type: z.literal('Point'),
  coordinates: LonLat,
});

export const PolygonGeometry = z.strictObject({
  type: z.literal('Polygon'),
  coordinates: z
    .array(
      z
        .array(LonLat)
        .min(4, 'An area needs at least three corners.')
        .refine((ring) => {
          const a = ring[0];
          const b = ring[ring.length - 1];
          return a[0] === b[0] && a[1] === b[1];
        }, 'An area outline must end where it starts.'),
    )
    .min(1),
});

export const Geometry = z.discriminatedUnion('type', [PointGeometry, PolygonGeometry]);

export const PlaceName = z.strictObject({
  name: z.string().trim().min(1, 'Enter the name.'),
  type: z.enum(NAME_TYPES),
  /** The language of the name, e.g. "Akkadian", "Hebrew", "Arabic". */
  language: z.string().trim().min(1).optional(),
});

export const LocationOpinion = z.strictObject({
  name: LangText,
  geometry: Geometry.optional(),
  sources: z.array(SourceRef).optional(),
});

export const Place = z
  .strictObject({
    status: z.enum(LOCATION_STATUSES),
    names: z.array(PlaceName).optional(),
    /** For an unknown place: what the text says about it. */
    description: LangText.optional(),
    geometry: Geometry.optional(),
    /** For a disputed place: each candidate location with its source. */
    opinions: z.array(LocationOpinion).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.status === 'unknown') {
      if (p.geometry) ctx.addIssue({ code: 'custom', path: ['geometry'], message: 'An unknown place is described, not pinned. Remove the geometry or change the status.' });
      if (p.opinions?.length) ctx.addIssue({ code: 'custom', path: ['opinions'], message: 'An unknown place has no candidate locations. Use the status "proposed" instead.' });
      if (!p.description) ctx.addIssue({ code: 'custom', path: ['description'], message: 'Describe what the text says about an unknown place.' });
    }
    if (p.status === 'known' && !p.geometry) {
      ctx.addIssue({ code: 'custom', path: ['geometry'], message: 'A known place needs a point or an area on the map.' });
    }
    if (p.status === 'known' && p.opinions?.length) {
      ctx.addIssue({ code: 'custom', path: ['opinions'], message: 'A known place has no competing opinions. Use the status "proposed" instead.' });
    }
    if (p.status === 'proposed' && !p.geometry && !p.opinions?.length) {
      ctx.addIssue({ code: 'custom', path: ['opinions'], message: 'A proposed place needs an area or at least one opinion.' });
    }
  });

/**
 * The wording of a cited work, quoted verbatim as it was read there (usually Arabic). It is kept apart
 * from `text`, which is the project's own summary or translation, in English and Arabic.
 */
export const OriginalWording = z.string().trim().min(1);

export const TafsirItem = z.strictObject({
  /** What the commentator says, in the project's words. */
  text: LangText,
  /** The commentator's own words, quoted from the cited work. */
  original: OriginalWording.optional(),
  source: SourceRef.optional(),
});

export const Grading = z.strictObject({
  grade: z.enum(GRADES),
  /** The scholar who gave the grading, e.g. "al-Hakim", "al-Dhahabi", "al-Albani", "Ibn Kathir". */
  by: z.strictObject({
    en: z.string().trim().min(1, 'Name the scholar who gave the grading.'),
    ar: z.string().trim().min(1).optional(),
  }),
  source: SourceRef.optional(),
  /** The grading in the scholar's words, or a short explanation, e.g. "on the condition of Muslim". */
  note: LangText.optional(),
});

/** A report from hadith, the Companions and Successors, or the classical historians. */
export const TraditionItem = z.strictObject({
  kind: z.enum(TRADITION_KINDS),
  /** Who it is attributed to, e.g. "The Prophet ﷺ, narrated by Abu Umama al-Bahili". */
  attribution: LangText,
  /** What the report says, in the project's words (a summary or translation, not the source's wording). */
  text: LangText,
  /** The report's own words, quoted from the cited work. Never written from memory. */
  original: OriginalWording.optional(),
  source: SourceRef.optional(),
  gradings: z.array(Grading).optional(),
});

export const HistoryClaim = z.strictObject({
  claim: LangText,
  status: z.enum(CLAIM_STATUSES),
  sources: z.array(SourceRef).optional(),
});

export const Connection = z.strictObject({
  text: LangText,
  /** Set by the owner. Required before an event is marked reviewed. */
  confidence: z.enum(CONFIDENCES).optional(),
});

export const Relation = z.strictObject({
  id: Id,
  type: z.enum(RELATION_TYPES),
});

export const EventSchema = z.strictObject({
  id: Id,
  kind: z.enum(EVENT_KINDS),
  lane: Id,
  /** "draft" until the owner has reviewed the content. Drafts are labeled in the app. */
  review: z.enum(REVIEW_STATES),
  title: LangText,
  summary: LangText,
  when: When,
  place: Place,
  quran: z.array(QuranRefString).optional(),
  tafsir: z.array(TafsirItem).optional(),
  tradition: z.array(TraditionItem).optional(),
  history: z.array(HistoryClaim).optional(),
  connection: Connection.optional(),
  related: z.array(Relation).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  /** Editorial notes for contributors: open questions, things to verify. Not shown to readers. */
  notes: z.string().trim().min(1).optional(),
});

export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const LaneSchema = z.strictObject({
  id: Id,
  name: LangText,
  order: z.number().int('The order must be a whole number.'),
  pinned: z.boolean().optional(),
  color: z.string().regex(HEX_COLOR_RE, 'Use a color like "#3a6ea5".').optional(),
  description: LangText.optional(),
});

export const EraSchema = z
  .strictObject({
    id: Id,
    name: LangText,
    from: YearSchema,
    to: YearSchema,
    /** Where these period names apply. Archaeological periods differ by region. */
    region: LangText.optional(),
    color: z.string().regex(HEX_COLOR_RE, 'Use a color like "#3a6ea5".').optional(),
    review: z.enum(REVIEW_STATES),
    sources: z.array(SourceRef).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .refine(fromBeforeTo, FROM_TO_MSG);

export const SourceSchema = z.strictObject({
  id: Id,
  type: z.enum(SOURCE_TYPES),
  authors: z.array(z.string().trim().min(1)).optional(),
  editors: z.array(z.string().trim().min(1)).optional(),
  title: z.string().trim().min(1, 'Enter the title.'),
  /** The title in its original script, e.g. Arabic for a tafsir. */
  title_original: z.string().trim().min(1).optional(),
  /** The journal for an article, or the book for a chapter. */
  container: z.string().trim().min(1).optional(),
  edition: z.string().trim().min(1).optional(),
  volume: z.string().trim().min(1).optional(),
  issue: z.string().trim().min(1).optional(),
  pages: z.string().trim().min(1).optional(),
  year: z.union([z.number().int(), z.string().trim().min(1)]).optional(),
  publisher: z.string().trim().min(1).optional(),
  place: z.string().trim().min(1).optional(),
  doi: z.string().trim().min(1).optional(),
  url: z.url('Enter a full URL, starting with https://').optional(),
  accessed: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

export type LangText = z.infer<typeof LangText>;
export type SourceRef = z.infer<typeof SourceRef>;
export type When = z.infer<typeof When>;
export type Geometry = z.infer<typeof Geometry>;
export type PlaceName = z.infer<typeof PlaceName>;
export type LocationOpinion = z.infer<typeof LocationOpinion>;
export type Place = z.infer<typeof Place>;
export type HistoryClaim = z.infer<typeof HistoryClaim>;
export type TafsirItem = z.infer<typeof TafsirItem>;
export type TraditionItem = z.infer<typeof TraditionItem>;
export type Grading = z.infer<typeof Grading>;
export type Relation = z.infer<typeof Relation>;
export type CqrEvent = z.infer<typeof EventSchema>;
export type Lane = z.infer<typeof LaneSchema>;
export type Era = z.infer<typeof EraSchema>;
export type Source = z.infer<typeof SourceSchema>;

export type Collection = 'events' | 'lanes' | 'eras' | 'sources';

export const SCHEMAS = {
  events: EventSchema,
  lanes: LaneSchema,
  eras: EraSchema,
  sources: SourceSchema,
} as const;

export function refId(ref: SourceRef): string {
  return typeof ref === 'string' ? ref : ref.id;
}

export function refLocator(ref: SourceRef): string | undefined {
  return typeof ref === 'string' ? undefined : ref.locator;
}

/**
 * Removes empty strings, empty arrays, empty objects, false and null/undefined,
 * recursively, and trims strings. Forms produce these for fields left blank; the
 * files should not contain them.
 */
export function clean<T>(value: T): T | undefined {
  if (value === null || value === undefined || value === false) return undefined;
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
  if (typeof value === 'string') {
    const t = value.trim();
    return (t === '' ? undefined : t) as T | undefined;
  }
  if (Array.isArray(value)) {
    const out = value.map((v) => clean(v)).filter((v) => v !== undefined);
    return (out.length ? out : undefined) as T | undefined;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    }
    return (Object.keys(out).length ? out : undefined) as T | undefined;
  }
  return value;
}

/** A source ref without a locator is written as the bare ID. */
export function tidySourceRef(ref: SourceRef): SourceRef {
  return typeof ref === 'object' && !ref.locator ? ref.id : ref;
}
