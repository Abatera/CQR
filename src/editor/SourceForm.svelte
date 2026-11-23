<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fullCite, slugify } from '../lib/format';
  import { SOURCE_TYPES, SourceSchema, type Source } from '../lib/schema';
  import { app } from '../state/app.svelte';
  import { provideErrors } from './errors';
  import FieldError from './fields/FieldError.svelte';
  import FormFooter from './FormFooter.svelte';
  import { FormRunner } from './form-runner.svelte';
  import { sourceFromForm, sourceToForm } from './model';

  let {
    initial,
    embedded = false,
    onsaved,
    ondeleted,
  }: { initial?: Source; embedded?: boolean; onsaved?: (id: string) => void; ondeleted?: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const runner = new FormRunner('sources', sourceToForm(initial), sourceFromForm, !initial);
  const m = $derived(runner.model);
  provideErrors(() => runner.errors);

  // The form is re-created for each item, so reading the starting value once is intended.
  // svelte-ignore state_referenced_locally
  let idTouched = $state(!!initial);
  $effect(() => {
    if (idTouched) return;
    const first = m.authors.split(';')[0]?.trim();
    const surname = first ? first.split(/\s+/).pop() : '';
    m.id = slugify(surname && m.year ? `${surname} ${m.year}` : m.title);
  });

  const preview = $derived.by(() => {
    const r = SourceSchema.safeParse(runner.data);
    return r.success ? fullCite(r.data) : '';
  });

  $effect(() => {
    if (!embedded) app.editorDirty = runner.dirty;
  });
  onDestroy(() => {
    if (!embedded) app.editorDirty = false;
  });

  const isWebsite = $derived(m.type === 'website');
  const hasContainer = $derived(m.type === 'article' || m.type === 'chapter');
</script>

<div class="form">
  {#if !embedded}<h2>{initial ? `Source: ${initial.id}` : 'New source'}</h2>{/if}
  <p class="hint">
    Prefer peer-reviewed scholarship and standard reference works. For tafsir, cite the edition actually consulted. Popular
    websites point the way to a source; they are not sources.
  </p>

  <div class="grid2">
    <label class="field">
      <span class="label">Type *</span>
      <select bind:value={m.type}>
        {#each SOURCE_TYPES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    <label class="field">
      <span class="label">ID *</span>
      <input type="text" bind:value={m.id} disabled={!!initial} oninput={() => (idTouched = true)} placeholder="cline-1177" />
      <span class="hint">Used to cite it. Lowercase, hyphens.{initial ? ' Cannot be changed.' : ''}</span>
      <FieldError path="id" />
    </label>
  </div>

  <label class="field">
    <span class="label">{m.type === 'tafsir' ? 'Commentator(s)' : 'Authors'}</span>
    <input type="text" bind:value={m.authors} placeholder="First Last; First Last" />
    <span class="hint">Separate names with semicolons.</span>
  </label>

  <label class="field">
    <span class="label">Title *</span>
    <input type="text" bind:value={m.title} />
    <FieldError path="title" />
  </label>
  <label class="field">
    <span class="label">Title in the original script (optional)</span>
    <input type="text" bind:value={m.title_original} dir="auto" />
  </label>

  {#if hasContainer}
    <label class="field">
      <span class="label">{m.type === 'article' ? 'Journal' : 'Book title'}</span>
      <input type="text" bind:value={m.container} />
    </label>
    {#if m.type === 'chapter'}
      <label class="field">
        <span class="label">Editors</span>
        <input type="text" bind:value={m.editors} placeholder="First Last; First Last" />
      </label>
    {/if}
  {/if}

  <div class="grid4">
    <label class="field"><span class="label">Year</span><input type="text" bind:value={m.year} placeholder="2021" /></label>
    <label class="field"><span class="label">Edition</span><input type="text" bind:value={m.edition} placeholder="Revised" /></label>
    <label class="field"><span class="label">Volume</span><input type="text" bind:value={m.volume} /></label>
    {#if m.type === 'article'}
      <label class="field"><span class="label">Issue</span><input type="text" bind:value={m.issue} /></label>
    {/if}
    <label class="field"><span class="label">Pages</span><input type="text" bind:value={m.pages} placeholder="1-25" /></label>
  </div>

  <div class="grid2">
    <label class="field"><span class="label">Publisher</span><input type="text" bind:value={m.publisher} /></label>
    <label class="field"><span class="label">Place of publication</span><input type="text" bind:value={m.place} /></label>
  </div>

  <div class="grid2">
    <label class="field"><span class="label">DOI</span><input type="text" bind:value={m.doi} placeholder="10.xxxx/xxxxx" /></label>
    <label class="field">
      <span class="label">URL</span>
      <input type="url" bind:value={m.url} placeholder="https://" />
      <FieldError path="url" />
    </label>
  </div>
  {#if isWebsite}
    <label class="field"><span class="label">Accessed on</span><input type="text" bind:value={m.accessed} placeholder="2026-11-23" /></label>
  {/if}

  <label class="field">
    <span class="label">Notes (for contributors)</span>
    <textarea rows="2" bind:value={m.notes}></textarea>
  </label>

  {#if preview}<p class="preview"><span class="label">Citation preview</span> {preview}</p>{/if}

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
    ondelete={embedded || !initial
      ? undefined
      : async () => {
          if (await runner.remove(initial.id, 'source')) ondeleted?.();
        }}
  />
</div>
