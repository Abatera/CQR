<script lang="ts">
  /** A journey as a card: a small picture of its steps in time, its title, summary and length. */
  import { countText, pick } from '../lib/i18n';
  import type { Journey } from '../lib/schema';
  import { yearStart } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { href } from '../state/route';
  import Txt from '../facts/Txt.svelte';

  let { journey }: { journey: Journey } = $props();
  const lang = $derived(app.lang);

  const dots = $derived.by(() => {
    const evs = journey.steps.map((s) => app.eventsById.get(s.event)).filter((e) => e !== undefined);
    if (!evs.length) return [];
    const ys = evs.map((e) => yearStart(e.when.from));
    const a = Math.min(...ys);
    const b = Math.max(...ys);
    return evs.map((e, i) => ({ id: `${i}-${e.id}`, left: b > a ? ((ys[i] - a) / (b - a)) * 100 : 50, color: app.lanesById.get(e.lane)?.color ?? '#1f6f5c' }));
  });
</script>

<a class="card" href={href({ view: 'journey', id: journey.id, step: 1 })} {lang}>
  <span class="picture" aria-hidden="true">
    <span class="rail"></span>
    {#each dots as d (d.id)}<span class="dot" style:left="calc({d.left}% - 6px)" style:background={d.color}></span>{/each}
  </span>
  <span class="title" lang={pick(journey.title, lang).lang}><Txt m={journey.title} /></span>
  <span class="summary"><Txt m={journey.summary} /></span>
  <span class="count">{countText(journey.steps.length, 'step', lang)}</span>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--card);
    color: var(--ink);
    text-decoration: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .card:hover {
    color: var(--ink);
    border-color: #b9b1a2;
    box-shadow: 0 4px 14px rgb(40 30 10 / 0.08);
  }
  .picture {
    position: relative;
    height: 26px;
    margin: 0 6px;
    direction: ltr;
  }
  .rail {
    position: absolute;
    left: 0;
    right: 0;
    top: 12px;
    height: 2px;
    background: #e9e4da;
  }
  .dot {
    position: absolute;
    top: 7px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--card);
    box-sizing: content-box;
    margin-top: -2px;
  }
  .title {
    font-weight: 600;
    font-size: 16px;
  }
  .title:lang(ar) {
    font-size: 18px;
  }
  .summary {
    font-size: 13px;
    color: #4a5551;
  }
  .card:lang(ar) .summary {
    font-size: 15px;
    line-height: 1.7;
  }
  .count {
    margin-top: auto;
    font-size: 12.5px;
    color: var(--muted);
  }
</style>
