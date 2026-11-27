<script lang="ts">
  import { fullCite } from '../lib/format';
  import {
    certaintyText,
    claimStatusText,
    confidenceText,
    countText,
    coreText,
    gradeText,
    languageNameText,
    nameTypeText,
    offsetText,
    pick,
    relationText,
    t,
    traditionKindText,
    tx,
    versesText,
  } from '../lib/i18n';
  import { aroundThisTime } from '../lib/nearby';
  import { parseRef } from '../lib/quran-ref';
  import { refId, type CqrEvent, type LangText, type SourceRef } from '../lib/schema';
  import { formatRange, formatYear, spanYears } from '../lib/years';
  import VerseText from '../quran/VerseText.svelte';
  import { app, CAN_EDIT } from '../state/app.svelte';
  import { href } from '../state/route';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import Cite, { scrollToId } from './Cite.svelte';
  import Txt from './Txt.svelte';

  let { page = false }: { page?: boolean } = $props();

  const ev = $derived(app.selected);
  const lang = $derived(app.lang);
  const dir = $derived(lang === 'ar' ? 'rtl' : 'ltr');
  const range = (from: number, to: number) => formatRange(from, to, lang);
  const approx = (y: number) => (lang === 'ar' ? `نحو ${formatYear(y, lang)}` : `c. ${formatYear(y, lang)}`);
  const letter = (i: number) => String.fromCharCode(65 + i);

  function citedSources(e: CqrEvent): string[] {
    const refs: SourceRef[] = [
      ...(e.when.alternatives ?? []).flatMap((a) => a.sources ?? []),
      ...(e.place.opinions ?? []).flatMap((o) => o.sources ?? []),
      ...(e.tafsir ?? []).flatMap((x) => (x.source ? [x.source] : [])),
      ...(e.tradition ?? []).flatMap((x) => [...(x.source ? [x.source] : []), ...(x.gradings ?? []).flatMap((g) => (g.source ? [g.source] : []))]),
      ...(e.history ?? []).flatMap((h) => h.sources ?? []),
    ];
    return [...new Set(refs.map(refId))];
  }

  function verseCount(ref: string) {
    const r = parseRef(ref);
    return r ? r.to - r.from + 1 : 0;
  }

  function surahName(ref: string) {
    const r = parseRef(ref);
    const s = r && app.quran?.surahs[r.surah - 1];
    if (!s) return '';
    return lang === 'ar' ? `سورة ${s.name}` : s.tname;
  }

  /** The first verses of a passage, for the collapsed view. */
  function head(ref: string, n: number) {
    const r = parseRef(ref);
    if (!r || r.to - r.from + 1 <= n) return ref;
    return `${r.surah}:${r.from}-${r.from + n - 1}`;
  }

  const SHOW_VERSES = 4;
  const SHOW_ITEMS = 3;

  let refSel = $state<string | undefined>(undefined);
  let allVerses = $state(false);
  let allTafsir = $state(false);
  let allTradition = $state(false);
  let copied = $state(false);
  let scroller: HTMLElement;

  $effect(() => {
    // A new selection starts at its first passage, collapsed, at the top.
    const e = ev;
    refSel = e?.quran?.[0];
    allVerses = false;
    allTafsir = false;
    allTradition = false;
    scroller?.scrollTo({ top: 0 });
  });

  const counts = $derived({
    quran: ev?.quran?.length ?? 0,
    tafsir: ev?.tafsir?.length ?? 0,
    tradition: ev?.tradition?.length ?? 0,
    history: ev?.history?.length ?? 0,
    reflection: ev?.connection ? 1 : 0,
  });

  const LAYERS: { key: keyof typeof counts; icon: IconName; label: 'layerQuran' | 'layerTafsir' | 'layerTradition' | 'layerHistory' | 'layerReflection'; noun: 'passage' | 'comment' | 'report' | 'finding' | null }[] = [
    { key: 'quran', icon: 'quran', label: 'layerQuran', noun: 'passage' },
    { key: 'tafsir', icon: 'tafsir', label: 'layerTafsir', noun: 'comment' },
    { key: 'tradition', icon: 'tradition', label: 'layerTradition', noun: 'report' },
    { key: 'history', icon: 'history', label: 'layerHistory', noun: 'finding' },
    { key: 'reflection', icon: 'reflection', label: 'layerReflection', noun: null },
  ];

  const around = $derived.by(() => {
    if (!ev || !app.content) return [];
    const exclude = new Set((ev.related ?? []).map((r) => r.id));
    return aroundThisTime(ev, app.content.events, exclude);
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      // Clipboard not available (e.g. not a secure context): the address bar still has the link.
    }
  }

  function placeChip(e: CqrEvent): { main: string; note: string } {
    const p = e.place;
    if (p.status === 'unknown') return { main: t('placeUnknownShort', lang), note: '' };
    if (p.status === 'proposed') {
      const n = p.opinions?.length ?? 0;
      const first = p.opinions?.[0] ? tx(p.opinions[0].name, lang).split(/[,،(]/)[0].trim() : '';
      return { main: first || t('proposedShort', lang), note: n > 1 ? `${t('proposedShort', lang)} · ${countText(n, 'opinion', lang)}` : t('proposedShort', lang) };
    }
    const name = p.names?.[0]?.name ?? '';
    return { main: name || t('knownShort', lang), note: name ? t('knownShort', lang) : '' };
  }

  /** "c. 3516 BCE" for dates that are not documented, the plain range for those that are. */
  function dateText(e: CqrEvent): string {
    const r = range(e.when.from, e.when.to);
    if (e.when.certainty === 'established' || e.when.certainty === 'unknown') return r;
    return lang === 'ar' ? `نحو ${r}` : `c. ${r}`;
  }

  function hatchFor(certainty: string): string {
    return `swatch c-${certainty}`;
  }
</script>

<!--
  A report or commentary: the project's words (a summary or translation, in the reader's language)
  and, kept apart, the source's own words as quoted from the cited work. In Arabic the source's
  words come first, and the project's words are labeled so they are never taken for the source's.
