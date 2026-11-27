<script lang="ts">
  /**
   * The overview strip ("all of time"): the whole sequence of prophets, with the timeline's
   * current window framed on it. Clicking moves the window there; dragging pans it.
   */
  import { OVERVIEW, OVERVIEW_NAMED, OVERVIEW_NAMED_NARROW } from '../config';
  import { shortName } from '../lib/format';
  import { t } from '../lib/i18n';
  import { yearEnd, yearStart } from '../lib/years';
  import { app } from '../state/app.svelte';

  let width = $state(800);
  const lang = $derived(app.lang);
  const start = yearStart(OVERVIEW.from);
  const end = yearEnd(OVERVIEW.to);
  const pct = (pos: number) => ((pos - start) / (end - start)) * 100;

  const prophets = $derived((app.content?.events ?? []).filter((e) => e.lane === 'prophets'));
  const named = $derived((width < 560 ? OVERVIEW_NAMED_NARROW : OVERVIEW_NAMED).map((id) => app.eventsById.get(id)).filter((e) => e !== undefined));
  /** The reckoned years before Abraham, hatched as on the timeline. */
  const reckonedEnd = $derived(
    Math.max(start, ...prophets.filter((e) => e.when.certainty === 'reckoned').map((e) => yearEnd(e.when.to))),
  );

  const win = $derived.by(() => {
    const v = app.timeView;
    const l = Math.max(0, pct(v.start));
    const r = Math.min(100, pct(v.end));
    return { l, w: Math.max(1.2, r - l), clippedLeft: pct(v.start) < 0, clippedRight: pct(v.end) > 100 };
  });

  let track: HTMLDivElement;
  let drag: { x: number; start: number; end: number } | null = null;

  function posFromClient(clientX: number) {
    const rect = track.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return start + f * (end - start);
  }

  function centerAt(pos: number) {
    const span = app.timeView.end - app.timeView.start;
    app.timeView = { start: pos - span / 2, end: pos + span / 2 };
  }

  function down(ev: PointerEvent) {
    if (ev.button !== 0) return;
    const v = app.timeView;
    const p = posFromClient(ev.clientX);
    if (p < v.start || p > v.end) centerAt(p);
    drag = { x: ev.clientX, start: app.timeView.start, end: app.timeView.end };
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
  }

  function move(ev: PointerEvent) {
    if (!drag) return;
    const rect = track.getBoundingClientRect();
    const d = ((ev.clientX - drag.x) / rect.width) * (end - start);
    app.timeView = { start: drag.start + d, end: drag.end + d };
  }

  function up() {
    drag = null;
  }

  function key(ev: KeyboardEvent) {
    const span = app.timeView.end - app.timeView.start;
    const step = span * 0.25;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      ev.stopPropagation();
      const d = ev.key === 'ArrowLeft' ? -step : step;
      app.timeView = { start: app.timeView.start + d, end: app.timeView.end + d };
    }
  }
</script>

<div class="overview" bind:clientWidth={width} {lang}>
  {#if width > 560}<span class="title">{t('allOfTime', lang)}</span>{/if}
  <div
    class="track"
    bind:this={track}
    role="slider"
    tabindex="0"
    aria-label={t('overviewLabel', lang)}
    aria-valuemin={start}
    aria-valuemax={end}
    aria-valuenow={Math.round((app.timeView.start + app.timeView.end) / 2)}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onkeydown={key}
  >
    <div class="rail"></div>
    <div class="reckoned" style:width="{Math.max(0, pct(reckonedEnd))}%"></div>
    {#each prophets as p (p.id)}
      <span class="tick" style:left="{pct(yearStart(p.when.from))}%" title={shortName(p.title, lang)}></span>
    {/each}
    <div class="window" class:cl={win.clippedLeft} class:cr={win.clippedRight} style:left="{win.l}%" style:width="{win.w}%">
      <span class="grip l"></span><span class="grip r"></span>
    </div>
    {#each named as p, i (p.id)}
      {@const left = pct(yearStart(p.when.from))}
      <span
        class="name"
        class:first={i === 0}
        class:last={i === named.length - 1}
        style:left="{left}%"
        lang={lang === 'ar' && p.title.ar ? 'ar' : 'en'}>{shortName(p.title, lang)}</span
      >
    {/each}
  </div>
</div>

<style>
  .overview {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 20px 6px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  .title {
    flex: 0 0 128px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .title:lang(ar) {
    font-size: 13px;
    letter-spacing: 0;
  }
  .track {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 44px;
    cursor: pointer;
    touch-action: none;
    outline-offset: 3px;
    direction: ltr;
  }
  .rail {
    position: absolute;
    inset-inline: 0;
    top: 6px;
    height: 16px;
    border-radius: 6px;
    background: #e9e4da;
  }
  .reckoned {
    position: absolute;
    left: 0;
    top: 6px;
    height: 16px;
    border-radius: 6px 0 0 6px;
    background: repeating-linear-gradient(135deg, rgb(122 92 46 / 0.17) 0 3px, rgb(122 92 46 / 0.05) 3px 7px);
  }
  .tick {
    position: absolute;
    top: 9px;
    width: 3px;
    height: 10px;
    margin-left: -1px;
    border-radius: 2px;
    background: #7a5c2e;
  }
  .window {
    position: absolute;
    top: 1px;
    height: 26px;
    border: 2px solid var(--accent);
    border-radius: 8px;
    background: rgb(31 111 92 / 0.08);
    cursor: grab;
  }
  .window.cl {
    border-left-style: dashed;
  }
  .window.cr {
    border-right-style: dashed;
  }
  .grip {
    position: absolute;
    top: 5px;
    width: 7px;
    height: 12px;
    border-radius: 3px;
    background: var(--accent);
  }
  .grip.l {
    left: -5px;
  }
  .grip.r {
    right: -5px;
  }
  .name {
    position: absolute;
    top: 28px;
    transform: translateX(-50%);
    font-size: 11px;
    color: #4a5551;
    white-space: nowrap;
    pointer-events: none;
  }
  .name:lang(ar) {
    font-size: 12px;
    top: 26px;
  }
  .name.first {
    transform: none;
  }
  .name.last {
    transform: translateX(-100%);
  }
  @media (max-width: 760px) {
    .overview {
      padding: 6px 12px 4px;
    }
    .track {
      height: 40px;
    }
  }
</style>
