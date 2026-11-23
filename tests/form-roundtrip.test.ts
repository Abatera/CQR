/**
 * Opening an item in the editor and saving it without changes must give back the
 * same item. Checked against every item in content/.
 */
import { describe, expect, it } from 'vitest';
import { readContent } from '../scripts/content-fs';
import { loadQuran } from '../scripts/quran-node';
import {
  eraFromForm,
  eraToForm,
  eventFromForm,
  eventToForm,
  laneFromForm,
  laneToForm,
  sourceFromForm,
  sourceToForm,
} from '../src/editor/model';
import { EraSchema, EventSchema, LaneSchema, SourceSchema } from '../src/lib/schema';
import { validateContent } from '../src/lib/validate';

const { bundle } = validateContent(await readContent(), loadQuran().counts);

describe('editor forms round-trip the content unchanged', () => {
  it('has content to check', () => {
    expect(bundle.events.length).toBeGreaterThan(0);
  });

  it.each(bundle.events.map((e) => [e.id, e] as const))('event %s', (_id, e) => {
    expect(EventSchema.parse(eventFromForm(eventToForm(e)))).toEqual(e);
  });

  it.each(bundle.lanes.map((l) => [l.id, l] as const))('lane %s', (_id, l) => {
    expect(LaneSchema.parse(laneFromForm(laneToForm(l)))).toEqual(l);
  });

  it.each(bundle.eras.map((x) => [x.id, x] as const))('era %s', (_id, x) => {
    expect(EraSchema.parse(eraFromForm(eraToForm(x)))).toEqual(x);
  });

  it.each(bundle.sources.map((s) => [s.id, s] as const))('source %s', (_id, s) => {
    expect(SourceSchema.parse(sourceFromForm(sourceToForm(s)))).toEqual(s);
  });
});