-->
{#snippet wording(text: LangText, original: string | undefined)}
  {#if lang === 'ar'}
    {#if original}
      <p class="wording-label">{t('inSourceWords', lang)}</p>
      <p class="original" dir="rtl" lang="ar">{original}</p>
      <p class="wording-label">{t('inProjectWords', lang)}</p>
    {/if}
    <p class="report-text"><Txt m={text} /></p>
  {:else}
    <p class="report-text"><Txt m={text} /></p>
    {#if original}
      <p class="original" dir="rtl" lang="ar"><span class="wording-label inline" lang="en" dir="ltr">{t('inSourceWords', lang)}</span> {original}</p>
    {/if}
  {/if}
{/snippet}

{#snippet layerHead(icon: IconName, title: string, cls: string, sub?: string)}
  <h3 class="layer-head {cls}"><Icon name={icon} size={18} />{title}</h3>
  {#if sub}<p class="layer-sub">{sub}</p>{/if}
{/snippet}

<section class="facts" class:page aria-label={ev ? tx(ev.title, lang) : 'Facts'} {lang} {dir} bind:this={scroller}>
  {#if !ev}
    <div class="intro">
      <h2>{t('explore', lang)}</h2>
      <p class="lead">{t('introLead', lang)}</p>
      <p>{t('introHow', lang)}</p>
      <ol class="mini-layers">
        <li class="quran"><Icon name="quran" size={16} />{t('layerQuran', lang)}</li>
        <li class="tafsir"><Icon name="tafsir" size={16} />{t('layerTafsir', lang)}</li>
        <li class="tradition"><Icon name="tradition" size={16} />{t('layerTradition', lang)}</li>
        <li class="history"><Icon name="history" size={16} />{t('layerHistory', lang)}</li>
        <li class="reflection"><Icon name="reflection" size={16} />{t('layerReflection', lang)}</li>
      </ol>
      {#if app.journeys.length}
        <p class="sub-title">{t('beginJourney', lang)}</p>
        <ul class="journey-links">
          {#each app.journeys as j (j.id)}
            <li><a href={href({ view: 'journey', id: j.id, step: 1 })}><Icon name="compass" size={16} /><Txt m={j.title} /><span class="muted">{countText(j.steps.length, 'step', lang)}</span></a></li>
          {/each}
        </ul>
      {/if}
      {#if app.content?.events.some((e) => e.review === 'draft')}
        <p class="draft-note">{t('introDrafts', lang)}</p>
      {/if}
      {#if lang === 'ar'}
        <p class="draft-note">{t('arabicNote', lang)}</p>
      {/if}
    </div>
  {:else}
    {@const lane = app.lanesById.get(ev.lane)}
    {@const cited = citedSources(ev)}
    {@const pc = placeChip(ev)}
    <article>
      <div class="topline">
        <span class="lane-tag"><span class="dot" style:background={lane?.color ?? '#666'}></span>{#if lane}<Txt m={lane.name} />{:else}{ev.lane}{/if} · {t(ev.kind === 'period' ? 'kindPeriod' : 'kindEvent', lang)}</span>
        {#if ev.review === 'draft'}<span class="draft-pill" title={t('draftBanner', lang)}><Icon name="info" size={13} stroke={2} />{t('draftShort', lang)}</span>{/if}
        <span class="actions">
          {#if CAN_EDIT}<a class="button icon-btn" href={href({ view: 'edit', collection: 'events', id: ev.id })} aria-label={t('edit', lang)} title={t('edit', lang)}><Icon name="pen" size={16} /></a>{/if}
          <button type="button" class="icon-btn" onclick={() => app.step(-1)} aria-label={t('previousEvent', lang)} title={t('previousEvent', lang)}><Icon name={dir === 'rtl' ? 'right' : 'left'} size={16} stroke={2} /></button>
          <button type="button" class="icon-btn" onclick={() => app.step(1)} aria-label={t('nextEvent', lang)} title={t('nextEvent', lang)}><Icon name={dir === 'rtl' ? 'left' : 'right'} size={16} stroke={2} /></button>
          <button type="button" class="icon-btn" onclick={copyLink} aria-label={t('copyLink', lang)} title={copied ? t('linkCopied', lang) : t('copyLink', lang)}><Icon name={copied ? 'check' : 'link'} size={16} /></button>
        </span>
      </div>

      <header>
        <h2><Txt m={ev.title} /></h2>
        {#if lang === 'en' && ev.title.ar}<p class="title-other" dir="rtl" lang="ar">{ev.title.ar}</p>{/if}
        {#if lang === 'ar'}<p class="title-other" dir="ltr" lang="en">{ev.title.en}</p>{/if}
      </header>

      <div class="chips">
        <button type="button" class="chip" onclick={() => scrollToId('when')}>
          <Icon name="clock" size={15} />
          <strong><bdi {dir}>{dateText(ev)}</bdi></strong>
          <span class={hatchFor(ev.when.certainty)} aria-hidden="true"></span>
          <span class="note">{certaintyText(ev.when.certainty, lang)}</span>
        </button>
        <button type="button" class="chip" onclick={() => scrollToId('where')}>
          <Icon name="pin" size={15} />
          <strong>{pc.main}</strong>
          {#if pc.note}<span class="note">{pc.note}</span>{/if}
        </button>
        {#if counts.quran}
          <button type="button" class="chip" onclick={() => scrollToId('layer-quran')}>
            <span class="q-icon"><Icon name="quran" size={15} /></span>
            <strong>{countText(counts.quran, 'passage', lang)}</strong>
            <span class="note">{t('inTheQuranChip', lang)}</span>
          </button>
        {/if}
      </div>

      <p class="summary"><Txt m={ev.summary} /></p>

      <!-- How the date is known -->
      <div class="card" id="when">
        <div class="card-top">
          <span class="card-title">{ev.when.chain ? t('howReckoned', lang) : t('howDated', lang)}</span>
          {#if ev.when.certainty === 'reckoned'}<span class="card-note">{t('historyCannotDate', lang)}</span>{/if}
        </div>
        {#if ev.when.chain}
          <ol class="chain">
            {#each ev.when.chain as s, i (i)}
              {#if i > 0 && s.gap}<li class="gap"><Txt m={s.gap} /></li>{/if}
              <li class="node" class:own={s.year >= ev.when.from && s.year <= ev.when.to}>
                <span class="bullet"></span>
                <span class="what"><Txt m={s.label} /></span>
                <strong><bdi {dir}>{approx(s.year)}</bdi></strong>
              </li>
            {/each}
          </ol>
          <details class="basis">
            <summary>{t('fullBasis', lang)}</summary>
            <p><Txt m={ev.when.basis} /></p>
          </details>
        {:else}
          <p class="basis-text"><bdi {dir} class="range-strong">{range(ev.when.from, ev.when.to)}</bdi> · <Txt m={ev.when.basis} /></p>
        {/if}
        {#if ev.when.core}
          <p class="core-note">
            <span class="core-swatch" style:background={lane?.color}></span>
            <span>{coreText(range(ev.when.core.from, ev.when.core.to), spanYears(ev.when.core.from, ev.when.core.to), lang)} <Txt m={ev.when.core.basis} /></span>
          </p>
        {/if}
        {#if ev.when.alternatives?.length}
          <p class="sub">{t('otherDatings', lang)}</p>
          <ul class="alts">
            {#each ev.when.alternatives as alt, i (i)}
              <li><bdi {dir} class="range-strong">{range(alt.from, alt.to)}</bdi>: <Txt m={alt.basis} /> <Cite refs={alt.sources} /></li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Where -->
      <div class="card" id="where">
        <div class="card-top"><span class="card-title">{t('where', lang)}</span></div>
        {#if ev.place.description}<p class="basis-text"><Txt m={ev.place.description} /></p>{/if}
        {#if ev.place.names?.length}
          <p class="names">
            {#each ev.place.names as n, i (i)}
              <span><strong><bdi>{n.name}</bdi></strong> <span class="muted">({nameTypeText(n.type, lang)}{n.language ? `${lang === 'ar' ? '، ' : ', '}${languageNameText(n.language, lang)}` : ''})</span></span>{i < ev.place.names.length - 1 ? ' · ' : ''}
            {/each}
          </p>
        {/if}
        {#if ev.place.opinions?.length}
          <ul class="opinions">
            {#each ev.place.opinions as op, i (i)}
              <li>
                <span class="letter" class:hollow={i > 0}>{letter(i)}</span>
                <span><Txt m={op.name} />{op.geometry ? '' : t('notMapped', lang)} <Cite refs={op.sources} /></span>
              </li>
            {/each}
          </ul>
          <p class="card-note">{t('roughSketches', lang)}</p>
        {/if}
      </div>

      <!-- The five layers -->
      <nav class="strata" aria-label={t('layersNav', lang)}>
        {#each LAYERS as L (L.key)}
          {@const n = counts[L.key]}
          <button type="button" class="seg {L.key}" disabled={!n} onclick={() => scrollToId(`layer-${L.key}`)}>
            <span class="seg-name">{t(L.label, lang)}</span>
            <span class="seg-count">{n ? (L.noun ? countText(n, L.noun, lang) : '1') : t('none', lang)}</span>
          </button>
        {/each}
      </nav>

      {#if ev.quran?.length}
        <section class="layer" id="layer-quran">
          {@render layerHead('quran', t('inTheQuran', lang), 'quran')}
          {#if refSel}
            {@const n = verseCount(refSel)}
            <div class="verse-card">
              <VerseText ref={allVerses ? refSel : head(refSel, SHOW_VERSES)} />
              <div class="verse-foot">
                <span><bdi dir="ltr">{refSel.replace('-', '–')}</bdi> {surahName(refSel)}</span>
                {#if n > SHOW_VERSES}
                  <button type="button" class="linkish" onclick={() => (allVerses = !allVerses)}>{allVerses ? t('showFewer', lang) : versesText(n, lang)}</button>
                {/if}
                <a href={href({ view: 'quran', surah: parseRef(refSel)?.surah, ayah: parseRef(refSel)?.from })}>{t('openInReader', lang)}</a>
              </div>
            </div>
          {/if}
          <div class="refs" role="group" aria-label={t('inTheQuran', lang)}>
            {#each ev.quran as ref (ref)}
              <button type="button" class="ref" aria-pressed={ref === refSel} onclick={() => { refSel = ref; allVerses = false; }}><bdi dir="ltr">{ref.replace('-', '–')}</bdi></button>
            {/each}
          </div>
          <p class="credit">
            {t('quranCredit', lang)} <a href="https://tanzil.net" target="_blank" rel="noopener">{lang === 'ar' ? 'مشروع تنزيل (Tanzil)' : 'Tanzil'}</a>
            {t('quranCreditScript', lang)}
          </p>
        </section>
      {/if}

      {#if ev.tafsir?.length}
        <section class="layer" id="layer-tafsir">
          {@render layerHead('tafsir', t('whatCommentatorsSaid', lang), 'tafsir')}
          {#each allTafsir ? ev.tafsir : ev.tafsir.slice(0, SHOW_ITEMS) as tf, i (i)}
            <article class="item">
              {@render wording(tf.text, tf.original)}
              <p class="item-meta"><Cite refs={tf.source ? [tf.source] : undefined} /></p>
            </article>
          {/each}
          {#if ev.tafsir.length > SHOW_ITEMS}
            <button type="button" class="more tafsir" onclick={() => (allTafsir = !allTafsir)}>{allTafsir ? t('showFewer', lang) : `+ ${countText(ev.tafsir.length - SHOW_ITEMS, 'comment', lang)}`}</button>
          {/if}
        </section>
      {/if}

      {#if ev.tradition?.length}
        <section class="layer" id="layer-tradition">
          {@render layerHead('tradition', t('hadithAndHistorians', lang), 'tradition', t('traditionSub', lang))}
          {#if lang === 'ar'}<p class="muted small">{t('projectWordsNote', lang)}</p>{/if}
          {#each allTradition ? ev.tradition : ev.tradition.slice(0, SHOW_ITEMS + 1) as tr, i (i)}
            <article class="item">
              <div class="item-head">
                <span class="kind kind-{tr.kind}">{traditionKindText(tr.kind, lang)}</span>
                <strong class="attribution"><Txt m={tr.attribution} /></strong>
              </div>
              {@render wording(tr.text, tr.original)}
              {#if tr.kind === 'ahl-al-kitab'}<p class="ahl-note">{t('ahlKitabNote', lang)}</p>{/if}
              {#if tr.gradings?.length}
                <ul class="gradings">
                  {#each tr.gradings as g, j (j)}
                    <li>
                      <span class="grade grade-{g.grade}"><span class="gdot"></span><strong>{gradeText(g.grade, lang)}</strong> <Txt m={g.by} /></span>
                      {#if g.note}<span class="gnote"><Txt m={g.note} /></span>{/if}
                      {#if g.source}<Cite refs={[g.source]} />{/if}
                    </li>
                  {/each}
                </ul>
              {/if}
              <p class="item-meta"><Cite refs={tr.source ? [tr.source] : undefined} /></p>
            </article>
          {/each}
          {#if ev.tradition.length > SHOW_ITEMS + 1}
            <button type="button" class="more tradition" onclick={() => (allTradition = !allTradition)}>{allTradition ? t('showFewer', lang) : `+ ${countText(ev.tradition.length - SHOW_ITEMS - 1, 'report', lang)}`}</button>
          {/if}
        </section>
      {/if}

      {#if ev.history?.length}
        <section class="layer" id="layer-history">
          {@render layerHead('history', t('history', lang), 'history')}
          {#each ev.history as h, i (i)}
            <article class="item">
              <span class="status status-{h.status}"><Icon name={h.status === 'established' ? 'check' : 'question'} size={14} stroke={2.2} />{claimStatusText(h.status, lang)}{#if h.sources?.length} · {countText(h.sources.length, 'source', lang)}{/if}</span>
              <p class="report-text"><Txt m={h.claim} /></p>
              <p class="item-meta"><Cite refs={h.sources} /></p>
            </article>
          {/each}
        </section>
      {/if}

      {#if ev.connection}
        <section class="layer reflection-card" id="layer-reflection">
          {@render layerHead('reflection', t('layerReflection', lang), 'reflection')}
          <p class="layer-sub">
            {t('reflectionSub', lang)} ·
            {#if ev.connection.confidence}{confidenceText(ev.connection.confidence, lang)}{:else}{t('confidenceNotSet', lang)}{/if}
          </p>
          <p class="report-text"><Txt m={ev.connection.text} /></p>
        </section>
      {/if}

      {#if around.length}
        <section class="layer" id="around">
          <h3 class="layer-head plain">{t('aroundThisTime', lang)}</h3>
          <ul class="event-list">
            {#each around as a (a.event.id)}
              {@const l = app.lanesById.get(a.event.lane)}
              <li>
                <a href={href({ view: 'explore', eventId: a.event.id })}>
                  <span class="dot" style:background={l?.color ?? '#666'}></span>
                  <span class="name" lang={pick(a.event.title, lang).lang}>{pick(a.event.title, lang).text}</span>
                  <span class="when">{a.offset === 0 ? `${t('sameTime', lang)} · ${range(a.event.when.from, a.event.when.to)}` : offsetText(a.offset, lang)}</span>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if ev.related?.length}
        <section class="layer" id="related">
          <h3 class="layer-head plain">{t('related', lang)}</h3>
          <ul class="event-list">
            {#each ev.related as r (r.id)}
              {@const other = app.eventsById.get(r.id)}
              {@const l = other ? app.lanesById.get(other.lane) : undefined}
              <li>
                <a href={href({ view: 'explore', eventId: r.id })}>
                  <span class="dot" style:background={l?.color ?? '#666'}></span>
                  <span class="name">{#if other}<Txt m={other.title} />{:else}{r.id}{/if}</span>
                  <span class="when">{relationText(r.type, lang)}{#if other} · {range(other.when.from, other.when.to)}{/if}</span>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if cited.length}
        <section class="layer sources-list">
          <h3 class="layer-head plain">{t('sources', lang)}</h3>
          <ol class="sources">
            {#each cited as id (id)}
              {@const s = app.sourcesById.get(id)}
              <li id="src-{id}">
                <bdi>{s ? fullCite(s) : `${id} ${t('missingSource', lang)}`}</bdi>
                {#if s?.url}<a href={s.url} target="_blank" rel="noopener">{t('link', lang)}</a>{/if}
              </li>
            {/each}
          </ol>
        </section>
      {/if}

      {#if CAN_EDIT && ev.notes}
        <section class="notes" lang="en" dir="ltr">
          <h3>Editorial notes <span class="muted small">(visible only in the local editor)</span></h3>
          <p>{ev.notes}</p>
        </section>
      {/if}
    </article>
  {/if}
</section>

<style>
  .facts {
    height: 100%;
    overflow-y: auto;
    padding: 16px 26px 48px;
    background: var(--paper);
  }
  .facts > * {
    max-width: 700px;
  }
  .facts.page {
    padding: 14px 18px 32px;
  }
  /* Intro */
  .intro h2 {
    font-family: var(--font-read);
    font-size: 30px;
    font-weight: 600;
    margin: 6px 0 8px;
  }
  .intro .lead {
    font-family: var(--font-read);
    font-size: 18px;
    line-height: 1.5;
  }
  .mini-layers {
    list-style: none;
    padding: 0;
    margin: 14px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mini-layers li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
  }
  .mini-layers .quran {
    background: var(--l-quran-tint);
    color: var(--l-quran-text);
  }
  .mini-layers .tafsir {
    background: var(--l-tafsir-tint);
    color: var(--l-tafsir-text);
  }
  .mini-layers .tradition {
    background: var(--l-tradition-tint);
    color: var(--l-tradition-text);
  }
  .mini-layers .history {
    background: var(--l-history-tint);
    color: var(--l-history-text);
  }
  .mini-layers .reflection {
    background: var(--l-reflection-tint);
    color: var(--l-reflection-text);
    outline: 1.5px dashed #b996b7;
    outline-offset: -1.5px;
  }
  .sub-title {
    font-weight: 600;
    margin: 18px 0 6px;
  }
  .journey-links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .journey-links a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--card);
    text-decoration: none;
    color: var(--ink);
  }
  .journey-links a:hover {
    border-color: #b9b1a2;
  }
  .journey-links .muted {
    margin-inline-start: auto;
    font-size: 12px;
  }
  .draft-note {
    background: #fbf5e7;
    border: 1px solid #ecd9a8;
    color: var(--draft-ink);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
  }

  /* Entry header */
  .topline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 12.5px;
    color: var(--muted);
  }
  .lane-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
    display: inline-block;
  }
  .actions {
    margin-inline-start: auto;
    display: flex;
    gap: 4px;
  }
  .actions .icon-btn {
    width: 32px;
    height: 32px;
  }
  header h2 {
    margin: 10px 0 0;
    font-family: var(--font-read);
    font-size: 33px;
    font-weight: 600;
    line-height: 1.12;
    letter-spacing: -0.01em;
  }
  .title-other {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: 15px;
  }
  .title-other:lang(ar) {
    font-size: 22px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .chips .chip {
    height: 32px;
  }
  .q-icon {
    color: var(--accent);
    display: inline-flex;
  }
  .swatch {
    width: 18px;
    height: 8px;
    border-radius: 2px;
    flex: none;
    border: 1px solid rgb(122 92 46 / 0.6);
  }
  .swatch.c-established {
    background: #7a5c2e;
    border-color: #7a5c2e;
  }
  .swatch.c-estimated {
    background: linear-gradient(90deg, rgb(122 92 46 / 0.2), #7a5c2e 30%, #7a5c2e 70%, rgb(122 92 46 / 0.2));
    border: 0;
  }
  .swatch.c-traditional {
    border: 1.5px dashed #7a5c2e;
    background: rgb(122 92 46 / 0.12);
  }
  .swatch.c-reckoned {
    background: repeating-linear-gradient(135deg, rgb(122 92 46 / 0.45) 0 2px, rgb(122 92 46 / 0.1) 2px 4px);
  }
  .swatch.c-debated,
  .swatch.c-unknown {
    border: 1.5px dotted #7a5c2e;
    background: none;
  }
  .summary {
    font-family: var(--font-read);
    font-size: 18.5px;
    line-height: 1.55;
    margin: 16px 0 0;
  }
  .facts:lang(ar) .summary {
    font-family: var(--font-ar);
    font-size: 18px;
    line-height: 1.85;
  }

  /* Cards: dating and place */
  .card {
    margin-top: 16px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--card);
    padding: 13px 16px;
    scroll-margin-top: 12px;
  }
  .card-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .card-title {
    font-weight: 600;
    font-size: 13.5px;
  }
  .card-note {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }
  .card .card-note:not(:first-child) {
    margin-top: 8px;
  }
  .chain {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
  }
  .chain .node {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 3px 0;
  }
  .chain .node .what {
    flex: 1;
  }
  .chain .bullet {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #c9c0ae;
    flex: none;
    transform: translateY(1px);
  }
  .chain .node.own .bullet {
    background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-tint);
  }
  .chain .node.own {
    color: #123f34;
    font-weight: 600;
  }
  .chain .gap {
    margin-inline-start: 5px;
    padding: 2px 0 2px 16px;
    border-inline-start: 1.5px dashed #c9c0ae;
    font-size: 12.5px;
    color: #4a5551;
  }
  .facts[dir='rtl'] .chain .gap {
    padding: 2px 16px 2px 0;
  }
  .basis {
    margin-top: 8px;
    font-size: 13px;
    color: var(--ink-2);
  }
  .basis summary {
    cursor: pointer;
    color: var(--accent);
    font-size: 12.5px;
  }
  .basis-text {
    margin: 8px 0 0;
    font-size: 13.5px;
    color: var(--ink-2);
  }
  .range-strong {
    font-weight: 600;
    color: var(--ink);
  }
  .core-note {
    font-size: 12.5px;
    color: #333;
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin: 10px 0 0;
  }
  .core-swatch {
    display: inline-block;
    width: 18px;
    height: 8px;
    border-radius: 2px;
    opacity: 0.85;
    flex: none;
  }
  .sub {
    margin: 10px 0 2px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .alts {
    margin: 2px 0 0;
    padding-inline-start: 18px;
    font-size: 13px;
  }
  .names {
    font-size: 13px;
    margin: 8px 0 0;
  }
  .opinions {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: grid;
    gap: 6px;
    font-size: 13.5px;
  }
  .opinions li {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .letter {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: inline-grid;
    place-items: center;
    transform: translateY(4px);
  }
  .letter.hollow {
    background: var(--card);
    color: var(--accent);
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  /* The strata navigator */
  .strata {
    margin-top: 22px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    background: var(--card);
  }
  .seg {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 10px 7px;
    border: 0;
    border-radius: 0;
    border-top: 4px solid;
    background: var(--card);
    text-align: start;
    min-width: 0;
  }
  .seg + .seg {
    border-inline-start: 1px solid var(--line-soft);
  }
  .seg:disabled {
    opacity: 1;
    border-top-color: #e5e1d8 !important;
  }
  .seg:disabled .seg-name {
    color: #8b918d !important;
  }
  .seg-name {
    font-size: 12.5px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .seg-count {
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
  }
  .seg.quran {
    border-top-color: var(--l-quran);
  }
  .seg.quran .seg-name {
    color: var(--l-quran-text);
  }
  .seg.tafsir {
    border-top-color: var(--l-tafsir);
  }
  .seg.tafsir .seg-name {
    color: var(--l-tafsir-text);
  }
  .seg.tradition {
    border-top-color: var(--l-tradition);
  }
  .seg.tradition .seg-name {
    color: var(--l-tradition-text);
  }
  .seg.history {
    border-top-color: var(--l-history);
  }
  .seg.history .seg-name {
    color: var(--l-history-text);
  }
  .seg.reflection {
    border-top-style: dashed;
    border-top-color: var(--l-reflection);
  }
  .seg.reflection .seg-name {
    color: var(--l-reflection-text);
  }

  /* Layers */
  .layer {
    margin-top: 28px;
    scroll-margin-top: 12px;
  }
  .layer-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .facts:lang(ar) .layer-head {
    font-size: 15px;
    letter-spacing: 0;
  }
  .layer-head.quran {
    color: var(--l-quran-text);
  }
  .layer-head.tafsir {
    color: var(--l-tafsir-text);
  }
  .layer-head.tradition {
    color: var(--l-tradition-text);
  }
  .layer-head.history {
    color: var(--l-history-text);
  }
  .layer-head.reflection {
    color: var(--l-reflection-text);
  }
  .layer-head.plain {
    color: #4a5551;
  }
  .layer-sub {
    margin: 3px 0 0;
    font-size: 12.5px;
    color: var(--muted);
  }
  .verse-card {
    margin-top: 10px;
    border-radius: 14px;
    background: var(--l-quran-tint);
    padding: 8px 18px 8px;
  }
  .verse-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    align-items: center;
    font-size: 12.5px;
    color: #3e5a51;
    margin-top: 2px;
  }
  .verse-foot a {
    margin-inline-start: auto;
  }
  .linkish {
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent);
    font-size: 12.5px;
    text-decoration: underline;
  }
  .linkish:hover {
    background: none !important;
  }
  .refs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .ref {
    height: 30px;
    padding: 0 11px;
    border-color: #cfe0d8;
    color: #1f5a4b;
    font-size: 12.5px;
  }
  .ref[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .ref[aria-pressed='true']:hover {
    background: var(--accent-dark) !important;
  }
  .credit {
    font-size: 11.5px;
    color: var(--muted);
    margin: 8px 0 0;
  }
  .item {
    padding: 12px 0;
    border-bottom: 1px solid var(--line-soft);
  }
  .item:last-of-type {
    border-bottom: 0;
  }
  .item-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .attribution {
    font-weight: 600;
  }
  .kind {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 1px 7px;
    border-radius: 5px;
    background: var(--l-tradition-tint);
    color: var(--draft-ink);
  }
  .facts:lang(ar) .kind {
    font-size: 12.5px;
    letter-spacing: 0;
  }
  .kind-ahl-al-kitab {
    background: #eeebe4;
    color: #4a5551;
  }
  .kind-historian {
    background: #f3eee4;
    color: #5f4a22;
  }
  .report-text {
    margin: 5px 0 0;
    color: #2a322f;
  }
  .wording-label {
    font-size: 11.5px;
    color: var(--muted);
    margin: 6px 0 0;
  }
  .wording-label.inline {
    font-family: var(--font-ui);
    color: var(--l-tafsir-text);
    margin: 0;
  }
  .original {
    font-family: var(--font-ar);
    font-size: 17px;
    line-height: 1.85;
    margin: 6px 0 0;
    color: #2f3835;
  }
  .item-meta {
    margin: 4px 0 0;
  }
  .ahl-note {
    margin: 4px 0 0;
    font-size: 12.5px;
    color: #4a5551;
    font-style: italic;
  }
  .facts:lang(ar) .ahl-note {
    font-style: normal;
    font-size: 13.5px;
  }
  .gradings {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: grid;
    gap: 6px;
    font-size: 12.5px;
  }
  .gradings li {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .grade {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 9px;
    border-radius: 7px;
    border: 1px solid #e5d3af;
    background: #fffbf2;
  }
  .gdot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #b07a1e;
  }
  .grade-sahih,
  .grade-hasan {
    border-color: #bfd9cc;
    background: #f2f8f5;
  }
  .grade-sahih .gdot,
  .grade-hasan .gdot {
    background: var(--accent);
  }
  .grade-daif,
  .grade-very-weak,
  .grade-fabricated {
    border-color: #e8c9be;
    background: #fbf3f0;
  }
  .grade-daif .gdot,
  .grade-very-weak .gdot,
  .grade-fabricated .gdot {
    background: var(--l-history);
  }
  .gnote {
    color: var(--muted);
  }
  .more {
    margin-top: 6px;
    height: 32px;
    font-size: 13px;
  }
  .more.tafsir {
    border-color: #d4d9ec;
    color: var(--l-tafsir-text);
  }
  .more.tradition {
    border-color: #e5d3af;
    color: var(--l-tradition-text);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .status-established {
    color: #1f5a4b;
  }
  .status-debated {
    color: #8a3a1f;
  }
  .reflection-card {
    border: 1.5px dashed #b996b7;
    border-radius: 14px;
    padding: 14px 16px;
    background: var(--l-reflection-tint);
  }
  .event-list {
    list-style: none;
    padding: 0;
    margin: 10px 0 0;
    display: grid;
    gap: 6px;
  }
  .event-list a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--card);
    text-decoration: none;
    color: var(--ink);
  }
  .event-list a:hover {
    border-color: #b9b1a2;
  }
  .event-list .name {
    flex: 1;
    min-width: 0;
  }
  .event-list .when {
    font-size: 12px;
    color: var(--muted);
    text-align: end;
  }
  .sources {
    font-size: 13px;
    padding-inline-start: 22px;
    margin: 8px 0 0;
  }
  .sources li {
    margin: 3px 0;
    border-radius: 6px;
    transition: background 0.6s;
  }
  :global(.flash) {
    background: #fff3c4;
  }
  .notes {
    margin-top: 24px;
    background: #f4f6f8;
    border: 1px dashed #b8c2cc;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
  }
  .notes h3 {
    margin: 0 0 4px;
    font-size: 13px;
  }
  .small {
    font-size: 12px;
  }
  /* Arabic reading: Naskh needs more size and line height than Latin text. */
  .facts:lang(ar) {
    font-size: 16px;
    line-height: 1.8;
  }
  .facts:lang(ar) header h2 {
    font-family: var(--font-ar);
    font-size: 28px;
    line-height: 1.5;
  }
  .facts:lang(ar) .intro h2 {
    font-family: var(--font-ar);
  }
  .facts:lang(ar) .intro .lead {
    font-family: var(--font-ar);
    font-size: 18px;
    line-height: 1.85;
  }
  @media (max-width: 760px) {
    .facts {
      padding: 14px 16px 40px;
    }
    header h2 {
      font-size: 29px;
    }
    .strata {
      grid-template-columns: repeat(5, minmax(84px, 1fr));
      overflow-x: auto;
    }
  }
</style>
