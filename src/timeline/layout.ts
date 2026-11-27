/**
 * Timeline layout: positions each event in its lane and stacks overlapping items
 * into sub-rows. Pure functions, so they can be unit-tested.
 */
import type { CqrEvent, Lane } from '../lib/schema';
import { yearEnd, yearStart } from '../lib/years';

export const ROW_H = 28;
export const LANE_PAD = 6;
export const MIN_LANE_H = 48;
/** Events narrower than this many pixels are drawn as dots. */
export const DOT_MIN_PX = 10;
const CHAR_W = 6.4;
const LABEL_GAP = 5;
const ROW_GAP = 8;

export interface LaidItem {
  event: CqrEvent;
  x0: number;
  x1: number;
  /** Center, used for dots and link endpoints. */
  cx: number;
  row: number;
  dot: boolean;
  labelInside: boolean;
}

export interface LaidLane {
  lane: Lane;
  y: number;
  height: number;
  rows: number;
  /** Extra space at the top of the lane, for a name drawn inside it (on a phone). */
  head: number;
  items: LaidItem[];
}

export function labelWidth(text: string): number {
  return text.length * CHAR_W;
}

/** Stacks items greedily: each goes in the first row where it does not overlap. */
export function stack(items: { start: number; end: number }[]): number[] {
  const order = items.map((_, i) => i).sort((a, b) => items[a].start - items[b].start);
  const rowEnds: number[] = [];
  const rows = new Array<number>(items.length);
  for (const i of order) {
    let r = rowEnds.findIndex((end) => end + ROW_GAP <= items[i].start);
    if (r < 0) {
      r = rowEnds.length;
      rowEnds.push(items[i].end);
    } else rowEnds[r] = items[i].end;
    rows[i] = r;
  }
  return rows;
}

/**
 * `label` gives the text drawn beside each item (its title in the reader's language), for measuring.
 * `head` is extra space at the top of each lane, for its name when it is drawn inside the lane.
 */
export function layoutLanes(
  lanes: Lane[],
  events: CqrEvent[],
  x: (pos: number) => number,
  label: (e: CqrEvent) => string = (e) => e.title.en,
  head = 0,
) {
  const byLane = new Map<string, CqrEvent[]>();
  for (const e of events) byLane.set(e.lane, [...(byLane.get(e.lane) ?? []), e]);

  let y = 0;
  const out: LaidLane[] = [];
  for (const lane of lanes) {
    const evs = byLane.get(lane.id) ?? [];
    const pre = evs.map((event) => {
      const x0 = x(yearStart(event.when.from));
      const x1 = x(yearEnd(event.when.to));
      const w = x1 - x0;
      const dot = event.kind === 'event' && w < DOT_MIN_PX;
      const cx = (x0 + x1) / 2;
      const lw = labelWidth(label(event));
      const labelInside = !dot && event.kind === 'period' && w - 10 >= lw;
      const start = dot ? cx - 6 : x0;
      const markEnd = dot ? cx + 6 : x1;
      const end = labelInside ? x1 : markEnd + LABEL_GAP + lw;
      return { event, x0, x1, cx, dot, labelInside, start, end };
    });
    const rows = stack(pre);
    const items: LaidItem[] = pre.map((p, i) => ({
      event: p.event,
      x0: p.x0,
      x1: p.x1,
      cx: p.cx,
      dot: p.dot,
      labelInside: p.labelInside,
      row: rows[i],
    }));
    const nRows = Math.max(1, ...rows.map((r) => r + 1));
    const height = Math.max(head ? 0 : MIN_LANE_H, nRows * ROW_H + LANE_PAD * 2 + head);
    out.push({ lane, y, height, rows: nRows, items, head });
    y += height;
  }
  return { lanes: out, height: y };
}

/** Vertical center of an item's row. */
export function rowCenter(lane: LaidLane, row: number): number {
  return lane.y + lane.head + LANE_PAD + row * ROW_H + ROW_H / 2;
}
