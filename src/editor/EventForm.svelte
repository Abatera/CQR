<script lang="ts">
  import { onDestroy } from 'svelte';
  import { GRADE_LABEL, slugify, TRADITION_KIND_LABEL } from '../lib/format';
  import {
    CERTAINTIES,
    CLAIM_STATUSES,
    CONFIDENCES,
    EVENT_KINDS,
    GRADES,
    LOCATION_STATUSES,
    TRADITION_KINDS,
    NAME_TYPES,
    RELATION_TYPES,
    REVIEW_STATES,
    type CqrEvent,
  } from '../lib/schema';
  import { formatRange } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { href } from '../state/route';
  import { provideErrors } from './errors';
  import FieldError from './fields/FieldError.svelte';
  import GeometryField from './fields/GeometryField.svelte';
  import LangField from './fields/LangField.svelte';
  import QuranRefs from './fields/QuranRefs.svelte';
  import RowTools from './fields/RowTools.svelte';
  import SourceRefs from './fields/SourceRefs.svelte';
  import YearField from './fields/YearField.svelte';
  import FormFooter from './FormFooter.svelte';
  import { FormRunner } from './form-runner.svelte';
  import { eventFromForm, eventToForm } from './model';

  let { initial, onsaved, ondeleted }: { initial?: CqrEvent; onsaved?: (id: string) => void; ondeleted?: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const runner = new FormRunner('events', eventToForm(initial), eventFromForm, !initial);
  const m = $derived(runner.model);
  provideErrors(() => runner.errors);

  // The form is re-created for each item, so reading the starting value once is intended.
  // svelte-ignore state_referenced_locally
  let idTouched = $state(!!initial);
  $effect(() => {
    if (!idTouched) m.id = slugify(m.title.en);
  });

  $effect(() => {
    app.editorDirty = runner.dirty;
  });
  onDestroy(() => (app.editorDirty = false));

  const lanes = $derived(app.lanes);
  const otherEvents = $derived((app.content?.events ?? []).filter((e) => e.id !== m.id).sort((a, b) => a.title.en.localeCompare(b.title.en)));
  const savedIssues = $derived(initial ? (app.content?.issues ?? []).filter((i) => i.collection === 'events' && i.id === initial.id) : []);

  const CERTAINTY_HELP: Record<string, string> = {
    established: 'firmly dated by evidence',
    estimated: 'approximate, from evidence',
    traditional: 'from a religious or traditional chronology',
    reckoned: 'years computed from intervals reported in tradition (before history can date anything)',
    debated: 'scholars disagree',
    unknown: 'no defensible date',
  };
  const STATUS_HELP: Record<string, string> = {
    known: 'shown with a marker or area',
    proposed: 'disputed: shown as shaded areas, with each opinion and its source',
    unknown: 'described, not pinned: nothing on the map',
  };
</script>

<div class="form event-form">
  <div class="title-row">
    <h2>{initial ? initial.title.en : 'New event'}</h2>
    {#if initial}<a href={href({ view: 'explore', eventId: initial.id })}>View on the timeline →</a>{/if}
  </div>

  {#if savedIssues.length}
    <div class="saved-issues">
      <strong>Open items for review ({savedIssues.length}):</strong>
      <ul>
        {#each savedIssues as i, n (n)}<li><code>{i.path}</code> {i.message}</li>{/each}
      </ul>
    </div>
  {/if}

  <fieldset>
    <legend>Basics</legend>
    <LangField label="Title" bind:value={m.title} path="title" required />
    <div class="grid4">
      <label class="field">
        <span class="label">ID *</span>
        <input type="text" bind:value={m.id} disabled={!!initial} oninput={() => (idTouched = true)} />
        <span class="hint">File name and URL.{initial ? ' Cannot be changed.' : ''}</span>
        <FieldError path="id" />
      </label>
      <label class="field">
        <span class="label">Lane *</span>
        <select bind:value={m.lane}>
          <option value="">Choose…</option>
          {#each lanes as l (l.id)}<option value={l.id}>{l.name.en}</option>{/each}
        </select>
        <FieldError path="lane" />
      </label>
      <label class="field">
        <span class="label">Kind</span>
        <select bind:value={m.kind}>
          {#each EVENT_KINDS as k (k)}<option value={k}>{k === 'event' ? 'event (dot or short bar)' : 'period (long bar: dynasty, empire)'}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="label">Review</span>
        <select bind:value={m.review}>
          {#each REVIEW_STATES as r (r)}<option value={r}>{r}</option>{/each}
        </select>
        <span class="hint">"reviewed" requires every claim to be sourced.</span>
      </label>
    </div>
    <LangField label="Summary" bind:value={m.summary} path="summary" multiline required hint="One or two sentences, shown at the top of the facts panel." />
  </fieldset>

  <fieldset>
    <legend>When</legend>
    <div class="grid4">
      <YearField label="From *" bind:value={m.when.from} path="when.from" />
      <YearField label="To *" bind:value={m.when.to} path="when.to" />
      <label class="field span2">
        <span class="label">Certainty</span>
        <select bind:value={m.when.certainty}>
          {#each CERTAINTIES as c (c)}<option value={c}>{c}: {CERTAINTY_HELP[c]}</option>{/each}
        </select>
      </label>
    </div>
    {#if m.when.from !== undefined && m.when.to !== undefined && m.when.from !== 0 && m.when.to !== 0}
      <p class="hint">Shown as {formatRange(m.when.from, m.when.to)}. For a single year, use the same year twice.</p>
    {/if}
    <LangField label="Basis" bind:value={m.when.basis} path="when.basis" required hint='What the date rests on, e.g. "traditional biblical chronology" or "radiocarbon dating of slag layers".' />

    <label class="check">
      <input type="checkbox" bind:checked={m.when.hasCore} />
      A source fixes part of this span (drawn solid inside the bar), e.g. Noah's 950 years among his people
    </label>
    {#if m.when.hasCore}
      <div class="card">
        <div class="grid4">
          <YearField label="Certain part from *" bind:value={m.when.core.from} path="when.core.from" />
          <YearField label="Certain part to *" bind:value={m.when.core.to} path="when.core.to" />
        </div>
        <LangField label="What fixes it" bind:value={m.when.core.basis} path="when.core.basis" required hint="e.g. The Quran gives 950 years among his people (29:14)." />
        <FieldError path="when.core" exact />
      </div>
    {/if}

    <div class="subhead">Reckoning chain (optional)</div>
    <p class="hint">
      For a reckoned date: the steps from an anchor (e.g. Abraham's birth) to this entry's own years, each with how it is counted and its
      source, e.g. "350 years earlier (Ibn Sa'd)". Shown as a chain in the facts panel; the basis above stays the full explanation.
    </p>
    {#each m.when.chain as step, i (i)}
      <div class="card">
        <div class="card-head">Step {i + 1} <RowTools bind:list={m.when.chain} index={i} label="step" /></div>
        {#if i > 0}
          <LangField label="How it is counted from the step before" bind:value={step.gap} path="when.chain[{i}].gap" hint="e.g. 350 years earlier (Ibn Sa'd)" />
        {/if}
        <div class="grid4">
          <div class="span2"><LangField label="What happens" bind:value={step.label} path="when.chain[{i}].label" required hint="e.g. Noah dies" /></div>
          <YearField label="Year *" bind:value={step.year} path="when.chain[{i}].year" />
        </div>
      </div>
    {/each}
    <FieldError path="when.chain" exact />
    <button type="button" class="small" onclick={() => m.when.chain.push({ label: { en: '', ar: '' }, year: undefined, gap: { en: '', ar: '' } })}>+ Add a step</button>

    <div class="subhead">Other datings (when scholars disagree)</div>
    {#each m.when.alternatives as alt, i (i)}
      <div class="card">
        <div class="card-head">Alternative {i + 1} <RowTools bind:list={m.when.alternatives} index={i} label="alternative" /></div>
        <div class="grid4">
          <YearField label="From" bind:value={alt.from} path="when.alternatives[{i}].from" />
          <YearField label="To" bind:value={alt.to} path="when.alternatives[{i}].to" />
        </div>
        <LangField label="Basis" bind:value={alt.basis} path="when.alternatives[{i}].basis" required />
        <SourceRefs bind:value={alt.sources} path="when.alternatives[{i}].sources" />
      </div>
    {/each}
    <button type="button" class="small" onclick={() => m.when.alternatives.push({ from: undefined, to: undefined, basis: { en: '', ar: '' }, sources: [] })}>+ Add an alternative dating</button>
  </fieldset>

  <fieldset>
    <legend>Where</legend>
    <label class="field">
      <span class="label">Location status</span>
      <select bind:value={m.place.status}>
        {#each LOCATION_STATUSES as s (s)}<option value={s}>{s}: {STATUS_HELP[s]}</option>{/each}
      </select>
    </label>
    <LangField
      label="Description"
      bind:value={m.place.description}
      path="place.description"
      multiline
      required={m.place.status === 'unknown'}
      hint={m.place.status === 'unknown' ? 'Say what the text tells us about the place.' : ''}
    />

    {#if m.place.status !== 'unknown'}
      <GeometryField bind:value={m.place.geometry} path="place.geometry" label={m.place.status === 'proposed' ? 'Proposed area (optional if you list opinions)' : 'Location *'} />
    {/if}

    <div class="subhead">Names (ancient and modern)</div>
    {#each m.place.names as n, i (i)}
      <div class="row">
        <input type="text" bind:value={n.name} placeholder="Name" aria-label="Name" dir="auto" />
        <select bind:value={n.type} aria-label="Ancient or modern">
          {#each NAME_TYPES as t (t)}<option value={t}>{t}</option>{/each}
        </select>
        <input type="text" bind:value={n.language} placeholder="Language (optional)" aria-label="Language" />
        <RowTools bind:list={m.place.names} index={i} label="name" />
      </div>
      <FieldError path="place.names[{i}]" />
    {/each}
    <button type="button" class="small" onclick={() => m.place.names.push({ name: '', type: 'ancient', language: '' })}>+ Add a name</button>

    {#if m.place.status === 'proposed'}
      <div class="subhead">Opinions on the location</div>
      {#each m.place.opinions as op, i (i)}
        <div class="card">
          <div class="card-head">Opinion {i + 1} <RowTools bind:list={m.place.opinions} index={i} label="opinion" /></div>
          <LangField label="Name of the proposed place" bind:value={op.name} path="place.opinions[{i}].name" required />
          <GeometryField bind:value={op.geometry} path="place.opinions[{i}].geometry" label="Area or point (optional)" />
          <SourceRefs bind:value={op.sources} path="place.opinions[{i}].sources" label="Who proposes it" />
        </div>
      {/each}
      <button type="button" class="small" onclick={() => m.place.opinions.push({ name: { en: '', ar: '' }, geometry: undefined, sources: [] })}>+ Add an opinion</button>
    {/if}
    <FieldError path="place.opinions" exact />
  </fieldset>

  <fieldset>
    <legend>Quran</legend>
    <QuranRefs bind:value={m.quran} path="quran" />
  </fieldset>

  <fieldset>
    <legend>Tafsir</legend>
    <p class="hint">What classical commentators said. Name the commentator and the work, and where in it (volume and page, or the verse).</p>
    {#each m.tafsir as t, i (i)}
      <div class="card">
        <div class="card-head">Commentary {i + 1} <RowTools bind:list={m.tafsir} index={i} label="commentary" /></div>
        <LangField label="What it says (the project's words)" bind:value={t.text} path="tafsir[{i}].text" multiline required />
        <label class="field">
          <span class="label">In the commentator's own words (optional)</span>
          <textarea rows="2" bind:value={t.original} dir="rtl" lang="ar" placeholder="نص المصدر بلفظه"></textarea>
          <span class="hint">Copied exactly from the cited work, as it was read there. Never from memory.</span>
        </label>
        <SourceRefs bind:value={t.source} path="tafsir[{i}].source" label="Commentator and work" max={1} />
      </div>
    {/each}
    <button type="button" class="small" onclick={() => m.tafsir.push({ text: { en: '', ar: '' }, original: '', source: [] })}>+ Add a commentary</button>
  </fieldset>

  <fieldset>
    <legend>Tradition</legend>
    <p class="hint">
      Hadith, reports from the Companions and Successors, and the classical historians. Give who it is attributed to, the work it is
      found in, and for a hadith or report its grading with the scholar who gave it. "What it says" is the project's own summary or
      translation, in English and Arabic; the report's own wording goes in its own field, quoted from the cited work.
    </p>
    {#each m.tradition as t, i (i)}
      <div class="card">
        <div class="card-head">
          Report {i + 1}
          <select bind:value={t.kind} aria-label="Kind of report">
            {#each TRADITION_KINDS as k (k)}<option value={k}>{TRADITION_KIND_LABEL[k]}</option>{/each}
          </select>
          <RowTools bind:list={m.tradition} index={i} label="report" />
        </div>
        <LangField label="Attributed to" bind:value={t.attribution} path="tradition[{i}].attribution" required hint="e.g. The Prophet ﷺ, narrated by Abu Umama al-Bahili; or Ibn Kathir" />
        <LangField label="What it says (the project's words)" bind:value={t.text} path="tradition[{i}].text" multiline required />
        <label class="field">
          <span class="label">In the report's own words (optional)</span>
          <textarea rows="2" bind:value={t.original} dir="rtl" lang="ar" placeholder="نص الرواية بلفظها"></textarea>
          <span class="hint">Copied exactly from the cited work, as it was read there. Never from memory: hadith wording is never written by hand.</span>
        </label>
        <SourceRefs bind:value={t.source} path="tradition[{i}].source" label="Found in (work and place in it)" max={1} />
        <div class="subhead">Gradings</div>
        {#each t.gradings as g, j (j)}
          <div class="grading">
            <select bind:value={g.grade} aria-label="Grade">
              {#each GRADES as gr (gr)}<option value={gr}>{GRADE_LABEL[gr]}</option>{/each}
            </select>
            <RowTools bind:list={t.gradings} index={j} label="grading" />
          </div>
          <LangField label="Graded by" bind:value={g.by} path="tradition[{i}].gradings[{j}].by" required hint="e.g. al-Albani / الألباني" />
          <LangField label="The grading in the scholar's words, or a note" bind:value={g.note} path="tradition[{i}].gradings[{j}].note" />
          <SourceRefs bind:value={g.source} path="tradition[{i}].gradings[{j}].source" label="Where the grading is given" max={1} />
          <FieldError path="tradition[{i}].gradings[{j}]" />
        {/each}
        <FieldError path="tradition[{i}].gradings" exact />
        <button type="button" class="small" onclick={() => t.gradings.push({ grade: 'sahih', by: { en: '', ar: '' }, source: [], note: { en: '', ar: '' } })}>+ Add a grading</button>
      </div>
    {/each}
    <button
      type="button"
      class="small"
      onclick={() => m.tradition.push({ kind: 'hadith', attribution: { en: '', ar: '' }, text: { en: '', ar: '' }, original: '', source: [], gradings: [] })}
      >+ Add a report</button
    >
  </fieldset>

  <fieldset>
    <legend>History and archaeology</legend>
    <p class="hint">What is known from outside the Quran. Each claim needs at least one source and a status.</p>
    {#each m.history as h, i (i)}
      <div class="card">
        <div class="card-head">
          Claim {i + 1}
          <select bind:value={h.status} aria-label="Status">
            {#each CLAIM_STATUSES as s (s)}<option value={s}>{s}</option>{/each}
          </select>
          <RowTools bind:list={m.history} index={i} label="claim" />
        </div>
        <LangField label="Claim" bind:value={h.claim} path="history[{i}].claim" multiline required />
        <SourceRefs bind:value={h.sources} path="history[{i}].sources" />
      </div>
    {/each}
    <button type="button" class="small" onclick={() => m.history.push({ claim: { en: '', ar: '' }, status: 'established', sources: [] })}>+ Add a claim</button>
  </fieldset>

  <fieldset class="connection">
    <legend>Connection (interpretation)</legend>
    <p class="hint">The project's own reflection linking the layers above. It is always labeled as interpretation and never stated as fact.</p>
    <LangField label="Connection" bind:value={m.connection.text} path="connection.text" multiline />
    <label class="field">
      <span class="label">Confidence (set by the owner)</span>
      <select bind:value={m.connection.confidence}>
        <option value="">not set yet</option>
        {#each CONFIDENCES as c (c)}<option value={c}>{c}</option>{/each}
      </select>
      <FieldError path="connection.confidence" />
    </label>
  </fieldset>

  <fieldset>
    <legend>Related events</legend>
    {#each m.related as r, i (i)}
      <div class="row">
        <select bind:value={r.id} aria-label="Event">
          <option value="">Choose an event…</option>
          {#each otherEvents as e (e.id)}<option value={e.id}>{e.title.en} ({formatRange(e.when.from, e.when.to)})</option>{/each}
        </select>
        <select bind:value={r.type} aria-label="Relation">
          {#each RELATION_TYPES as t (t)}<option value={t}>{t}</option>{/each}
        </select>
        <RowTools bind:list={m.related} index={i} label="relation" />
      </div>
      <FieldError path="related[{i}]" />
    {/each}
    <button type="button" class="small" onclick={() => m.related.push({ id: '', type: 'context' })}>+ Add a related event</button>
    <p class="hint">context: background to this event · consequence: what it led to · parallel: something comparable elsewhere.</p>
  </fieldset>

  <fieldset>
    <legend>Tags and notes</legend>
    <label class="field">
      <span class="label">Tags</span>
      <input type="text" bind:value={m.tags} placeholder="metallurgy, david" />
      <span class="hint">Separate with commas.</span>
    </label>
    <label class="field">
      <span class="label">Editorial notes (not shown to readers)</span>
      <textarea rows="3" bind:value={m.notes} placeholder="Open questions, things to verify"></textarea>
    </label>
  </fieldset>

  <FormFooter
    busy={runner.busy}
    dirty={runner.dirty}
    message={runner.message}
    errors={runner.errors}
    isNew={runner.isNew}
    onsave={async () => {
      const id = await runner.save();
      if (id) onsaved?.(id);
    }}
    ondelete={initial
      ? async () => {
          if (await runner.remove(initial.id, 'event')) ondeleted?.();
        }
      : undefined}
  />
</div>

<style>
  .title-row {
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  .saved-issues {
    background: #fff6e0;
    border: 1px solid #ecd28c;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
  }
  .saved-issues ul {
    margin: 4px 0 0;
    padding-inline-start: 18px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px;
  }
  .row input,
  .row select {
    flex: 1;
    min-width: 0;
  }
  .connection {
    background: #fbf7fa;
  }
  .grading {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-top: 6px;
  }
</style>
