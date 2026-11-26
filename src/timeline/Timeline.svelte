<script lang="ts">
  import { untrack } from 'svelte';
  import { DEFAULT_VIEW, MAX_SPAN, MIN_SPAN } from '../config';
  import { certaintyText, pick, relationText, t as ui, tx } from '../lib/i18n';
  import type { CqrEvent } from '../lib/schema';
  import { axisTicks, formatRange, formatYear, yearEnd, yearStart } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { DOT_MIN_PX, layoutLanes, rowCenter, type LaidItem, type LaidLane } from './layout';

  const GUTTER = 136;
  const AXIS_H = 24;
  const ERA_H = 18;

  let width = $state(900);
  let view = $state({ start: yearStart(DEFAULT_VIEW.from), end: yearEnd(DEFAULT_VIEW.to) });
  let lanesMenuOpen = $state(false);
  const lang = $derived(app.lang);
  /** An event's label in the reader's language; English where the Arabic is missing. */
  const label = $derived((e: CqrEvent) => pick(e.title, lang));

  const plotW = $derived(Math.max(120, width - GUTTER - 6));
  const span = $derived(view.end - view.start);
  const x = $derived((pos: number) => GUTTER + ((pos - view.start) / span) * plotW);
  const posAt = (px: number) => view.start + ((px - GUTTER) / plotW) * span;

  const ticks = $derived(axisTicks(view.start, view.end, plotW));
  const layout = $derived(layoutLanes(app.visibleLanes, app.content?.events ?? [], x, (e) => label(e).text));
  const eras = $derived(app.content?.eras ?? []);

  const itemsById = $derived.by(() => {
    const m = new Map<string, { item: LaidItem; lane: LaidLane }>();
    for (const lane of layout.lanes) for (const item of lane.items) m.set(item.event.id, { item, lane });
    return m;
  });

  const links = $derived.by(() => {
    const sel = app.selected;
    if (!sel?.related?.length) return [];
    const from = itemsById.get(sel.id);
    if (!from) return [];
    const out: { d: string; type: string; mx: number; my: number; key: string }[] = [];
    for (const r of sel.related) {
      const to = itemsById.get(r.id);
      if (!to) continue;
      const x1 = from.item.dot ? from.item.cx : Math.min(Math.max(from.item.cx, GUTTER), width);
      const y1 = rowCenter(from.lane, from.item.row);
      const x2 = to.item.dot ? to.item.cx : Math.min(Math.max(to.item.cx, GUTTER), width);
      const y2 = rowCenter(to.lane, to.item.row);
      const dy = Math.max(30, Math.abs(y2 - y1) / 2);
      const d = y1 === y2
        ? `M${x1},${y1} C${x1},${y1 - dy} ${x2},${y2 - dy} ${x2},${y2}`
        : `M${x1},${y1} C${x1},${y1 + Math.sign(y2 - y1) * dy} ${x2},${y2 - Math.sign(y2 - y1) * dy} ${x2},${y2}`;
      out.push({ d, type: r.type, mx: (x1 + x2) / 2, my: y1 === y2 ? y1 - dy * 0.75 : (y1 + y2) / 2, key: r.id });
    }
    return out;
  });

  function setView(start: number, end: number) {
    let s = end - start;
    if (s < MIN_SPAN) {
      const c = (start + end) / 2;
      start = c - MIN_SPAN / 2;
      s = MIN_SPAN;
    }
    if (s > MAX_SPAN) {
      const c = (start + end) / 2;
      start = c - MAX_SPAN / 2;
      s = MAX_SPAN;
    }
    view = { start, end: start + s };
  }

  function zoom(factor: number, aroundPx = GUTTER + plotW / 2) {
    const p = posAt(aroundPx);
    setView(p - (p - view.start) * factor, p + (view.end - p) * factor);
  }

  function fitAll() {
    const evs = app.visibleEvents;
    if (!evs.length) return;
    const s = Math.min(...evs.map((e) => yearStart(e.when.from)));
    const e = Math.max(...evs.map((e) => yearEnd(e.when.to)));
    const pad = Math.max(10, (e - s) * 0.06);
    setView(s - pad, e + pad);
  }

  function reset() {
    setView(yearStart(DEFAULT_VIEW.from), yearEnd(DEFAULT_VIEW.to));
  }

  // Bring the selected event into view when it is selected from elsewhere (map, URL, keys).
  $effect(() => {
    const sel = app.selected;
    if (!sel) return;
    untrack(() => {
      const s = yearStart(sel.when.from);
      const e = yearEnd(sel.when.to);
      if (s >= view.start && e <= view.end) return;
      const len = e - s;
      if (len > span * 0.9) setView(s - len * 0.05, e + len * 0.05);
      else {
        const c = (s + e) / 2;
        setView(c - span / 2, c + span / 2);
      }
    });
  });

  // Wheel zooms (over the plot area), horizontal wheel pans. Needs a non-passive listener.
  function wheel(node: HTMLElement) {
    const onWheel = (ev: WheelEvent) => {
      const rect = node.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      if (px < GUTTER) return; // let the lane gutter scroll vertically
      ev.preventDefault();
      if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        const d = (ev.deltaX / plotW) * span;
        setView(view.start + d, view.end + d);
      } else {
        zoom(Math.exp(ev.deltaY * 0.0015), px);
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return { destroy: () => node.removeEventListener('wheel', onWheel) };
  }

  let drag: { x: number; start: number; end: number; moved: boolean } | null = null;

  function pointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return;
    const target = ev.currentTarget as Element;
    const rect = target.getBoundingClientRect();
    if (ev.clientX - rect.left < GUTTER) return;
    drag = { x: ev.clientX, start: view.start, end: view.end, moved: false };
  }

  function pointerMove(ev: PointerEvent) {
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 4) return;
    if (!drag.moved) (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
    drag.moved = true;
    const d = (-dx / plotW) * (drag.end - drag.start);
    setView(drag.start + d, drag.end + d);
  }

  function pointerUp(ev: PointerEvent) {
    const wasDrag = drag?.moved;
    drag = null;
    if (wasDrag) {
      ev.preventDefault();
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
    }
  }

  let suppressClick = false;

  function choose(e: CqrEvent) {
    if (suppressClick) return;
    app.select(app.selectedId === e.id ? undefined : e.id);
  }

  function keyChoose(ev: KeyboardEvent, e: CqrEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      app.select(e.id);
    }
  }

  const DASH: Record<string, string | undefined> = {
    established: undefined,
    estimated: undefined,
    traditional: '5 3',
    reckoned: '1 2',
    debated: '2 2',
    unknown: '1 3',
  };

  function color(laneId: string) {
    return app.lanesById.get(laneId)?.color ?? '#666';
  }

  const ERA_FILLS = ['#f3efe6', '#e9eef3'];
