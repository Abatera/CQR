<script lang="ts">
  import { certaintyLabel, fullCite, GRADE_LABEL, locationLabel, TRADITION_KIND_LABEL } from '../lib/format';
  import { parseRef } from '../lib/quran-ref';
  import { refId, type CqrEvent, type SourceRef } from '../lib/schema';
  import { formatRange } from '../lib/years';
  import VerseText from '../quran/VerseText.svelte';
  import { app, CAN_EDIT } from '../state/app.svelte';
  import { href } from '../state/route';
  import Cite from './Cite.svelte';

  const ev = $derived(app.selected);

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
    return s ? s.tname : '';
  }

  let expanded = $state<Record<string, boolean>>({});
  $effect(() => {
    // Reset when the selection changes; short passages open by default.
    const e = ev;
    expanded = Object.fromEntries((e?.quran ?? []).map((r) => [r, verseCount(r) <= 5]));
  });

  const RELATION_LABEL: Record<string, string> = {
    context: 'Context',
    consequence: 'Consequence',
    parallel: 'Parallel',
  };
</script>

<section class="facts" aria-label="Facts">
  {#if !ev}
    <div class="intro">
      <h2>Chronotope of Quranic Reality</h2>
      <p>
        Events narrated in the Quran, placed on a timeline and a map next to what history and archaeology know about the same
        periods and places.
      </p>
      <p>Select an event on the timeline or the map to see its facts here. Use the arrow keys to step through events.</p>
      <p class="muted">
        Each entry keeps five layers apart: the Quran text, what classical commentators said, what hadith and the classical
        historians report (with their gradings), what history and archaeology know, and the project's own connection between
        them, which is always labeled as interpretation.
      </p>
      {#if app.content?.events.some((e) => e.review === 'draft')}
        <p class="draft-note">
          The entries are drafts. Their claims, dates and sources are still being checked and must not be relied on yet.
        </p>
      {/if}
    </div>
  {:else}
    {@const lane = app.lanesById.get(ev.lane)}
    {@const cited = citedSources(ev)}
    <article>
      {#if ev.review === 'draft'}
        <div class="draft-banner">Draft: not yet reviewed. Its claims and sources are still being checked.</div>
      {/if}

      <header>
        <h2>{ev.title.en}</h2>
        {#if ev.title.ar}<p class="title-ar" dir="rtl" lang="ar">{ev.title.ar}</p>{/if}
        <p class="meta">
          <span class="lane-chip" style:border-color={lane?.color}>{lane?.name.en ?? ev.lane}</span>
          <span>{formatRange(ev.when.from, ev.when.to)}</span>
          <span class="badge certainty-{ev.when.certainty}">{certaintyLabel(ev.when.certainty)}</span>
          <span class="badge loc-{ev.place.status}">{locationLabel(ev.place.status)}</span>
        </p>
        {#if CAN_EDIT}
          <a class="edit-link" href={href({ view: 'edit', collection: 'events', id: ev.id })}>Edit</a>
        {/if}
      </header>

      <p class="summary">{ev.summary.en}</p>

      <section>
        <h3>When</h3>
        <p>
          {ev.when.from === ev.when.to ? '' : 'From '}{formatRange(ev.when.from, ev.when.to)}, {certaintyLabel(ev.when.certainty)}.
          <span class="muted">Basis: {ev.when.basis.en}</span>
        </p>
        {#if ev.when.certainty === 'reckoned'}
          <p class="reckoned-note">
            These years are a reckoning from intervals reported in tradition, not a historical date. History and archaeology
            cannot date this period.
          </p>
        {/if}
        {#if ev.when.alternatives?.length}
          <p class="sub">Other datings:</p>
          <ul>
            {#each ev.when.alternatives as alt, i (i)}
              <li>{formatRange(alt.from, alt.to)}: {alt.basis.en} <Cite refs={alt.sources} /></li>
            {/each}
          </ul>
        {/if}
      </section>

      <section>
        <h3>Where</h3>
        {#if ev.place.description}<p>{ev.place.description.en}</p>{/if}
        {#if ev.place.names?.length}
          <p class="names">
            {#each ev.place.names as n, i (i)}
              <span><strong>{n.name}</strong> <span class="muted">({n.type}{n.language ? `, ${n.language}` : ''})</span></span>{i < ev.place.names.length - 1 ? ' · ' : ''}
            {/each}
          </p>
        {/if}
        {#if ev.place.opinions?.length}
          <p class="sub">Proposed locations:</p>
          <ul>
            {#each ev.place.opinions as op, i (i)}
              <li>{op.name.en}{op.geometry ? '' : ' (not mapped)'} <Cite refs={op.sources} /></li>
            {/each}
          </ul>
        {/if}
      </section>

      {#if ev.quran?.length}
        <section class="layer quran">
          <h3>Quran</h3>
          {#each ev.quran as ref (ref)}
            <div class="ref">
              <button type="button" class="ref-toggle" aria-expanded={expanded[ref]} onclick={() => (expanded[ref] = !expanded[ref])}>
                {expanded[ref] ? '▾' : '▸'} {ref.replace('-', '–')} {surahName(ref)}
                {#if !expanded[ref]}<span class="muted">({verseCount(ref)} verse{verseCount(ref) > 1 ? 's' : ''})</span>{/if}
              </button>
              <a class="reader-link" href={href({ view: 'quran', surah: parseRef(ref)?.surah, ayah: parseRef(ref)?.from })}>open in reader</a>
              {#if expanded[ref]}<VerseText {ref} />{/if}
            </div>
          {/each}
          <p class="credit">Text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil</a> (Hafs, Uthmani).</p>
        </section>
      {/if}

      {#if ev.tafsir?.length}
        <section class="layer">
          <h3>Tafsir</h3>
          {#each ev.tafsir as t, i (i)}
            <blockquote>
              {t.text.en}
              {#if t.text.ar}<p class="ar" dir="rtl" lang="ar">{t.text.ar}</p>{/if}
              <footer><Cite refs={t.source ? [t.source] : undefined} /></footer>
            </blockquote>
          {/each}
        </section>
      {/if}

      {#if ev.tradition?.length}
        <section class="layer tradition">
          <h3>Tradition <span class="interp">hadith and historians: reports, with their gradings</span></h3>
          <ul class="reports">
            {#each ev.tradition as t, i (i)}
              <li>
                <span class="badge kind-{t.kind}">{TRADITION_KIND_LABEL[t.kind]}</span>
                <span class="attribution">{t.attribution.en}</span>
                <p class="report-text">{t.text.en}</p>
                {#if t.text.ar}<p class="ar report-ar" dir="rtl" lang="ar">{t.text.ar}</p>{/if}
                <p class="report-meta">
                  <Cite refs={t.source ? [t.source] : undefined} />
                </p>
                {#if t.gradings?.length}
                  <ul class="gradings">
                    {#each t.gradings as g, j (j)}
                      <li>
                        <span class="badge grade-{g.grade}">{GRADE_LABEL[g.grade]}</span>
                        <strong>{g.by}</strong>{#if g.note}: {g.note.en}{/if}
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
          <h3>History and archaeology</h3>
          <ul class="claims">
            {#each ev.history as h, i (i)}
              <li>
                <span class="badge claim-{h.status}">{h.status}</span>
                {h.claim.en}
                <Cite refs={h.sources} />
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if ev.connection}
        <section class="layer connection">
          <h3>
            Connection <span class="interp">interpretation</span>
            {#if ev.connection.confidence}
              <span class="badge conf-{ev.connection.confidence}">{ev.connection.confidence} confidence</span>
            {:else}
              <span class="badge">confidence not set</span>
            {/if}
          </h3>
          <p>{ev.connection.text.en}</p>
          <p class="muted small">This is the project's own reflection, not an established fact.</p>
        </section>
      {/if}

      {#if ev.related?.length}
        <section>
          <h3>Related events</h3>
          <ul class="related">
            {#each ev.related as r (r.id)}
              {@const other = app.eventsById.get(r.id)}
              <li>
                <span class="rel-type">{RELATION_LABEL[r.type]}</span>
                <a href={href({ view: 'explore', eventId: r.id })}>{other?.title.en ?? r.id}</a>
                {#if other}<span class="muted">{formatRange(other.when.from, other.when.to)}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if cited.length}
        <section>
          <h3>Sources</h3>
          <ol class="sources">
            {#each cited as id (id)}
              {@const s = app.sourcesById.get(id)}
              <li id="src-{id}">
                {s ? fullCite(s) : `${id} (missing from sources)`}
                {#if s?.url}<a href={s.url} target="_blank" rel="noopener">link</a>{/if}
              </li>
            {/each}
          </ol>
        </section>
      {/if}

      {#if CAN_EDIT && ev.notes}
        <section class="notes">
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
</style>
