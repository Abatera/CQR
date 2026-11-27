/**
 * "Around this time": the other events that overlap an event, then the nearest ones before
 * and after it. Pure functions, so they can be unit-tested.
 */
import type { CqrEvent } from './schema';
import { toAstro } from './years';

export interface Nearby {
  event: CqrEvent;
  /** Years from the selected event to this one: 0 if they overlap, negative if this one is earlier. */
  offset: number;
}

/** Years between two inclusive ranges: 0 if they overlap; negative if b is earlier than a. */
export function gapYears(a: CqrEvent, b: CqrEvent): number {
  const aFrom = toAstro(a.when.from);
  const aTo = toAstro(a.when.to);
  const bFrom = toAstro(b.when.from);
  const bTo = toAstro(b.when.to);
  if (bFrom > aTo) return bFrom - aTo;
  if (bTo < aFrom) return -(aFrom - bTo);
  return 0;
}

/**
 * Up to `max` events around `sel`: overlapping ones first (by start), then the nearest within
 * `within` years. Events in `exclude` (e.g. those already listed as related) are left out.
 */
export function aroundThisTime(sel: CqrEvent, events: CqrEvent[], exclude: Set<string> = new Set(), max = 5, within = 1000): Nearby[] {
  const out: Nearby[] = [];
  for (const e of events) {
    if (e.id === sel.id || exclude.has(e.id)) continue;
    const offset = gapYears(sel, e);
    if (Math.abs(offset) <= within) out.push({ event: e, offset });
  }
  out.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset) || a.event.when.from - b.event.when.from);
  return out.slice(0, max);
}
