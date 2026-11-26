import { describe, expect, it } from 'vitest';
import { clean } from '../src/lib/schema';
import { newErrors, validateContent, type RawContent } from '../src/lib/validate';

const counts = [0, 7, 286];

function baseEvent(over: Record<string, unknown> = {}) {
  return {
    id: 'test-event',
    kind: 'event',
    lane: 'quran',
    review: 'draft',
    title: { en: 'Test' },
    summary: { en: 'A test event.' },
    when: { from: -1010, to: -970, certainty: 'traditional', basis: { en: 'Tradition.' } },
    place: { status: 'unknown', description: { en: 'Not named.' } },
    ...over,
  };
}

function raw(events: unknown[], extra: Partial<RawContent> = {}): RawContent {
  return {
    lanes: [{ file: 'content/lanes.yaml', data: { id: 'quran', name: { en: 'Quran' }, order: 0 } }],
    eras: [],
    sources: [{ file: 'content/sources.yaml', data: { id: 'src-a', type: 'book', title: 'A book' } }],
    events: events.map((data) => ({ file: `content/events/${(data as { id: string }).id}.yaml`, data })),
    fileIssues: [],
    ...extra,
  };
}

const errors = (r: ReturnType<typeof validateContent>) => r.issues.filter((i) => i.level === 'error');
const warnings = (r: ReturnType<typeof validateContent>) => r.issues.filter((i) => i.level === 'warning');

