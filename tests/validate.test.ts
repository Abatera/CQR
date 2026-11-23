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
});
