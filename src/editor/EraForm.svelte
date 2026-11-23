<script lang="ts">
  import { onDestroy } from 'svelte';
  import { slugify } from '../lib/format';
  import { REVIEW_STATES, type Era } from '../lib/schema';
  import { app } from '../state/app.svelte';
  import { provideErrors } from './errors';
  import FieldError from './fields/FieldError.svelte';
  import LangField from './fields/LangField.svelte';
  import SourceRefs from './fields/SourceRefs.svelte';
  import YearField from './fields/YearField.svelte';
  import FormFooter from './FormFooter.svelte';
  import { FormRunner } from './form-runner.svelte';
  import { eraFromForm, eraToForm } from './model';

  let { initial, onsaved, ondeleted }: { initial?: Era; onsaved?: (id: string) => void; ondeleted?: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const runner = new FormRunner('eras', eraToForm(initial), eraFromForm, !initial);
  const m = $derived(runner.model);
  provideErrors(() => runner.errors);

  // The form is re-created for each item, so reading the starting value once is intended.
  // svelte-ignore state_referenced_locally
  let idTouched = $state(!!initial);
  $effect(() => {
    if (!idTouched) m.id = slugify(m.name.en);
  });

  $effect(() => {
    app.editorDirty = runner.dirty;
  });
  onDestroy(() => (app.editorDirty = false));
</script>

<div class="form">
  <h2>{initial ? `Era: ${initial.name.en}` : 'New era'}</h2>
  <p class="hint">
    Eras are the shaded background bands of the timeline, such as archaeological periods. Their names are specific to regions, so
    say where they apply.
  </p>

  <LangField label="Name" bind:value={m.name} path="name" required />

  <div class="grid4">
    <label class="field">
      <span class="label">ID *</span>
      <input type="text" bind:value={m.id} disabled={!!initial} oninput={() => (idTouched = true)} />
      <FieldError path="id" />
    </label>
    <YearField label="From *" bind:value={m.from} path="from" />
    <YearField label="To *" bind:value={m.to} path="to" />
    <label class="field">
      <span class="label">Review</span>
      <select bind:value={m.review}>
        {#each REVIEW_STATES as r (r)}<option value={r}>{r}</option>{/each}
      </select>
    </label>
  </div>

  <LangField label="Region where these names apply" bind:value={m.region} path="region" hint="e.g. Southern Levant" />

  <div class="field">
    <label class="check"><input type="checkbox" bind:checked={m.useColor} /> Use a custom color</label>
    {#if m.useColor}<input type="color" bind:value={m.color} />{/if}
    <FieldError path="color" />
  </div>

  <SourceRefs bind:value={m.sources} path="sources" label="Sources for the dates" />

  <label class="field">
    <span class="label">Notes (for contributors)</span>
    <textarea rows="2" bind:value={m.notes}></textarea>
  </label>

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
          if (await runner.remove(initial.id, 'era')) ondeleted?.();
        }
      : undefined}
  />
</div>
