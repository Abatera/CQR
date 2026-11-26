<script lang="ts">
  import { fullCite } from '../lib/format';
  import {
    certaintyText,
    claimStatusText,
    confidenceText,
    coreText,
    gradeText,
    languageNameText,
    locationText,
    nameTypeText,
    relationText,
    t,
    traditionKindText,
    versesText,
  } from '../lib/i18n';
  import { parseRef } from '../lib/quran-ref';
  import { refId, type CqrEvent, type LangText, type SourceRef } from '../lib/schema';
  import { formatRange, spanYears } from '../lib/years';
  import VerseText from '../quran/VerseText.svelte';
  import { app, CAN_EDIT } from '../state/app.svelte';
  import { href } from '../state/route';
  import Cite from './Cite.svelte';
  import Txt from './Txt.svelte';

  const ev = $derived(app.selected);
  const lang = $derived(app.lang);
  const range = (from: number, to: number) => formatRange(from, to, lang);
  const comma = $derived(lang === 'ar' ? '، ' : ', ');

  function citedSources(e: CqrEvent): string[] {
    const refs: SourceRef[] = [
      ...(e.when.alternatives ?? []).flatMap((a) => a.sources ?? []),
      ...(e.place.opinions ?? []).flatMap((o) => o.sources ?? []),
      ...(e.tafsir ?? []).flatMap((t) => (t.source ? [t.source] : [])),
      ...(e.tradition ?? []).flatMap((t) => [...(t.source ? [t.source] : []), ...(t.gradings ?? []).flatMap((g) => (g.source ? [g.source] : []))]),
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

  let expanded = $state<Record<string, boolean>>({});
  $effect(() => {
    // Reset when the selection changes; short passages open by default.
    const e = ev;
    expanded = Object.fromEntries((e?.quran ?? []).map((r) => [r, verseCount(r) <= 5]));
  });
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
      <p class="wording-label">{t('inSourceWords', lang)}</p>
      <p class="original" dir="rtl" lang="ar">{original}</p>
    {/if}
  {/if}
{/snippet}

<section class="facts" aria-label="Facts" {lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
  {#if !ev}
    <div class="intro">
      <h2><bdi lang="en">Chronotope of Quranic Reality</bdi></h2>
      <p>{t('introLead', lang)}</p>
      <p>{t('introHow', lang)}</p>
      <p class="muted">{t('introLayers', lang)}</p>
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
    <article>
      {#if ev.review === 'draft'}
        <div class="draft-banner">{t('draftBanner', lang)}</div>
      {/if}

      <header>
        <h2><Txt m={ev.title} /></h2>
        {#if lang === 'en' && ev.title.ar}<p class="title-ar" dir="rtl" lang="ar">{ev.title.ar}</p>{/if}
        {#if lang === 'ar'}<p class="title-en"><bdi lang="en">{ev.title.en}</bdi></p>{/if}
        <p class="meta">
          <span class="lane-chip" style:border-color={lane?.color}>{#if lane}<Txt m={lane.name} />{:else}{ev.lane}{/if}</span>
          <span>{range(ev.when.from, ev.when.to)}</span>
          <span class="badge certainty-{ev.when.certainty}">{certaintyText(ev.when.certainty, lang)}</span>
          <span class="badge loc-{ev.place.status}">{locationText(ev.place.status, lang)}</span>
        </p>
        {#if CAN_EDIT}
          <a class="edit-link" href={href({ view: 'edit', collection: 'events', id: ev.id })}>{t('edit', lang)}</a>
        {/if}
      </header>

      <p class="summary"><Txt m={ev.summary} /></p>

      <section>
        <h3>{t('when', lang)}</h3>
        <p>
          {ev.when.from === ev.when.to ? '' : t('from', lang)}{range(ev.when.from, ev.when.to)}{comma}{certaintyText(ev.when.certainty, lang)}.
          <span class="muted">{t('basis', lang)} <Txt m={ev.when.basis} /></span>
        </p>
        {#if ev.when.core}
          <p class="core-note">
            <span class="core-swatch" style:background={lane?.color}></span>
            <span>
              {coreText(range(ev.when.core.from, ev.when.core.to), spanYears(ev.when.core.from, ev.when.core.to), lang)}
              <Txt m={ev.when.core.basis} />
            </span>
          </p>
        {/if}
        {#if ev.when.certainty === 'reckoned'}
          <p class="reckoned-note">{t('reckonedNote', lang)}</p>
        {/if}
        {#if ev.when.alternatives?.length}
          <p class="sub">{t('otherDatings', lang)}</p>
          <ul>
            {#each ev.when.alternatives as alt, i (i)}
              <li>{range(alt.from, alt.to)}: <Txt m={alt.basis} /> <Cite refs={alt.sources} /></li>
            {/each}
          </ul>
        {/if}
      </section>

      <section>
        <h3>{t('where', lang)}</h3>
        {#if ev.place.description}<p><Txt m={ev.place.description} /></p>{/if}
        {#if ev.place.names?.length}
          <p class="names">
            {#each ev.place.names as n, i (i)}
              <span
                ><strong><bdi>{n.name}</bdi></strong>
                <span class="muted">({nameTypeText(n.type, lang)}{n.language ? `${comma}${languageNameText(n.language, lang)}` : ''})</span></span
              >{i < ev.place.names.length - 1 ? ' · ' : ''}
            {/each}
          </p>
        {/if}
        {#if ev.place.opinions?.length}
          <p class="sub">{t('proposedLocations', lang)}</p>
          <ul>
            {#each ev.place.opinions as op, i (i)}
              <li><Txt m={op.name} />{op.geometry ? '' : t('notMapped', lang)} <Cite refs={op.sources} /></li>
            {/each}
          </ul>
        {/if}
      </section>

      {#if ev.quran?.length}
        <section class="layer quran">
          <h3>{t('quran', lang)}</h3>
          {#each ev.quran as ref (ref)}
            <div class="ref">
              <button type="button" class="ref-toggle" aria-expanded={expanded[ref]} onclick={() => (expanded[ref] = !expanded[ref])}>
                {expanded[ref] ? '▾' : lang === 'ar' ? '◂' : '▸'} <bdi dir="ltr">{ref.replace('-', '–')}</bdi> {surahName(ref)}
                {#if !expanded[ref]}<span class="muted">({versesText(verseCount(ref), lang)})</span>{/if}
              </button>
              <a class="reader-link" href={href({ view: 'quran', surah: parseRef(ref)?.surah, ayah: parseRef(ref)?.from })}>{t('openInReader', lang)}</a>
              {#if expanded[ref]}<VerseText {ref} />{/if}
            </div>
          {/each}
          <p class="credit">
            {t('quranCredit', lang)} <a href="https://tanzil.net" target="_blank" rel="noopener">{lang === 'ar' ? 'مشروع تنزيل (Tanzil)' : 'Tanzil'}</a>
            {t('quranCreditScript', lang)}
          </p>
        </section>
      {/if}

      {#if ev.tafsir?.length}
        <section class="layer">
          <h3>{t('tafsir', lang)}</h3>
          {#each ev.tafsir as tf, i (i)}
            <blockquote>
              {@render wording(tf.text, tf.original)}
              <footer><Cite refs={tf.source ? [tf.source] : undefined} /></footer>
            </blockquote>
          {/each}
        </section>
      {/if}

      {#if ev.tradition?.length}
        <section class="layer tradition">
          <h3>{t('tradition', lang)} <span class="interp">{t('traditionSub', lang)}</span></h3>
          {#if lang === 'ar'}<p class="muted small">{t('projectWordsNote', lang)}</p>{/if}
          <ul class="reports">
            {#each ev.tradition as tr, i (i)}
              <li>
                <span class="badge kind-{tr.kind}">{traditionKindText(tr.kind, lang)}</span>
                <span class="attribution"><Txt m={tr.attribution} /></span>
                {@render wording(tr.text, tr.original)}
                {#if tr.kind === 'ahl-al-kitab'}<p class="ahl-note">{t('ahlKitabNote', lang)}</p>{/if}
                <p class="report-meta">
                  <Cite refs={tr.source ? [tr.source] : undefined} />
                </p>
                {#if tr.gradings?.length}
                  <ul class="gradings">
                    {#each tr.gradings as g, j (j)}
                      <li>
                        <span class="badge grade-{g.grade}">{gradeText(g.grade, lang)}</span>
                        <strong><Txt m={g.by} /></strong>{#if g.note}: <Txt m={g.note} />{/if}
                        {#if g.source}<Cite refs={[g.source]} />{/if}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if ev.history?.length}
        <section class="layer">
          <h3>{t('history', lang)}</h3>
          <ul class="claims">
            {#each ev.history as h, i (i)}
              <li>
                <span class="badge claim-{h.status}">{claimStatusText(h.status, lang)}</span>
                <Txt m={h.claim} />
                <Cite refs={h.sources} />
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if ev.connection}
        <section class="layer connection">
          <h3>
            {t('connection', lang)} <span class="interp">{t('interpretation', lang)}</span>
            {#if ev.connection.confidence}
              <span class="badge conf-{ev.connection.confidence}">{confidenceText(ev.connection.confidence, lang)}</span>
            {:else}
              <span class="badge">{t('confidenceNotSet', lang)}</span>
            {/if}
          </h3>
          <p><Txt m={ev.connection.text} /></p>
          <p class="muted small">{t('connectionNote', lang)}</p>
        </section>
      {/if}

      {#if ev.related?.length}
        <section>
          <h3>{t('related', lang)}</h3>
          <ul class="related">
            {#each ev.related as r (r.id)}
              {@const other = app.eventsById.get(r.id)}
              <li>
                <span class="rel-type">{relationText(r.type, lang)}</span>
                <a href={href({ view: 'explore', eventId: r.id })}>{#if other}<Txt m={other.title} />{:else}{r.id}{/if}</a>
                {#if other}<span class="muted">{range(other.when.from, other.when.to)}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if cited.length}
        <section>
          <h3>{t('sources', lang)}</h3>
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
    padding: 14px 18px 30px;
    background: var(--panel);
  }
  .intro h2 {
    margin-top: 4px;
  }
  .draft-note,
  .draft-banner {
    background: #fff6e0;
    border: 1px solid #ecd28c;
    color: #6b4f00;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
  }
  .draft-banner {
    margin-bottom: 10px;
  }
  header {
    position: relative;
  }
  h2 {
    margin: 0 0 2px;
    font-size: 21px;
  }
  .title-ar {
    font-family: var(--font-ar);
    font-size: 20px;
    margin: 0 0 6px;
    color: #444;
    text-align: start;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    margin: 4px 0 8px;
  }
  .edit-link {
    position: absolute;
    top: 2px;
    inset-inline-end: 0;
    font-size: 13px;
  }
  .lane-chip {
    border-inline-start: 4px solid;
    padding-inline-start: 6px;
    font-weight: 600;
  }
  .badge {
    font-size: 11px;
    border-radius: 10px;
    padding: 1px 8px;
    background: #eee;
    color: #333;
    white-space: nowrap;
  }
  .certainty-established,
  .claim-established,
  .loc-known {
    background: #e3f1e6;
    color: #1d5b2c;
  }
  .certainty-traditional {
    background: #eae6f5;
    color: #4b3a80;
  }
  .certainty-debated,
  .claim-debated,
  .loc-proposed {
    background: #fdf0e0;
    color: #8a4b00;
  }
  .certainty-unknown,
  .loc-unknown {
    background: #eee;
    color: #555;
  }
  .conf-high {
    background: #e3f1e6;
    color: #1d5b2c;
  }
  .conf-medium {
    background: #fdf6dc;
    color: #7a5d00;
  }
  .conf-low {
    background: #fbe7e7;
    color: #8a1f1f;
  }
  .summary {
    font-size: 15px;
  }
  section {
    margin-top: 14px;
  }
  h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #555;
    margin: 0 0 6px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .layer {
    border-inline-start: 3px solid var(--line);
    padding-inline-start: 12px;
  }
  .layer.quran {
    border-color: #1f6f5c;
  }
  .layer.tradition {
    border-color: #a07a2c;
  }
  .reports {
    list-style: none;
    padding: 0;
  }
  .reports > li {
    margin-bottom: 10px;
  }
  .attribution {
    font-size: 13px;
    font-weight: 600;
    margin-inline-start: 4px;
  }
  .report-text {
    margin: 2px 0;
  }
  .report-ar {
    margin: 2px 0;
    color: #333;
  }
  .report-meta {
    margin: 0;
  }
  .gradings {
    list-style: none;
    padding: 0;
    margin: 2px 0 0;
    font-size: 13px;
  }
  .gradings li {
    margin: 2px 0;
  }
  .kind-hadith {
    background: #e7f0ec;
    color: #1f5c4c;
  }
  .kind-athar {
    background: #eef0e2;
    color: #4e5a1f;
  }
  .kind-historian {
    background: #f4ece0;
    color: #6b4a14;
  }
  .kind-ahl-al-kitab {
    background: #eceaf3;
    color: #4b3a80;
  }
  .grade-sahih,
  .grade-hasan {
    background: #e3f1e6;
    color: #1d5b2c;
  }
  .grade-daif {
    background: #fdf0e0;
    color: #8a4b00;
  }
  .grade-very-weak,
  .grade-fabricated {
    background: #fbe7e7;
    color: #8a1f1f;
  }
  .certainty-reckoned {
    background: #f1ece2;
    color: #6b5530;
  }
  .core-note {
    font-size: 12px;
    color: #333;
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
  .core-swatch {
    display: inline-block;
    width: 18px;
    height: 8px;
    border-radius: 2px;
    opacity: 0.75;
    flex: none;
  }
  .reckoned-note {
    font-size: 12px;
    color: #6b5530;
    background: #f8f4ec;
    border-radius: 4px;
    padding: 4px 8px;
  }
  .layer.connection {
    border-color: #8e5572;
    background: #fbf7fa;
    padding-block: 8px;
  }
  .interp {
    text-transform: none;
    letter-spacing: 0;
    font-style: italic;
    color: #8e5572;
    font-weight: 400;
  }
  .ref {
    margin-bottom: 8px;
  }
  .ref-toggle {
    background: none;
    border: none;
    padding: 0;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
  }
  .reader-link {
    font-size: 12px;
    margin-inline-start: 8px;
  }
  .credit {
    font-size: 11px;
    color: var(--muted);
  }
  blockquote {
    margin: 0 0 8px;
  }
  .ar {
    font-family: var(--font-ar);
    font-size: 17px;
  }
  .claims li {
    margin-bottom: 6px;
  }
  ul {
    padding-inline-start: 18px;
    margin: 4px 0;
  }
  ul.related,
  ul.claims {
    list-style: none;
    padding: 0;
  }
  .related li {
    margin-bottom: 4px;
  }
  .rel-type {
    display: inline-block;
    min-width: 92px;
    font-size: 12px;
    color: var(--muted);
  }
  .sources {
    font-size: 13px;
    padding-inline-start: 22px;
  }
  .sub {
    margin: 6px 0 0;
    font-size: 13px;
    color: #555;
  }
  .names {
    font-size: 13px;
  }
  .notes {
    background: #f4f6f8;
    border: 1px dashed #b8c2cc;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
  }
  .small {
    font-size: 12px;
  }
  .ahl-note {
    margin: 2px 0;
    font-size: 12px;
    color: #4b3a80;
    font-style: italic;
  }
  .facts:lang(ar) .ahl-note {
    font-size: 13px;
    font-style: normal;
  }
  .title-en {
    font-size: 14px;
    color: #555;
    margin: 0 0 6px;
  }
  .wording-label {
    font-size: 11px;
    color: var(--muted);
    margin: 6px 0 0;
  }
  .original {
    font-family: var(--font-ar);
    font-size: 17px;
    line-height: 1.8;
    margin: 0 0 2px;
    color: #333;
  }
  /* Arabic reading: Naskh needs more size and line height than Latin text, and Arabic letters must not be spaced apart. */
  .facts:lang(ar) {
    font-size: 16px;
    line-height: 1.8;
  }
  .facts:lang(ar) h2 {
    font-size: 24px;
  }
  .facts:lang(ar) h3 {
    font-size: 15px;
    letter-spacing: 0;
  }
  .facts:lang(ar) .summary {
    font-size: 17px;
  }
  .facts:lang(ar) .interp {
    font-style: normal;
  }
  .facts:lang(ar) .badge,
  .facts:lang(ar) .wording-label,
  .facts:lang(ar) .sub,
  .facts:lang(ar) .names,
  .facts:lang(ar) .gradings,
  .facts:lang(ar) .core-note,
  .facts:lang(ar) .reckoned-note {
    font-size: 13px;
  }
  .facts:lang(ar) .attribution {
    font-size: 15px;
  }
</style>
