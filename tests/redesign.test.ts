import { describe, expect, it } from 'vitest';
import { countText, offsetText, stepOfText } from '../src/lib/i18n';
import { aroundThisTime, gapYears } from '../src/lib/nearby';
import { JourneySchema, type CqrEvent } from '../src/lib/schema';
import { validateContent, type RawContent } from '../src/lib/validate';
import { href, parseHash } from '../src/state/route';
import { foldLatin } from '../src/lib/text';

const ev = (id: string, from: number, to: number, extra: Record<string, unknown> = {}) => ({
  id,
  kind: 'period',
  lane: 'prophets',
  review: 'draft',
  title: { en: id },
  summary: { en: `About ${id}.` },
  when: { from, to, certainty: 'reckoned', basis: { en: 'A reckoning.' } },
  place: { status: 'unknown', description: { en: 'Not named.' } },
  ...extra,
});

const raw = (events: unknown[], journeys: unknown[] = []): RawContent => ({
  lanes: [{ file: 'content/lanes.yaml', data: { id: 'prophets', name: { en: 'Prophets' }, order: 0 } }],
  eras: [],
  sources: [],
  events: events.map((data) => ({ file: `content/events/${(data as { id: string }).id}.yaml`, data })),
  journeys: journeys.map((data) => ({ file: 'content/journeys.yaml', data })),
  fileIssues: [],
});

describe('journeys', () => {
  const journey = (steps: string[]) => ({
    id: 'a-journey',
    title: { en: 'A journey' },
    summary: { en: 'Two steps.' },
    review: 'draft',
    order: 1,
    steps: steps.map((event) => ({ event })),
  });

  it('needs at least two steps', () => {
    expect(JourneySchema.safeParse(journey(['noah'])).success).toBe(false);
    expect(JourneySchema.safeParse(journey(['adam', 'noah'])).success).toBe(true);
  });

  it('reports a step whose event does not exist', () => {
    const { issues, bundle } = validateContent(raw([ev('adam', -5601, -4642), ev('noah', -4516, -3166)], [journey(['adam', 'nobody'])]), [0]);
    const errors = issues.filter((i) => i.collection === 'journeys');
    expect(errors.map((i) => i.path)).toEqual(['steps[1].event']);
    expect(bundle.journeys).toHaveLength(1);
  });

  it('is optional in older content', () => {
    const { bundle } = validateContent({ ...raw([ev('adam', -5601, -4642)]), journeys: undefined }, [0]);
    expect(bundle.journeys).toEqual([]);
  });
});

describe('reckoning chains', () => {
  const chained = (chain: unknown[]) => ev('the-flood', -3516, -3516, { when: { from: -3516, to: -3516, certainty: 'reckoned', basis: { en: 'A reckoning.' }, chain } });
  const warnings = (e: unknown) => validateContent(raw([e]), [0]).issues.filter((i) => i.path?.startsWith('when.chain')).map((i) => i.path);

  it('accepts a chain that reaches the entry’s own years, with every step explained', () => {
    expect(
      warnings(
        chained([
          { label: { en: 'Abraham born' }, year: -2166 },
          { label: { en: 'Noah dies' }, year: -3166, gap: { en: '1,000 years earlier' } },
          { label: { en: 'The Flood' }, year: -3516, gap: { en: '350 years earlier' } },
        ]),
      ),
    ).toEqual([]);
  });

  it('warns when no step falls inside the entry, or a step does not say how it is counted', () => {
    expect(
      warnings(
        chained([
          { label: { en: 'Abraham born' }, year: -2166 },
          { label: { en: 'Noah dies' }, year: -3166 },
        ]),
      ),
    ).toEqual(['when.chain', 'when.chain[1].gap']);
  });
});

describe('around this time', () => {
  const noah = ev('noah', -4516, -3166) as unknown as CqrEvent;
  const flood = ev('the-flood', -3516, -3516) as unknown as CqrEvent;
  const layers = ev('flood-layers', -3100, -2900) as unknown as CqrEvent;
  const adam = ev('adam', -5601, -4642) as unknown as CqrEvent;

  it('measures the years between two events, 0 when they overlap', () => {
    expect(gapYears(flood, noah)).toBe(0);
    expect(gapYears(flood, layers)).toBe(416);
    expect(gapYears(flood, adam)).toBe(-(4642 - 3516));
  });

  it('lists overlapping events first, then the nearest, and leaves out the excluded ones', () => {
    expect(aroundThisTime(flood, [adam, layers, noah, flood]).map((n) => n.event.id)).toEqual(['noah', 'flood-layers']);
    expect(aroundThisTime(flood, [adam, layers, noah], new Set(['noah'])).map((n) => n.event.id)).toEqual(['flood-layers']);
  });
});

describe('counted words', () => {
  it('agrees Arabic nouns with their numbers', () => {
    expect(countText(1, 'step', 'ar')).toBe('خطوة واحدة');
    expect(countText(2, 'step', 'ar')).toBe('خطوتان');
    expect(countText(8, 'step', 'ar')).toBe('8 خطوات');
    expect(countText(25, 'step', 'ar')).toBe('25 خطوة');
    expect(countText(7, 'passage', 'en')).toBe('7 passages');
    expect(countText(1, 'opinion', 'en')).toBe('1 opinion');
  });

  it('rounds distances in time', () => {
    expect(offsetText(416, 'en')).toBe('about 400 years later');
    expect(offsetText(-1126, 'en')).toBe('about 1150 years earlier');
    expect(offsetText(416, 'ar')).toBe('بعده بنحو 400 سنة');
    expect(stepOfText(3, 8, 'en')).toBe('step 3 of 8');
  });
});

describe('routes', () => {
  it('has a home page, the explorer and journeys, and keeps old event links working', () => {
    expect(parseHash('#/')).toEqual({ view: 'home' });
    expect(parseHash('#/explore')).toEqual({ view: 'explore' });
    expect(parseHash('#/event/the-flood')).toEqual({ view: 'explore', eventId: 'the-flood' });
    expect(parseHash('#/journeys')).toEqual({ view: 'journeys' });
    expect(parseHash('#/journey/life-of-abraham/3')).toEqual({ view: 'journey', id: 'life-of-abraham', step: 3 });
    expect(parseHash('#/journey/life-of-abraham')).toEqual({ view: 'journey', id: 'life-of-abraham', step: 1 });
    expect(parseHash('#/edit/journeys/x')).toEqual({ view: 'edit', collection: 'journeys', id: 'x' });
  });

  it('writes the same URLs back', () => {
    for (const h of ['#/', '#/explore', '#/event/the-flood', '#/journeys', '#/journey/life-of-abraham/3', '#/journey/life-of-abraham']) {
      expect(href(parseHash(h))).toBe(h);
    }
  });
});

describe('search', () => {
  it('ignores case and the marks of transliteration', () => {
    expect(foldLatin("Shu'ayb")).toBe('shuayb');
    expect(foldLatin('ʿĀd')).toBe('ad');
    expect(foldLatin('Ibn ʿAsakir')).toBe('ibn asakir');
  });
});