describe('content validation', () => {
  it('accepts a minimal valid event', () => {
    const r = validateContent(raw([baseEvent()]), counts);
    expect(errors(r)).toEqual([]);
    expect(r.bundle.events).toHaveLength(1);
  });

  it('rejects year 0, reversed ranges and unknown keys', () => {
    const r = validateContent(raw([baseEvent({ when: { from: 0, to: -5, certainty: 'debated', basis: { en: 'x' } }, color: 'red' })]), counts);
    const msgs = errors(r).map((e) => e.message).join(' | ');
    expect(msgs).toMatch(/no year 0/);
    expect(msgs).toMatch(/Unrecognized key/);
  });

  it('checks lanes, sources, related events and Quran references', () => {
    const r = validateContent(
      raw([
        baseEvent({
          lane: 'nowhere',
          quran: ['2:300'],
          history: [{ claim: { en: 'c' }, status: 'established', sources: ['missing'] }],
          related: [{ id: 'ghost', type: 'context' }],
        }),
      ]),
      counts,
    );
    const paths = errors(r).map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['lane', 'quran[0]', 'history[0].sources[0]', 'related[0].id']));
  });

  it('allows unsourced claims in drafts as warnings, but not in reviewed entries', () => {
    const history = [{ claim: { en: 'c' }, status: 'established' }];
    const draft = validateContent(raw([baseEvent({ history })]), counts);
    expect(errors(draft)).toEqual([]);
    expect(warnings(draft).map((w) => w.path)).toContain('history[0].sources');
    const reviewed = validateContent(raw([baseEvent({ history, review: 'reviewed' })]), counts);
    expect(errors(reviewed).map((e) => e.path)).toContain('history[0].sources');
  });

  it('enforces the location rules', () => {
    const pinnedUnknown = baseEvent({ place: { status: 'unknown', description: { en: 'x' }, geometry: { type: 'Point', coordinates: [35, 31] } } });
    const knownWithout = baseEvent({ id: 'b', place: { status: 'known' } });
    const r = validateContent(raw([pinnedUnknown, knownWithout]), counts);
    const msgs = errors(r).map((e) => e.message).join(' | ');
    expect(msgs).toMatch(/described, not pinned/);
    expect(msgs).toMatch(/needs a point or an area/);
  });

  it('requires the file name to match the ID', () => {
    const r = validateContent({ ...raw([]), events: [{ file: 'content/events/other.yaml', data: baseEvent() }] }, counts);
    expect(errors(r).map((e) => e.message).join()).toMatch(/file name must match/);
  });

  it('reports only the errors a change adds', () => {
    const before = validateContent(raw([baseEvent({ lane: 'nowhere' })]), counts);
    const after = validateContent(raw([baseEvent({ lane: 'nowhere' }), baseEvent({ id: 'b', quran: ['1:9'] })]), counts);
    const added = newErrors(before.issues, after.issues);
    expect(added).toHaveLength(1);
    expect(added[0].path).toBe('quran[0]');
  });

  it('cleans blank form values', () => {
    expect(clean({ a: '', b: [], c: { en: '', ar: '' }, d: ' x ', e: false, f: 0, g: [1, ''] })).toEqual({ d: 'x', f: 0, g: [1] });
  });

  it('requires a source for reports and a grading for hadith', () => {
    const tradition = [
      { kind: 'hadith', attribution: { en: 'The Prophet ﷺ' }, text: { en: 'A report.' } },
      { kind: 'historian', attribution: { en: 'Ibn Kathir' }, text: { en: 'An account.' }, source: 'src-a' },
    ];
    const draft = validateContent(raw([baseEvent({ tradition })]), counts);
    expect(errors(draft)).toEqual([]);
    expect(warnings(draft).map((w) => w.path)).toEqual(expect.arrayContaining(['tradition[0].source', 'tradition[0].gradings']));
    expect(warnings(draft).map((w) => w.path)).not.toContain('tradition[1].gradings');
    const reviewed = validateContent(raw([baseEvent({ tradition, review: 'reviewed' })]), counts);
    expect(errors(reviewed).map((e) => e.path)).toEqual(expect.arrayContaining(['tradition[0].source', 'tradition[0].gradings']));
  });

  it('checks the sources cited by gradings', () => {
    const tradition = [
      {
        kind: 'hadith',
        attribution: { en: 'The Prophet ﷺ' },
        text: { en: 'A report.' },
        source: 'src-a',
        gradings: [{ grade: 'sahih', by: { en: 'al-Albani' }, source: 'missing' }],
      },
    ];
    const r = validateContent(raw([baseEvent({ tradition })]), counts);
    expect(errors(r).map((e) => e.path)).toContain('tradition[0].gradings[0].source');
  });

  it('requires the certain part of a span to lie inside it', () => {
    const when = (core: { from: number; to: number }) => ({
      from: -4350,
      to: -3000,
      certainty: 'reckoned',
      basis: { en: 'Reckoned.' },
      core: { ...core, basis: { en: 'The Quran gives 950 years.' } },
    });
    const inside = validateContent(raw([baseEvent({ when: when({ from: -4300, to: -3351 }) })]), counts);
    expect(errors(inside)).toEqual([]);
    const outside = validateContent(raw([baseEvent({ when: when({ from: -4400, to: -3351 }) })]), counts);
    expect(errors(outside).map((e) => e.path)).toContain('when.core');
  });

  it('accepts the reckoned certainty', () => {
    const r = validateContent(raw([baseEvent({ when: { from: -4250, to: -3751, certainty: 'reckoned', basis: { en: 'Reckoned.' } } })]), counts);
    expect(errors(r)).toEqual([]);
  });

  it('asks for ﷺ after the name of the Prophet, but not after other people named Muhammad', () => {
    const bare = validateContent(raw([baseEvent({ summary: { en: 'Muhammad was born in Mecca.' } })]), counts);
    expect(warnings(bare).map((w) => w.path)).toContain('summary.en');
    const ok = validateContent(
      raw([baseEvent({ summary: { en: "Muhammad ﷺ was born in Mecca, as Muhammad ibn Ishaq reports; Muhammad 'Abduh and Muhammad Nasir al-Din al-Albani wrote later." } })]),
      counts,
    );
    expect(warnings(ok).map((w) => w.path)).not.toContain('summary.en');
    const end = validateContent(raw([baseEvent({ summary: { en: 'Between Jesus and Muhammad.' } })]), counts);
    expect(warnings(end).map((w) => w.path)).toContain('summary.en');
  });
});
