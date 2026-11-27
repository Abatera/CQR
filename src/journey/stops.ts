/** Where each step of a journey is on the map, and how steps at the same place are grouped. */
import { tx, type Lang } from '../lib/i18n';
import type { CqrEvent, Journey } from '../lib/schema';
import { representativePoint } from '../map/basemap';

export interface Stop {
  /** Indexes of the steps at this place, in order. */
  steps: number[];
  point: [number, number];
  /** A short place name for the map label. */
  name: string;
}

/** The step's main point: its place's geometry, or the first opinion that has one. */
export function stepPoint(e: CqrEvent | undefined): [number, number] | null {
  if (!e || e.place.status === 'unknown') return null;
  if (e.place.geometry) return representativePoint(e.place.geometry);
  const op = e.place.opinions?.find((o) => o.geometry);
  return op?.geometry ? representativePoint(op.geometry) : null;
}

/** A short name for a step's place: the first place name, or the first opinion up to its source. */
export function placeName(e: CqrEvent | undefined, lang: Lang): string {
  if (!e) return '';
  const n = e.place.names?.[0]?.name;
  if (n) return n;
  const op = e.place.opinions?.find((o) => o.geometry) ?? e.place.opinions?.[0];
  return op ? tx(op.name, lang).split(/[,،(]/)[0].trim() : '';
}

export function journeyStops(j: Journey, byId: Map<string, CqrEvent>, lang: Lang): Stop[] {
  const stops: Stop[] = [];
  j.steps.forEach((s, i) => {
    const e = byId.get(s.event);
    const p = stepPoint(e);
    if (!p) return;
    const same = stops.find((x) => Math.abs(x.point[0] - p[0]) < 0.05 && Math.abs(x.point[1] - p[1]) < 0.05);
    if (same) same.steps.push(i);
    else stops.push({ steps: [i], point: p, name: placeName(e, lang) });
  });
  return stops;
}
