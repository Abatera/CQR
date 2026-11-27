<script lang="ts">
  import { untrack } from 'svelte';
  import { DEFAULT_VIEW, MAX_SPAN, MIN_SPAN } from '../config';
  import { shortName } from '../lib/format';
  import { certaintyText, countText, emptyLanesText, pick, relationText, t as ui, tx } from '../lib/i18n';
  import type { CqrEvent, Lane } from '../lib/schema';
  import { axisTicks, formatRange, formatYear, fromAstro, yearEnd, yearStart } from '../lib/years';
  import { app } from '../state/app.svelte';
  import Icon from '../ui/Icon.svelte';
  import { DOT_MIN_PX, layoutLanes, rowCenter, type LaidItem, type LaidLane } from './layout';

  const AXIS_H = 26;
  const TOP_PAD = 4;

  let width = $state(900);
  let lanesMenuOpen = $state(false);
  let showEmpty = $state(false);

  const lang = $derived(app.lang);
  const narrow = $derived(app.narrow);
  /** Lane names sit in a gutter on wide screens, and inside the lanes on a phone. */
  const gutter = $derived(narrow ? 0 : 164);
  const view = $derived(app.timeView);
  /** Titles; zoomed far out or on a phone, the short form ("Noah" for "Nuh (Noah)"), so lanes stack less. */
  const label = $derived.by(() => {
    const short = narrow || app.timeView.end - app.timeView.start > 2500;
    return (e: CqrEvent) => {
      const p = pick(e.title, lang);
      return short && e.lane === 'prophets' ? { ...p, text: shortName(e.title, lang) } : p;
    };
  });

  const plotW = $derived(Math.max(120, width - gutter - 8));
  const span = $derived(view.end - view.start);
  const x = $derived((pos: number) => gutter + ((pos - view.start) / span) * plotW);
  const posAt = (px: number) => view.start + ((px - gutter) / plotW) * span;

  const ticks = $derived(axisTicks(view.start, view.end, plotW, narrow ? 64 : 90));
  const eras = $derived(app.content?.eras ?? []);
  const allEvents = $derived(app.content?.events ?? []);

  const inView = (e: CqrEvent) => yearEnd(e.when.to) >= view.start && yearStart(e.when.from) <= view.end;
  /** Events laid out: those in view plus a margin, so rows do not jump at every step of a pan. */
  const laidEvents = $derived.by(() => {
    const m = span * 0.25;
    return allEvents.filter((e) => yearEnd(e.when.to) >= view.start - m && yearStart(e.when.from) <= view.end + m);
  });

  const lanesWithView = $derived(new Set(allEvents.filter(inView).map((e) => e.lane)));
  const shownLanes = $derived(app.visibleLanes.filter((l) => l.pinned || showEmpty || lanesWithView.has(l.id)));
  const foldedLanes = $derived(app.visibleLanes.filter((l) => !shownLanes.includes(l)));

  const layout = $derived(layoutLanes(shownLanes, laidEvents, x, (e) => label(e).text, narrow ? 16 : 0));
  const lanesH = $derived(Math.max(layout.height, 40) + TOP_PAD);

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
      const x1 = from.item.dot ? from.item.cx : Math.min(Math.max(from.item.cx, gutter), width);
      const y1 = rowCenter(from.lane, from.item.row) + TOP_PAD;
      const x2 = to.item.dot ? to.item.cx : Math.min(Math.max(to.item.cx, gutter), width);
      const y2 = rowCenter(to.lane, to.item.row) + TOP_PAD;
      const dy = Math.max(30, Math.abs(y2 - y1) / 2);
      const d =
        y1 === y2
          ? `M${x1},${y1} C${x1},${y1 - dy} ${x2},${y2 - dy} ${x2},${y2}`
          : `M${x1},${y1} C${x1},${y1 + Math.sign(y2 - y1) * dy} ${x2},${y2 - Math.sign(y2 - y1) * dy} ${x2},${y2}`;
      out.push({ d, type: r.type, mx: (x1 + x2) / 2, my: y1 === y2 ? y1 - dy * 0.75 : (y1 + y2) / 2, key: r.id });
    }
    return out;
  });

  /** The selected event's span across all lanes: a band, or a line for a single moment. */
  const band = $derived.by(() => {
    const sel = app.selected;
    if (!sel) return null;
    const x0 = x(yearStart(sel.when.from));
    const x1 = x(yearEnd(sel.when.to));
    if (x1 < gutter || x0 > width) return null;
    const c0 = Math.max(x0, gutter);
    const c1 = Math.min(x1, width);
    return { x0: c0, x1: c1, line: x1 - x0 < 6, cx: (x0 + x1) / 2 };
  });

  const colors = $derived([...new Set((app.content?.lanes ?? []).map((l) => l.color ?? '#666666'))]);
  const cid = (c: string) => c.replace('#', '');

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
    app.timeView = { start, end: start + s };
  }

  function zoom(factor: number, aroundPx = gutter + plotW / 2) {
    const p = posAt(aroundPx);
    setView(p - (p - view.start) * factor, p + (view.end - p) * factor);
  }

  function showAll() {
    setView(yearStart(DEFAULT_VIEW.from), yearEnd(DEFAULT_VIEW.to));
  }

  // Bring the selected event into view. From outside the timeline (a link, search, the map, a journey),
  // zoom to a window around it; from the timeline itself or the arrow keys, only scroll if it is out of view.
  $effect(() => {
    const sel = app.selected;
    if (!sel) return;
    untrack(() => {
      const s = yearStart(sel.when.from);
      const e = yearEnd(sel.when.to);
      const source = app.selectSource;
      app.selectSource = 'other';
      if (source === 'other') {
        const want = Math.min(4000, Math.max(1500, (e - s) * 3));
        const c = (s + e) / 2;
        setView(c - want / 2, c + want / 2);
        return;
      }
      if (s >= view.start && e <= view.end) return;
      const len = e - s;
      if (len > span * 0.9) setView(s - len * 0.1, e + len * 0.1);
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
      if (px < gutter) return;
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
  let suppressClick = false;

  function pointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return;
    const rect = (ev.currentTarget as Element).getBoundingClientRect();
    if (ev.clientX - rect.left < gutter) return;
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

  function choose(e: CqrEvent) {
    if (suppressClick) return;
    app.selectSource = 'timeline';
    app.select(app.selectedId === e.id ? undefined : e.id);
  }

  function keyChoose(ev: KeyboardEvent, e: CqrEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      app.selectSource = 'timeline';
      app.select(e.id);
    }
  }

  function color(laneId: string) {
    return app.lanesById.get(laneId)?.color ?? '#666666';
  }

  /** How a bar is painted, by how sure its date is (the legend uses the same rules). */
  function barStyle(c: string, certainty: string) {
    switch (certainty) {
      case 'established':
        return { fill: c, fillOpacity: 0.85, stroke: 'none', dash: undefined, light: true };
      case 'estimated':
        return { fill: `url(#est-${cid(c)})`, fillOpacity: 1, stroke: 'none', dash: undefined, light: false };
      case 'reckoned':
        return { fill: `url(#hatch-${cid(c)})`, fillOpacity: 1, stroke: c, dash: undefined, light: false };
      case 'traditional':
        return { fill: c, fillOpacity: 0.14, stroke: c, dash: '5 3', light: false };
      case 'debated':
        return { fill: c, fillOpacity: 0.1, stroke: c, dash: '1.5 2.5', light: false };
      default:
        return { fill: c, fillOpacity: 0.05, stroke: c, dash: '1 3', light: false };
    }
  }

  const rangeLabel = $derived(formatRange(fromAstro(Math.round(view.start)), fromAstro(Math.round(view.end) - 1), lang));
  const foldedNames = $derived(foldedLanes.map((l) => tx(l.name, lang)).join(lang === 'ar' ? '، ' : ', '));

  function laneName(l: Lane) {
    return pick(l.name, lang);
  }
</script>

<section class="timeline" aria-label="Timeline" {lang}>
  <div class="toolbar" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <bdi class="range" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{rangeLabel}</bdi>
    <div class="group" role="group" aria-label={ui('zoomIn', lang)}>
      <button type="button" class="icon-btn" onclick={() => zoom(1.6)} aria-label={ui('zoomOut', lang)} title={ui('zoomOut', lang)}><Icon name="minus" size={16} stroke={2} /></button>
      <button type="button" class="icon-btn" onclick={() => zoom(1 / 1.6)} aria-label={ui('zoomIn', lang)} title={ui('zoomIn', lang)}><Icon name="plus" size={16} stroke={2} /></button>
      {#if narrow}
        <button type="button" class="icon-btn" onclick={showAll} aria-label={ui('fitAllTitle', lang)} title={ui('fitAllTitle', lang)}><Icon name="expand" size={16} /></button>
      {:else}
        <button type="button" onclick={showAll} title={ui('fitAllTitle', lang)}>{ui('fitAll', lang)}</button>
      {/if}
    </div>

    {#if !narrow}
      <div class="legend" aria-label={ui('howSure', lang)}>
        <span class="legend-title">{ui('howSure', lang)}</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect x="0.5" y="0.5" width="25" height="9" rx="3" fill="#7a5c2e" fill-opacity="0.85" /></svg>{ui('legendDocumented', lang)}</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect x="0.5" y="0.5" width="25" height="9" rx="3" fill="url(#est-7a5c2e)" /></svg>{ui('legendEstimated', lang)}</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect x="0.75" y="0.75" width="24.5" height="8.5" rx="3" fill="#7a5c2e" fill-opacity="0.14" stroke="#7a5c2e" stroke-width="1.5" stroke-dasharray="5 3" /></svg>{ui('legendTraditional', lang)}</span>
        <span title={ui('legendReckonedTitle', lang)}><svg width="26" height="10" aria-hidden="true"><rect x="0.5" y="0.5" width="25" height="9" rx="3" fill="url(#hatch-7a5c2e)" stroke="#7a5c2e" stroke-opacity="0.6" /></svg>{ui('legendReckoned', lang)}</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect x="0.75" y="0.75" width="24.5" height="8.5" rx="3" fill="none" stroke="#7a5c2e" stroke-width="1.5" stroke-dasharray="1.5 2.5" /></svg>{ui('legendDebatedUnknown', lang)}</span>
      </div>
    {/if}

    <div class="lanes-menu">
      <button type="button" class="lanes-btn" class:icon-btn={narrow} aria-expanded={lanesMenuOpen} aria-label={ui('lanes', lang)} onclick={() => (lanesMenuOpen = !lanesMenuOpen)}>
        <Icon name="layers" size={16} />{#if !narrow}{ui('lanes', lang)}{/if}
      </button>
      {#if lanesMenuOpen}
        <div class="menu" role="group" aria-label={ui('lanes', lang)}>
          {#each app.lanes as lane (lane.id)}
            <label>
              <input type="checkbox" checked={lane.pinned || !app.hiddenLanes.includes(lane.id)} disabled={lane.pinned} onchange={() => app.toggleLane(lane.id)} />
              <span class="swatch" style:background={lane.color ?? '#666'}></span>
              <span lang={laneName(lane).lang}>{laneName(lane).text}{lane.pinned ? ui('pinned', lang) : ''}</span>
            </label>
          {/each}
          <label class="fold">
            <input type="checkbox" checked={!showEmpty} onchange={() => (showEmpty = !showEmpty)} />
            <span>{ui('hideEmpty', lang)}</span>
          </label>
        </div>
      {/if}
    </div>
  </div>

  <div class="body" bind:clientWidth={width} use:wheel>
    <svg class="axis" {width} height={AXIS_H} role="presentation">
      {#each eras as era (era.id)}
        {@const x0 = Math.max(gutter, x(yearStart(era.from)))}
        {@const x1 = Math.min(width, x(yearEnd(era.to)))}
        {#if x1 > x0}
          <rect x={x0} y={AXIS_H - 5} width={x1 - x0} height="5" fill={era.color ?? '#b9ad94'} fill-opacity="0.35">
            <title>{tx(era.name, lang)}: {formatRange(era.from, era.to, lang)}{era.region ? ` (${tx(era.region, lang)})` : ''}</title>
          </rect>
        {/if}
      {/each}
      {#each ticks as t (t.year)}
        {#if x(t.pos) >= gutter}
          <text
            x={x(t.pos)}
            y={AXIS_H - 10}
            class="tick-label"
            direction={lang === 'ar' ? 'rtl' : 'ltr'}
            text-anchor={x(t.pos) < gutter + 30 ? (lang === 'ar' ? 'end' : 'start') : 'middle'}>{formatYear(t.year, lang)}</text
          >
        {/if}
      {/each}
      {#if band}
        <rect x={band.line ? band.cx - 1 : band.x0} y="0" width={band.line ? 2 : Math.max(2, band.x1 - band.x0)} height={AXIS_H} class="band-axis" />
      {/if}
      <line x1={gutter} x2={width} y1={AXIS_H - 0.5} y2={AXIS_H - 0.5} class="axis-line" />
    </svg>

    <div class="scroll">
      <svg
        class="lanes"
        {width}
        height={lanesH}
        role="presentation"
        onpointerdown={pointerDown}
        onpointermove={pointerMove}
        onpointerup={pointerUp}
        onpointercancel={pointerUp}
      >
        <defs>
          <clipPath id="tl-plot"><rect x={gutter} y="0" width={plotW + 8} height={lanesH} /></clipPath>
          {#each colors as c (c)}
            <pattern id="hatch-{cid(c)}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill={c} fill-opacity="0.09" />
              <line x1="0" y1="0" x2="0" y2="7" stroke={c} stroke-width="3" stroke-opacity="0.32" />
            </pattern>
            <linearGradient id="est-{cid(c)}" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stop-color={c} stop-opacity="0.18" />
              <stop offset="0.22" stop-color={c} stop-opacity="0.8" />
              <stop offset="0.78" stop-color={c} stop-opacity="0.8" />
              <stop offset="1" stop-color={c} stop-opacity="0.18" />
            </linearGradient>
          {/each}
        </defs>

        <g clip-path="url(#tl-plot)">
          {#each eras as era (era.id)}
            <rect
              x={x(yearStart(era.from))}
              y="0"
              width={Math.max(0, x(yearEnd(era.to)) - x(yearStart(era.from)))}
              height={lanesH}
              fill={era.color ?? '#b9ad94'}
              opacity="0.07"
            />
          {/each}
          {#each ticks as t (t.year)}
            <line x1={x(t.pos)} x2={x(t.pos)} y1="0" y2={lanesH} class="grid" />
          {/each}
          {#if band}
            {#if band.line}
              <line x1={band.cx} x2={band.cx} y1="0" y2={lanesH} class="band-line" />
            {:else}
              <rect x={band.x0} y="0" width={Math.max(2, band.x1 - band.x0)} height={lanesH} class="band" />
            {/if}
          {/if}
        </g>

        {#each layout.lanes as l (l.lane.id)}
          <line x1="0" x2={width} y1={l.y + l.height + TOP_PAD} y2={l.y + l.height + TOP_PAD} class="lane-sep" />
        {/each}

        <g clip-path="url(#tl-plot)">
          {#each layout.lanes as l (l.lane.id)}
            {#each l.items as it (it.event.id)}
              {@const ev = it.event}
              {@const cy = rowCenter(l, it.row) + TOP_PAD}
              {@const c = color(ev.lane)}
              {@const sel = app.selectedId === ev.id}
              {@const vis0 = Math.max(it.x0, gutter)}
              <g
                class="item"
                class:selected={sel}
                role="button"
                tabindex="0"
                aria-label="{label(ev).text}, {formatRange(ev.when.from, ev.when.to, lang)}, {certaintyText(ev.when.certainty, lang)}"
                aria-pressed={sel}
                onclick={() => choose(ev)}
                onkeydown={(e) => keyChoose(e, ev)}
              >
                <title>{label(ev).text} · {formatRange(ev.when.from, ev.when.to, lang)} ({certaintyText(ev.when.certainty, lang)})</title>
                {#if it.dot}
                  {#if sel}
                    <circle cx={it.cx} cy={cy} r="12" fill="var(--paper)" stroke={c} stroke-width="2" />
                  {/if}
                  <circle cx={it.cx} cy={cy} r={sel ? 8 : 6} fill={c} stroke="#fff" stroke-width="1.5" />
                  <text x={it.cx + (sel ? 17 : 11)} y={cy + 4} class="label" lang={label(ev).lang}>{label(ev).text}</text>
                {:else}
                  {@const h = ev.kind === 'period' ? 18 : 12}
                  {@const st = barStyle(c, ev.when.certainty)}
                  {@const w = Math.max(it.x1 - it.x0, DOT_MIN_PX)}
                  <rect
                    x={it.x0}
                    y={cy - h / 2}
                    width={w}
                    height={h}
                    rx="5"
                    fill={st.fill}
                    fill-opacity={st.fillOpacity}
                    stroke={sel ? 'var(--ink)' : st.stroke}
                    stroke-opacity={sel ? 1 : 0.7}
                    stroke-width={sel ? 2 : 1.3}
                    stroke-dasharray={sel ? undefined : st.dash}
                  />
                  {#if ev.when.core}
                    {@const k0 = x(yearStart(ev.when.core.from))}
                    {@const k1 = x(yearEnd(ev.when.core.to))}
                    <rect x={k0} y={cy - h / 2 + 4} width={Math.max(k1 - k0, 2)} height={h - 8} rx="2" fill={c} fill-opacity="0.85" pointer-events="none">
                      <title>{tx(ev.when.core.basis, lang)}</title>
                    </rect>
                  {/if}
                  {#if it.labelInside}
                    <text x={vis0 + 7} y={cy + 4} class="label inside" class:on-dark={st.light} lang={label(ev).lang}>{label(ev).text}</text>
                  {:else}
                    <text x={Math.max(it.x1, gutter) + 6} y={cy + 4} class="label" lang={label(ev).lang}>{label(ev).text}</text>
                  {/if}
                {/if}
              </g>
            {/each}
          {/each}

          {#each links as lk (lk.key)}
            <path d={lk.d} class="link {lk.type}" />
            <text x={lk.mx} y={lk.my} class="link-label">{relationText(lk.type, lang)}</text>
          {/each}
        </g>

        {#each layout.lanes as l (l.lane.id)}
          {@const n = laneName(l.lane)}
          {#if narrow}
            <text x="8" y={l.y + TOP_PAD + 12} class="lane-tag" fill={l.lane.color ?? '#666'} lang={n.lang}>{n.text}</text>
          {:else}
            <g class="lane-label">
              <rect x="0" y={l.y + TOP_PAD} width={gutter - 2} height={l.height} />
              <circle cx="22" cy={l.y + TOP_PAD + 20} r="5" fill={l.lane.color ?? '#666'} />
              {#if lang === 'ar' && l.lane.name.ar}
                <text x="34" y={l.y + TOP_PAD + 25} class="name ar" lang="ar">{l.lane.name.ar}</text>
                <text x="34" y={l.y + TOP_PAD + 40} class="sub">{l.lane.name.en}</text>
              {:else}
                <text x="34" y={l.y + TOP_PAD + 24} class="name">{l.lane.name.en}</text>
                {#if l.lane.name.ar}<text x="34" y={l.y + TOP_PAD + 40} class="sub ar" lang="ar">{l.lane.name.ar}</text>{/if}
              {/if}
            </g>
          {/if}
        {/each}
      </svg>

      {#if foldedLanes.length}
        <div class="folded" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <span class="dots" aria-hidden="true">{#each foldedLanes as l (l.id)}<span style:background={l.color ?? '#666'}></span>{/each}</span>
          <span class="count">{countText(foldedLanes.length, 'lane', lang)}</span>
          <span class="what">{emptyLanesText(foldedNames, formatYear(fromAstro(Math.round(view.start)), lang), formatYear(fromAstro(Math.round(view.end) - 1), lang), lang)}</span>
          <button type="button" class="small" onclick={() => (showEmpty = true)}>{ui('showThem', lang)}</button>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--paper);
  }
  .toolbar {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 16px;
    flex-wrap: wrap;
  }
  .range {
    font-family: var(--font-read);
    font-size: 17px;
    font-weight: 600;
    min-width: 150px;
  }
  @media (max-width: 760px) {
    .toolbar {
      padding: 6px 12px;
      gap: 6px;
      flex-wrap: nowrap;
    }
    .range {
      font-size: 15px;
      min-width: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .group {
    display: flex;
    gap: 4px;
  }
  .group button:not(.icon-btn) {
    height: 34px;
  }
  .legend {
    display: flex;
    gap: 14px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
    color: #4a5551;
    margin-inline-start: 10px;
  }
  .legend span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .legend-title {
    font-weight: 600;
    color: var(--ink);
  }
  .lanes-menu {
    position: relative;
    margin-inline-start: auto;
  }
  .lanes-btn {
    height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .menu {
    position: absolute;
    z-index: 1000;
    top: calc(100% + 4px);
    inset-inline-end: 0;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgb(30 25 10 / 0.14);
    padding: 8px 12px;
    min-width: 240px;
  }
  .menu label {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 4px 0;
    white-space: nowrap;
  }
  .menu .fold {
    border-top: 1px solid var(--line-soft);
    margin-top: 4px;
    padding-top: 8px;
    color: var(--ink-2);
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
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
  .lanes:active {
    cursor: grabbing;
  }
  .axis-line {
    stroke: var(--line);
  }
  .tick-label {
    font-size: 11px;
    fill: var(--muted);
  }
  .grid {
    stroke: #000;
    stroke-opacity: 0.045;
  }
  .band {
    fill: var(--accent);
    fill-opacity: 0.07;
  }
  .band-line {
    stroke: var(--accent);
    stroke-opacity: 0.45;
    stroke-width: 1.5;
  }
  .band-axis {
    fill: var(--accent);
    fill-opacity: 0.25;
  }
  .lane-sep {
    stroke: var(--line-soft);
  }
  .lane-label rect {
    fill: var(--paper);
  }
  .lane-label .name {
    font-size: 13px;
    font-weight: 600;
    fill: var(--ink);
  }
  .lane-label .name.ar {
    font-family: var(--font-ar);
    font-size: 15px;
  }
  .lane-label .sub {
    font-size: 11.5px;
    fill: var(--muted);
  }
  .lane-label .sub.ar {
    font-family: var(--font-ar);
    font-size: 12.5px;
  }
  .lane-tag {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    pointer-events: none;
  }
  .lane-tag:lang(ar) {
    font-family: var(--font-ar);
    font-size: 12px;
    letter-spacing: 0;
  }
  .label:lang(ar) {
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
    fill: #2a2f2c;
    pointer-events: none;
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 3px;
    stroke-linejoin: round;
  }
  .label.inside {
    fill: #2a2f2c;
    stroke: rgb(252 251 248 / 0.85);
  }
  .label.inside.on-dark {
    fill: #fff;
    stroke: none;
  }
  .item.selected .label {
    font-weight: 700;
    fill: var(--ink);
  }
  .item.selected .label.inside.on-dark {
    fill: #fff;
  }
  .link {
    fill: none;
    stroke: var(--ink);
    stroke-opacity: 0.4;
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
    fill: var(--muted);
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 3px;
    pointer-events: none;
  }
  .folded {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 16px 10px;
    font-size: 12px;
    color: var(--muted);
  }
  .folded .dots {
    display: inline-flex;
    gap: 3px;
  }
  .folded .dots span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .folded .count {
    color: var(--ink-2);
    font-weight: 600;
  }
  .folded .what {
    flex: 1 1 260px;
  }
  .timeline:lang(ar) .folded {
    font-size: 13px;
  }
</style>
