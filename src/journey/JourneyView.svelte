<script lang="ts">
  import { pick, stepOfText, t, tx } from '../lib/i18n';
  import { parseRef } from '../lib/quran-ref';
  import { formatRange, rangesOverlap } from '../lib/years';
  import VerseText from '../quran/VerseText.svelte';
  import { app } from '../state/app.svelte';
  import { href } from '../state/route';
  import Icon from '../ui/Icon.svelte';
  import Txt from '../facts/Txt.svelte';
  import JourneyCard from './JourneyCard.svelte';
  import JourneyMap from './JourneyMap.svelte';
  import JourneyStrip from './JourneyStrip.svelte';
  import { placeName } from './stops';

  const lang = $derived(app.lang);
  const dir = $derived(lang === 'ar' ? 'rtl' : 'ltr');
  const route = $derived(app.route.view === 'journey' ? app.route : undefined);
  const journey = $derived(route ? app.journeysById.get(route.id) : undefined);
  const total = $derived(journey?.steps.length ?? 0);
  const index = $derived(journey ? Math.min(Math.max(1, route?.step ?? 1), total) - 1 : 0);
  const step = $derived(journey?.steps[index]);
  const ev = $derived(step ? app.eventsById.get(step.event) : undefined);

  function go(i: number) {
    if (!journey) return;
    const n = ((i % total) + total) % total;
    app.navigate({ view: 'journey', id: journey.id, step: n + 1 });
  }

  /** The first verse of the step's first passage; the rest is a click away. */
  const firstRef = $derived.by(() => {
    const r = ev?.quran?.[0] ? parseRef(ev.quran[0]) : null;
    return r ? `${r.surah}:${r.from}` : undefined;
  });

  /** What history records for the same years, outside the journey and the prophets' and Quran lanes. */
  const meanwhile = $derived.by(() => {
    if (!ev || !journey) return [];
    const inJourney = new Set(journey.steps.map((s) => s.event));
    return (app.content?.events ?? [])
      .filter((e) => !inJourney.has(e.id) && e.lane !== 'prophets' && e.lane !== 'quran')
      .filter((e) => rangesOverlap(e.when.from, e.when.to, ev.when.from, ev.when.to))
      .slice(0, 4);
  });

  const next = $derived(journey && index + 1 < total ? app.eventsById.get(journey.steps[index + 1].event) : undefined);

  function onKey(e: KeyboardEvent) {
    if (!journey) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward && index + 1 < total) go(index + 1);
    else if (e.key === backward && index > 0) go(index - 1);
  }

  const cover = $derived(app.narrow ? 0 : 470);
</script>

<svelte:window onkeydown={onKey} />

