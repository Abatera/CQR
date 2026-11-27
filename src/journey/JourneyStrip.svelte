<script lang="ts">
  /** A journey's steps on their own time scale, with what history records for the same years below. */
  import { axisTicks, formatYear, yearEnd, yearStart } from '../lib/years';
  import { certaintyText, pick, t, tx } from '../lib/i18n';
  import type { CqrEvent, Journey } from '../lib/schema';
  import { app } from '../state/app.svelte';

  let { journey, current, onpick }: { journey: Journey; current: number; onpick: (i: number) => void } = $props();

  let width = $state(800);
  const lang = $derived(app.lang);

  const events = $derived(journey.steps.map((s) => app.eventsById.get(s.event)).filter((e): e is CqrEvent => !!e));
  const ids = $derived(new Set(journey.steps.map((s) => s.event)));
  const span = $derived.by(() => {
    if (!events.length) return { start: 0, end: 1 };
    const s = Math.min(...events.map((e) => yearStart(e.when.from)));
    const e = Math.max(...events.map((e) => yearEnd(e.when.to)));
    const pad = Math.max(2, (e - s) * 0.06);
    return { start: s - pad, end: e + pad };
  });
  const pct = (pos: number) => ((pos - span.start) / (span.end - span.start)) * 100;
  const ticks = $derived(axisTicks(span.start, span.end, Math.max(200, width - 140), 90));

  /** Events outside the journey from the history lanes (not the prophets or the Quran) in the same years. */
  const history = $derived(
    (app.content?.events ?? [])
      .filter((e) => !ids.has(e.id) && e.lane !== 'prophets' && e.lane !== 'quran')
      .filter((e) => yearEnd(e.when.to) >= span.start && yearStart(e.when.from) <= span.end)
      .slice(0, 6),
  );

  /** Steps whose dots would overlap go on a second row. */
  const rows = $derived.by(() => {
    const out: number[] = [];
    const last: number[] = [];
    journey.steps.forEach((s, i) => {
      const e = app.eventsById.get(s.event);
      const p = e ? pct(yearStart(e.when.from)) : 0;
      const px = (p / 100) * Math.max(200, width - 140);
      const r = last.findIndex((x) => px - x > 30);
      const row = r < 0 ? last.length : r;
      last[row] = px;
      out.push(row);
    });
    return out;
  });
  const nRows = $derived(Math.max(1, ...rows.map((r) => r + 1)));
</script>

<section class="strip" aria-label={tx(journey.title, lang)} bind:clientWidth={width} {lang}>
  <div class="grid">
    <div></div>
    <div class="axis" dir="ltr">
      {#each ticks as tk (tk.year)}
        <span style:left="{pct(tk.pos)}%" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{formatYear(tk.year, lang)}</span>
      {/each}
    </div>

    <div class="lane-name"><span class="dot" style:background="#1f6f5c"></span>{t('steps', lang)}</div>
    <div class="track" dir="ltr" style:height="{14 + nRows * 30}px">
      {#each journey.steps as s, i (i)}
        {@const e = app.eventsById.get(s.event)}
        {#if e}
          {@const l = pct(yearStart(e.when.from))}
          {@const r = pct(yearEnd(e.when.to))}
          {#if r - l > 0.8}
            <span class="span" class:on={i === current} style:left="{l}%" style:width="{r - l}%" style:top="{10 + rows[i] * 30 + 11}px"></span>
          {/if}
          <button
            type="button"
            class="step"
            class:current={i === current}
            class:done={i < current}
            style:left="{l}%"
            style:top="{10 + rows[i] * 30}px"
            aria-label="{i + 1}. {pick(e.title, lang).text}"
            aria-current={i === current ? 'step' : undefined}
            title="{pick(e.title, lang).text} · {certaintyText(e.when.certainty, lang)}"
            onclick={() => onpick(i)}>{i + 1}</button
          >
        {/if}
      {/each}
    </div>

    {#if history.length}
      <div class="lane-name"><span class="dot" style:background="#3a6ea5"></span>{t('meanwhile', lang)}</div>
      <div class="track hist" dir="ltr" style:height="{8 + history.length * 22}px">
        {#each history as h, k (h.id)}
          {@const c = app.lanesById.get(h.lane)?.color ?? '#3a6ea5'}
          {@const l = Math.max(0, pct(yearStart(h.when.from)))}
          {@const r = Math.min(100, pct(yearEnd(h.when.to)))}
          <a class="hbar" href="#/event/{h.id}" style:left="{l}%" style:width="{Math.max(0.8, r - l)}%" style:top="{4 + k * 22}px" style:--c={c}>
            <span lang={pick(h.title, lang).lang} dir={pick(h.title, lang).dir}>{pick(h.title, lang).text}</span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .strip {
    background: var(--paper);
    border-top: 1px solid var(--line);
    padding: 10px 20px 12px;
    overflow-x: auto;
  }
  .grid {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    min-width: 640px;
  }
  .axis {
    position: relative;
    height: 18px;
    font-size: 11px;
    color: var(--muted);
  }
  .axis span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .lane-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    font-weight: 600;
    padding-top: 12px;
    align-self: start;
  }
  .lane-name:lang(ar) {
    font-size: 14px;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .track {
    position: relative;
    border-bottom: 1px solid var(--line-soft);
  }
  .span {
    position: absolute;
    height: 6px;
    border-radius: 3px;
    background: rgb(31 111 92 / 0.18);
  }
  .span.on {
    background: rgb(31 111 92 / 0.45);
  }
  .step {
    position: absolute;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #b9b1a2;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 20px;
    box-shadow: 0 0 0 1px #b9b1a2;
  }
  .step:hover {
    background: #8f8676 !important;
  }
  .step.done {
    background: #7fa99a;
    box-shadow: 0 0 0 1px #7fa99a;
  }
  .step.current {
    width: 30px;
    height: 30px;
    margin-top: -3px;
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
  }
  .step.current:hover {
    background: var(--accent-dark) !important;
  }
  .hist {
    margin-top: 6px;
    border-bottom: 0;
  }
  .hbar {
    position: absolute;
    height: 18px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--c) 32%, transparent);
    border-inline-start: 3px solid var(--c);
    text-decoration: none;
    min-width: 8px;
  }
  .hbar span {
    position: absolute;
    left: 7px;
    top: 0;
    line-height: 18px;
    font-size: 12px;
    color: var(--ink);
    font-weight: 600;
    white-space: nowrap;
    text-shadow:
      0 0 3px var(--paper),
      0 0 3px var(--paper);
  }
  .hbar span:lang(ar) {
    font-size: 13px;
  }
</style>
