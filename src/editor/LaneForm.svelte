<script lang="ts">
  import { onDestroy } from 'svelte';
  import { slugify } from '../lib/format';
  import type { Lane } from '../lib/schema';
  import { app } from '../state/app.svelte';
  import { provideErrors } from './errors';
  import FieldError from './fields/FieldError.svelte';
  import LangField from './fields/LangField.svelte';
  import FormFooter from './FormFooter.svelte';
  import { FormRunner } from './form-runner.svelte';
  import { laneFromForm, laneToForm } from './model';

  let { initial, onsaved, ondeleted }: { initial?: Lane; onsaved?: (id: string) => void; ondeleted?: () => void } = $props();

  const nextOrder = Math.max(-1, ...(app.content?.lanes ?? []).map((l) => l.order)) + 1;
  // svelte-ignore state_referenced_locally
  const runner = new FormRunner('lanes', laneToForm(initial, nextOrder), laneFromForm, !initial);
  const m = $derived(runner.model);
  provideErrors(() => runner.errors);

  // The form is re-created for each item, so reading the starting value once is intended.
  // svelte-ignore state_referenced_locally
  let idTouched = $state(!!initial);
  $effect(() => {
    if (!idTouched) m.id = slugify(m.name.en);
  });

  const usedBy = $derived(initial ? (app.content?.events ?? []).filter((e) => e.lane === initial.id).length : 0);

  $effect(() => {
    app.editorDirty = runner.dirty;
  });
  onDestroy(() => (app.editorDirty = false));
</script>

<div class="form">
  <h2>{initial ? `Lane: ${initial.name.en}` : 'New lane'}</h2>
  <p class="hint">A lane is one row of the timeline, usually a region or civilization.{usedBy ? ` ${usedBy} events are in this lane.` : ''}</p>

  <LangField label="Name" bind:value={m.name} path="name" required />

  <div class="grid4">
    <label class="field">
      <span class="label">ID *</span>
      <input type="text" bind:value={m.id} disabled={!!initial} oninput={() => (idTouched = true)} />
      <FieldError path="id" />
    </label>
    <label class="field">
      <span class="label">Order</span>
      <input type="number" step="1" bind:value={m.order} />
      <span class="hint">Lower numbers are higher up.</span>
      <FieldError path="order" />
    </label>
    <label class="field">
      <span class="label">Color</span>
      <input type="color" bind:value={m.color} />
      <FieldError path="color" />
    </label>
    <label class="field check">
      <input type="checkbox" bind:checked={m.pinned} />
      <span>Pinned to the top (cannot be hidden)</span>
    </label>
  </div>

  <LangField label="Description" bind:value={m.description} path="description" multiline />

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
          if (await runner.remove(initial.id, 'lane')) ondeleted?.();
        }
      : undefined}
  />
</div>