{#if app.route.view === 'journeys'}
  <div class="list-page" {lang} {dir}>
    <h1>{t('journeysTitle', lang)}</h1>
    <p class="lead">{t('journeysLead', lang)}</p>
    <div class="cards">
      {#each app.journeys as j (j.id)}<JourneyCard journey={j} />{/each}
    </div>
  </div>
{:else if !journey}
  <div class="list-page" {lang} {dir}>
    <p>{t('journeyNotFound', lang)}</p>
    <p><a href={href({ view: 'journeys' })}>{t('journeysTitle', lang)}</a></p>
  </div>
{:else}
  <div class="journey" class:narrow={app.narrow}>
    <section class="stage" aria-label={tx(journey.title, lang)}>
      <JourneyMap {journey} current={index} {cover} onpick={go} />

      <article class="story" {lang} {dir} aria-live="polite">
        <div class="story-top">
          <span class="kicker"><Txt m={journey.title} /> · {stepOfText(index + 1, total, lang)}</span>
          <a href={href({ view: 'journeys' })}>{t('leaveJourney', lang)}</a>
        </div>
        {#if ev}
          {#if step?.note}<p class="note"><Txt m={step.note} /></p>{/if}
          <h1><Txt m={ev.title} /></h1>
          <div class="chips">
            <span class="chip"><strong><bdi {dir}>{formatRange(ev.when.from, ev.when.to, lang)}</bdi></strong><span class="swatch c-{ev.when.certainty}" aria-hidden="true"></span></span>
            {#if placeName(ev, lang)}<span class="chip"><Icon name="pin" size={14} />{placeName(ev, lang)}</span>{/if}
            {#if ev.review === 'draft'}<span class="draft-pill">{t('draftShort', lang)}</span>{/if}
          </div>
          <p class="summary"><Txt m={ev.summary} /></p>
          {#if firstRef}
            <div class="verse"><VerseText ref={firstRef} /><span class="ref" dir="ltr">{firstRef.replace('-', '–')}</span></div>
          {/if}
          {#if ev.quran?.length}
            <div class="refs">
              {#each ev.quran as r (r)}
                <a class="ref-chip" href={href({ view: 'quran', surah: parseRef(r)?.surah, ayah: parseRef(r)?.from })}><bdi dir="ltr">{r.replace('-', '–')}</bdi></a>
              {/each}
            </div>
          {/if}
          <p class="place"><Icon name="pin" size={15} />{#if ev.place.description}<Txt m={ev.place.description} />{:else if placeName(ev, lang)}{placeName(ev, lang)}{:else}{t('placeNotNamed', lang)}{/if}</p>

          <div class="meanwhile">
            <div class="mw-title">{t('meanwhile', lang)}</div>
            {#each meanwhile as m (m.id)}
              <a class="mw" href={href({ view: 'explore', eventId: m.id })}>
                <span class="diamond" style:background={app.lanesById.get(m.lane)?.color ?? '#3a6ea5'}></span>
                <span class="mw-name" lang={pick(m.title, lang).lang}>{pick(m.title, lang).text}</span>
                <bdi class="mw-when" {dir}>{formatRange(m.when.from, m.when.to, lang)}</bdi>
              </a>
            {:else}
              <p class="muted small">{t('noHistoryYet', lang)}</p>
            {/each}
          </div>

          <a class="open" href={href({ view: 'explore', eventId: ev.id })}>{t('openFullEntry', lang)}<Icon name={dir === 'rtl' ? 'left' : 'right'} size={15} stroke={2} /></a>
        {/if}

        <div class="nav">
          <button type="button" class="back" disabled={index === 0} onclick={() => go(index - 1)}><Icon name={dir === 'rtl' ? 'right' : 'left'} size={16} stroke={2} />{t('back', lang)}</button>
          <button type="button" class="primary next" onclick={() => go(index + 1 < total ? index + 1 : 0)}>
            <span class="next-label">{#if next}{t('next', lang)}: <span lang={pick(next.title, lang).lang}>{pick(next.title, lang).text}</span>{:else}{t('startAgain', lang)}{/if}</span>
            <Icon name={dir === 'rtl' ? 'left' : 'right'} size={16} stroke={2} />
          </button>
        </div>
      </article>
    </section>

    {#if !app.narrow}
      <JourneyStrip {journey} current={index} onpick={go} />
    {/if}
  </div>
{/if}

<style>
  .list-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 32px 28px 56px;
    overflow-y: auto;
    height: 100%;
  }
  .list-page h1 {
    font-family: var(--font-read);
    font-size: 40px;
    font-weight: 600;
    margin: 0;
  }
  .list-page:lang(ar) h1 {
    font-family: var(--font-ar);
  }
  .lead {
    font-size: 16px;
    color: var(--ink-2);
    max-width: 720px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 22px;
  }
  .journey {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .story {
    position: absolute;
    z-index: 600;
    inset-inline-start: 20px;
    top: 20px;
    bottom: 20px;
    width: 430px;
    max-width: calc(100% - 40px);
    overflow-y: auto;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: 0 10px 30px rgb(30 25 10 / 0.16);
    padding: 16px 20px 18px;
    display: flex;
    flex-direction: column;
  }
  .story-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    font-size: 12.5px;
  }
  .kicker {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #7a5c2e;
  }
  .story:lang(ar) .kicker {
    font-size: 13px;
    letter-spacing: 0;
  }
  .note {
    margin: 10px 0 0;
    font-style: italic;
    color: var(--accent);
  }
  h1 {
    margin: 10px 0 0;
    font-family: var(--font-read);
    font-size: 27px;
    line-height: 1.15;
    font-weight: 600;
  }
  .story:lang(ar) h1 {
    font-family: var(--font-ar);
    font-size: 25px;
    line-height: 1.5;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .chips .chip {
    min-height: 28px;
    font-size: 12.5px;
  }
  .swatch {
    width: 18px;
    height: 8px;
    border-radius: 2px;
    border: 1.5px dashed #7a5c2e;
    background: rgb(122 92 46 / 0.12);
  }
  .swatch.c-established {
    background: #7a5c2e;
    border-style: solid;
  }
  .swatch.c-reckoned {
    border: 1px solid rgb(122 92 46 / 0.6);
    background: repeating-linear-gradient(135deg, rgb(122 92 46 / 0.45) 0 2px, rgb(122 92 46 / 0.1) 2px 4px);
  }
  .swatch.c-debated,
  .swatch.c-unknown {
    border-style: dotted;
    background: none;
  }
  .summary {
    margin: 12px 0 0;
    font-family: var(--font-read);
    font-size: 17px;
    line-height: 1.5;
  }
  .story:lang(ar) .summary {
    font-family: var(--font-ar);
    line-height: 1.85;
  }
  .verse {
    margin-top: 12px;
    border-radius: 12px;
    background: var(--l-quran-tint);
    padding: 4px 14px 6px;
  }
  .verse :global(.quran-text) {
    font-size: 23px;
    line-height: 2;
  }
  .verse .ref {
    font-size: 11.5px;
    color: #3e5a51;
  }
  .refs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .ref-chip {
    height: 28px;
    display: inline-flex;
    align-items: center;
    padding: 0 10px;
    border: 1px solid #cfe0d8;
    border-radius: 8px;
    background: var(--card);
    font-size: 12.5px;
    color: #1f5a4b;
    text-decoration: none;
  }
  .place {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--ink-2);
  }
  .place :global(svg) {
    color: var(--accent);
    margin-top: 2px;
  }
  .meanwhile {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line-soft);
  }
  .mw-title {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4a5551;
  }
  .story:lang(ar) .mw-title {
    font-size: 13px;
    letter-spacing: 0;
  }
  .mw {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 7px;
    font-size: 13px;
    color: var(--ink);
    text-decoration: none;
  }
  .mw:hover .mw-name {
    text-decoration: underline;
  }
  .diamond {
    flex: none;
    width: 9px;
    height: 9px;
    transform: rotate(45deg);
    border-radius: 1px;
  }
  .mw-name {
    flex: 1;
  }
  .mw-when {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }
  .small {
    font-size: 13px;
    margin: 6px 0 0;
  }
  .open {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 14px;
    font-size: 13px;
    font-weight: 600;
  }
  .nav {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 14px;
    position: sticky;
    bottom: -18px;
    padding-bottom: 18px;
    margin-bottom: -18px;
    background: linear-gradient(to bottom, rgb(252 251 248 / 0), var(--paper) 14px);
  }
  .nav button {
    height: 42px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 13.5px;
    border-radius: 11px;
  }
  .next {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }
  .next-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* On a phone the story sits under the map rather than over it. */
  .journey.narrow .stage {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .journey.narrow .stage :global(.journey-map) {
    position: relative;
    flex: 0 0 42vh;
  }
  .journey.narrow .story {
    position: static;
    width: auto;
    max-width: none;
    border-radius: 18px 18px 0 0;
    margin-top: -16px;
    box-shadow: 0 -6px 20px rgb(30 25 10 / 0.12);
    border-bottom: 0;
    overflow: visible;
  }
</style>
