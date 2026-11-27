<script lang="ts">
  import { onDestroy } from 'svelte';
  import { slugify } from '../lib/format';
  import type { Journey } from '../lib/schema';
  import { formatRange } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { provideErrors } from './errors';
  import FieldError from './fields/FieldError.svelte';
  import LangField from './fields/LangField.svelte';
  import RowTools from './fields/RowTools.svelte';
  import FormFooter from './FormFooter.svelte';
  import { FormRunner } from './form-runner.svelte';
  import { journeyFromForm, journeyToForm } from './model';

  let { initial, onsaved, ondeleted }: { initial?: Journey; onsaved?: (id: string) => void; ondeleted?: () => void } = $props();

  const nextOrder = Math.max(0, ...(app.content?.journeys ?? []).map((j) => j.order)) + 1;
  // svelte-ignore state_referenced_locally
  const runner = new FormRunner('journeys', journeyToForm(initial, nextOrder), journeyFromForm, !initial);
  const m = $derived(runner.model);
  provideErrors(() => runner.errors);

  // The form is re-created for each item, so reading the starting value once is intended.
  // svelte-ignore state_referenced_locally
  let idTouched = $state(!!initial);
  $effect(() => {
    if (!idTouched) m.id = slugify(m.title.en);
  });

  const events = $derived(app.content?.events ?? []);

  $effect(() => {
    app.editorDirty = runner.dirty;
  });
  onDestroy(() => (app.editorDirty = false));
</script>

<div class="form">
  <h2>{initial ? `Journey: ${initial.title.en}` : 'New journey'}</h2>
  <p class="hint">
    A journey walks through events one step at a time: the map moves to each event's place and the timeline to its years. Pick the
    events in the order to tell them; a step's note links it to the step before.
  </p>

  <LangField label="Title" bind:value={m.title} path="title" required />
  <LangField label="Summary" bind:value={m.summary} path="summary" required multiline hint="One or two sentences, shown on the journey's card." />

  <div class="grid4">
    <label class="field">
      <span class="label">ID *</span>
      <input type="text" bind:value={m.id} disabled={!!initial} oninput={() => (idTouched = true)} />
      <FieldError path="id" />
    </label>
    <label class="field">
      <span class="label">Order</span>
      <input type="number" step="1" bind:value={m.order} />
      <span class="hint">Lower numbers are listed first.</span>
      <FieldError path="order" />
    </label>
    <label class="field">
      <span class="label">Review</span>
      <select bind:value={m.review}>
        <option value="draft">draft</option>
        <option value="reviewed">reviewed</option>
      </select>
    </label>
  </div>

  <fieldset>
    <legend>Steps</legend>
    <FieldError path="steps" exact />
    {#each m.steps as s, i (i)}
      <div class="card">
        <div class="card-head">Step {i + 1} <RowTools bind:list={m.steps} index={i} label="step" /></div>
        <label class="field">
          <span class="label">Event *</span>
          <select bind:value={s.event}>
            <option value="">Choose an event…</option>
            {#each events as e (e.id)}<option value={e.id}>{e.title.en} ({formatRange(e.when.from, e.when.to)})</option>{/each}
          </select>
          <FieldError path="steps[{i}].event" />
        </label>
        <LangField label="Note" bind:value={s.note} path="steps[{i}].note" hint='Optional, e.g. "Archaeology: flood deposits found in Mesopotamian cities."' />
      </div>
    {/each}
    <button type="button" class="small" onclick={() => m.steps.push({ event: '', note: { en: '', ar: '' } })}>+ Add a step</button>
  </fieldset>

  <label class="field">
    <span class="label">Editorial notes</span>
    <textarea rows="2" bind:value={m.notes}></textarea>
    <span class="hint">Not shown to readers.</span>
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
          if (await runner.remove(initial.id, 'journey')) ondeleted?.();
        }
      : undefined}
  />
</div>
