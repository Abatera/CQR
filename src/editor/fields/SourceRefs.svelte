<script lang="ts">
  /** Citations: each picks a source from content/sources.yaml and can add a locator (pages, volume). */
  import { shortCite } from '../../lib/format';
  import { app } from '../../state/app.svelte';
  import type { RefForm } from '../model';
  import NewSourceDialog from '../NewSourceDialog.svelte';
  import FieldError from './FieldError.svelte';
  import RowTools from './RowTools.svelte';

  let {
    value = $bindable(),
    path,
    label = 'Sources',
    max = Infinity,
  }: { value: RefForm[]; path: string; label?: string; max?: number } = $props();

  let dialogOpen = $state(false);
  const sources = $derived([...(app.content?.sources ?? [])].sort((a, b) => a.id.localeCompare(b.id)));

  function created(id: string) {
    const empty = value.findIndex((r) => !r.id);
    if (empty >= 0) value[empty].id = id;
    else value.push({ id, locator: '' });
  }
</script>

<div class="field refs">
  <span class="label">{label}</span>
  {#each value as r, i (i)}
    <div class="ref-row">
      <select bind:value={r.id} aria-label="Source">
        <option value="">Choose a source…</option>
        {#each sources as s (s.id)}
          <option value={s.id}>{shortCite(s, s.id)}: {s.title.slice(0, 60)}</option>
        {/each}
      </select>
      <input type="text" bind:value={r.locator} placeholder="Locator, e.g. pp. 102-110" aria-label="Locator" />
      <RowTools bind:list={value} index={i} label="citation" />
    </div>
    <FieldError path="{path}[{i}]" />
  {/each}
  <FieldError {path} exact />
  <div class="actions">
    {#if value.length < max}
      <button type="button" class="small" onclick={() => value.push({ id: '', locator: '' })}>+ Cite a source</button>
    {/if}
    <button type="button" class="small" onclick={() => (dialogOpen = true)}>+ New source…</button>
  </div>
</div>

{#if dialogOpen}
  <NewSourceDialog onclose={() => (dialogOpen = false)} oncreated={created} />
{/if}

<style>
  .ref-row {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr) auto;
    gap: 6px;
    margin-bottom: 4px;
    align-items: center;
  }
  .actions {
    display: flex;
    gap: 6px;
  }
</style>