</script>

<section class="timeline" aria-label="Timeline">
  <div class="toolbar">
    <button type="button" onclick={() => zoom(1 / 1.6)} title={ui('zoomIn', lang)}>+</button>
    <button type="button" onclick={() => zoom(1.6)} title={ui('zoomOut', lang)}>−</button>
    <button type="button" onclick={fitAll} title={ui('fitAllTitle', lang)} {lang}>{ui('fitAll', lang)}</button>
    <button type="button" onclick={reset} title={ui('resetTitle', lang)} {lang}>{ui('reset', lang)}</button>
    <div class="lanes-menu">
      <button type="button" aria-expanded={lanesMenuOpen} onclick={() => (lanesMenuOpen = !lanesMenuOpen)} {lang}>{ui('lanes', lang)} ▾</button>
      {#if lanesMenuOpen}
        <div class="menu" role="menu">
          {#each app.lanes as lane (lane.id)}
            <label>
              <input
                type="checkbox"
                checked={lane.pinned || !app.hiddenLanes.includes(lane.id)}
                disabled={lane.pinned}
                onchange={() => app.toggleLane(lane.id)}
              />
              <span class="swatch" style:background={lane.color ?? '#666'}></span>
              <span lang={pick(lane.name, lang).lang}>{tx(lane.name, lang)}{lane.pinned ? ui('pinned', lang) : ''}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
    <span class="legend" aria-label="Legend" {lang}>
      <svg width="26" height="10"><rect x="1" y="1" width="24" height="8" rx="2" class="lg solid" /></svg> {ui('legendSolid', lang)}
      <svg width="26" height="10"><rect x="1" y="1" width="24" height="8" rx="2" class="lg" stroke-dasharray="5 3" /></svg> {ui('legendTraditional', lang)}
      <svg width="26" height="10"><rect x="1" y="1" width="24" height="8" rx="2" class="lg" stroke-dasharray="2 2" /></svg> {ui('legendDebated', lang)}
      <svg width="26" height="10">
        <defs>
          <pattern id="lg-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#fff" stroke-width="2" />
          </pattern>
        </defs>
        <rect x="1" y="1" width="24" height="8" rx="2" class="lg" stroke-dasharray="1 2" />
        <rect x="1" y="1" width="24" height="8" rx="2" fill="url(#lg-hatch)" />
      </svg>
      <span title={ui('legendReckonedTitle', lang)}>{ui('legendReckoned', lang)}</span>
    </span>
    <span class="hint" {lang}>{ui('timelineHint', lang)}</span>
  </div>

  <div class="body" bind:clientWidth={width} use:wheel>
    <svg class="axis" {width} height={AXIS_H + ERA_H} role="presentation">
      {#each eras as era, i (era.id)}
        {@const x0 = Math.max(GUTTER, x(yearStart(era.from)))}
        {@const x1 = Math.min(width, x(yearEnd(era.to)))}
        {#if x1 > x0}
          <rect x={x0} y={AXIS_H} width={x1 - x0} height={ERA_H} fill={era.color ? era.color + '33' : ERA_FILLS[i % 2]} />
          <svg x={x0} y={AXIS_H} width={x1 - x0} height={ERA_H}>
            <text x="4" y="13" class="era-label" lang={pick(era.name, lang).lang}
              >{tx(era.name, lang)}<title>{tx(era.name, lang)}: {formatRange(era.from, era.to, lang)}{era.region ? ` (${tx(era.region, lang)})` : ''}</title></text
            >
          </svg>
        {/if}
      {/each}
      {#each ticks as t (t.year)}
        {#if x(t.pos) >= GUTTER}
          <line x1={x(t.pos)} x2={x(t.pos)} y1={AXIS_H - 6} y2={AXIS_H} class="tick" />
          <text x={x(t.pos) + 3} y={AXIS_H - 9} class="tick-label">{formatYear(t.year, lang)}</text>
        {/if}
      {/each}
      <line x1={GUTTER} x2={width} y1={AXIS_H} y2={AXIS_H} class="axis-line" />
    </svg>

    <div class="scroll">
      <svg
        class="lanes"
        {width}
        height={Math.max(layout.height, 40)}
        role="presentation"
        onpointerdown={pointerDown}
        onpointermove={pointerMove}
        onpointerup={pointerUp}
        onpointercancel={pointerUp}
      >
        <defs>
          <clipPath id="tl-plot"><rect x={GUTTER} y="0" width={plotW + 6} height={layout.height} /></clipPath>
          <pattern id="tl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-width="2.5" stroke-opacity="0.85" />
          </pattern>
        </defs>

        <g clip-path="url(#tl-plot)">
          {#each eras as era, i (era.id)}
            <rect
              x={x(yearStart(era.from))}
              y="0"
              width={Math.max(0, x(yearEnd(era.to)) - x(yearStart(era.from)))}
              height={layout.height}
              fill={era.color ? era.color + '1a' : ERA_FILLS[i % 2]}
              opacity="0.7"
            />
          {/each}
          {#each ticks as t (t.year)}
            <line x1={x(t.pos)} x2={x(t.pos)} y1="0" y2={layout.height} class="grid" />
          {/each}
        </g>

        {#each layout.lanes as l (l.lane.id)}
          <line x1="0" x2={width} y1={l.y + l.height} y2={l.y + l.height} class="lane-sep" />
        {/each}

        <g clip-path="url(#tl-plot)">
          {#each layout.lanes as l (l.lane.id)}
            {#each l.items as it (it.event.id)}
              {@const ev = it.event}
              {@const cy = rowCenter(l, it.row)}
              {@const c = color(ev.lane)}
              {@const sel = app.selectedId === ev.id}
              {@const vis0 = Math.max(it.x0, GUTTER)}
              <g
                class="item"
                class:selected={sel}
                role="button"
                tabindex="0"
                aria-label="{label(ev).text}, {formatRange(ev.when.from, ev.when.to, lang)}"
                aria-pressed={sel}
                onclick={() => choose(ev)}
                onkeydown={(e) => keyChoose(e, ev)}
              >
                <title>{label(ev).text} · {formatRange(ev.when.from, ev.when.to, lang)} ({certaintyText(ev.when.certainty, lang)})</title>
                {#if it.dot}
                  {#if it.x1 - it.x0 > 2}
                    <line x1={it.x0} x2={it.x1} y1={cy} y2={cy} stroke={c} stroke-width="2" opacity="0.5" />
                  {/if}
                  <circle cx={it.cx} cy={cy} r={sel ? 7 : 5.5} fill={c} stroke={sel ? '#111' : '#fff'} stroke-width={sel ? 2 : 1.5}
                    stroke-dasharray={sel ? undefined : DASH[ev.when.certainty]} />
                  <text x={it.cx + 10} y={cy + 4} class="label" lang={label(ev).lang}>{label(ev).text}</text>
                {:else}
                  {@const h = ev.kind === 'period' ? 16 : 10}
                  <rect
                    x={it.x0}
                    y={cy - h / 2}
                    width={Math.max(it.x1 - it.x0, DOT_MIN_PX)}
                    height={h}
                    rx="3"
                    fill={c}
                    fill-opacity={ev.kind === 'period' ? (ev.when.certainty === 'established' ? 0.32 : 0.2) : 0.6}
                    stroke={sel ? '#111' : c}
                    stroke-width={sel ? 2 : 1.2}
                    stroke-dasharray={DASH[ev.when.certainty]}
                  />
                  {#if ev.when.certainty === 'reckoned'}
                    <rect
                      x={it.x0}
                      y={cy - h / 2}
                      width={Math.max(it.x1 - it.x0, DOT_MIN_PX)}
                      height={h}
                      rx="3"
                      fill="url(#tl-hatch)"
                      pointer-events="none"
                    />
                  {/if}
                  {#if ev.when.core}
                    {@const k0 = x(yearStart(ev.when.core.from))}
                    {@const k1 = x(yearEnd(ev.when.core.to))}
                    <rect
                      x={k0}
                      y={cy - h / 2 + 2}
                      width={Math.max(k1 - k0, 2)}
                      height={h - 4}
                      rx="2"
                      fill={c}
                      fill-opacity="0.75"
                      pointer-events="none"
                    >
                      <title>{tx(ev.when.core.basis, lang)}</title>
                    </rect>
                  {/if}
                  {#if it.labelInside}
                    <text x={vis0 + 5} y={cy + 4} class="label inside" lang={label(ev).lang}>{label(ev).text}</text>
                  {:else}
                    <text x={Math.max(it.x1, GUTTER) + 5} y={cy + 4} class="label" lang={label(ev).lang}>{label(ev).text}</text>
                  {/if}
                {/if}
              </g>
            {/each}
          {/each}

          {#each links as lk (lk.key)}
            <path d={lk.d} class="link {lk.type}" />
            <text x={lk.mx} y={lk.my} class="link-label" {lang}>{lang === 'ar' ? relationText(lk.type, lang) : lk.type}</text>
          {/each}
        </g>

        {#each layout.lanes as l (l.lane.id)}
          <g class="lane-label">
            <rect x="0" y={l.y} width={GUTTER - 4} height={l.height} />
            <rect x="0" y={l.y} width="4" height={l.height} fill={l.lane.color ?? '#666'} />
            {#if lang === 'ar' && l.lane.name.ar}
              <text x={GUTTER - 10} y={l.y + 21} class="ar-main" text-anchor="end" lang="ar">{l.lane.name.ar}</text>
              <text x={GUTTER - 10} y={l.y + 38} class="en-sub" text-anchor="end">{l.lane.name.en}</text>
            {:else}
              <text x="12" y={l.y + 20}>{l.lane.name.en}</text>
              {#if l.lane.name.ar}
                <text x={GUTTER - 10} y={l.y + 38} class="ar" text-anchor="end" lang="ar">{l.lane.name.ar}</text>
              {/if}
            {/if}
          </g>
        {/each}
      </svg>
    </div>
  </div>
</section>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--panel);
  }
  .toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
    flex-wrap: wrap;
  }
  .toolbar button {
    min-width: 30px;
  }
  .legend {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    color: var(--muted);
    margin-inline-start: 10px;
  }
  .legend svg {
    margin-inline-start: 6px;
  }
  .lg {
    fill: #888;
    fill-opacity: 0.25;
    stroke: #666;
  }
  .hint {
    margin-inline-start: auto;
    color: var(--muted);
  }
  .lanes-menu {
    position: relative;
  }
  .menu {
    position: absolute;
    z-index: 1000;
    top: 100%;
    inset-inline-start: 0;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 6px;
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.12);
    padding: 6px 10px;
    min-width: 230px;
  }
  .menu label {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 3px 0;
    white-space: nowrap;
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    display: inline-block;
  }
  .body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    user-select: none;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  svg {
    display: block;
  }
  .lanes {
    cursor: grab;
  }
  .tick {
    stroke: #888;
  }
  .axis-line {
    stroke: #bbb;
  }
  .tick-label {
    font-size: 11px;
    fill: #555;
  }
  .era-label {
    font-size: 11px;
    fill: #6b5f4b;
    font-style: italic;
  }
  .grid {
    stroke: #000;
    stroke-opacity: 0.06;
  }
  .lane-sep {
    stroke: var(--line);
  }
  .lane-label rect:first-child {
    fill: var(--panel);
  }
  .lane-label text {
    font-size: 13px;
    font-weight: 600;
    fill: #333;
  }
  .lane-label text.ar {
    font-family: var(--font-ar);
    font-weight: 400;
    font-size: 13px;
    fill: #777;
  }
  .lane-label text.ar-main {
    font-family: var(--font-ar);
    font-size: 15px;
  }
  .lane-label text.en-sub {
    font-weight: 400;
    font-size: 11px;
    fill: #777;
  }
  .label:lang(ar),
  .era-label:lang(ar) {
    font-family: var(--font-ar);
    font-size: 13px;
  }
  .item {
    cursor: pointer;
    outline: none;
  }
  .item:focus-visible .label {
    text-decoration: underline;
  }
  .label {
    font-size: 12px;
    fill: #222;
    pointer-events: none;
  }
  .label.inside {
    fill: #1d1d1d;
  }
  .item.selected .label {
    font-weight: 700;
  }
  .link {
    fill: none;
    stroke: #333;
    stroke-opacity: 0.45;
    stroke-width: 1.5;
    pointer-events: none;
  }
  .link.consequence {
    stroke: #8a3b12;
  }
  .link.parallel {
    stroke-dasharray: 6 4;
  }
  .link.context {
    stroke-dasharray: 2 3;
  }
  .link-label {
    font-size: 10px;
    fill: #555;
    paint-order: stroke;
    stroke: #fff;
    stroke-width: 3px;
    pointer-events: none;
  }
</style>
