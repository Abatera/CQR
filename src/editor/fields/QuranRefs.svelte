<script lang="ts">
  /**
   * Verse references, checked against the dataset as you type. The preview shows
   * the verse text from the dataset, so you can confirm the reference is the right one.
   */
  import { checkRef, parseRef } from '../../lib/quran-ref';
  import VerseText from '../../quran/VerseText.svelte';
  import { app } from '../../state/app.svelte';
  import FieldError from './FieldError.svelte';
  import RowTools from './RowTools.svelte';

  let { value = $bindable(), path }: { value: string[]; path: string } = $props();

  let preview = $state<Record<number, boolean>>({});

  $effect(() => {
    if (!app.quran) void app.loadQuran();
  });

  function status(ref: string): { ok: boolean; text: string } {
    if (!ref.trim()) return { ok: false, text: '' };
    if (!app.quran) return { ok: false, text: 'Loading the dataset…' };
    const err = checkRef(ref.trim(), app.quran.counts);
    if (err) return { ok: false, text: err };
    const r = parseRef(ref)!;
    const s = app.quran.surahs[r.surah - 1];
    return { ok: true, text: `${s.tname} (${s.name}), ${r.to - r.from + 1} verse${r.to > r.from ? 's' : ''}` };
  }
</script>

<div class="field quran-refs">
  <span class="label">Quran references</span>
  <span class="hint">"surah:ayah" or "surah:ayah-ayah", e.g. 34:10-11. The text itself always comes from the Tanzil dataset.</span>
  {#each value as _, i (i)}
    {@const st = status(value[i])}
    <div class="row">
      <input type="text" bind:value={value[i]} placeholder="34:10-11" aria-label="Quran reference" class:bad={!!value[i] && !st.ok} />
      <span class="status" class:ok={st.ok}>{st.ok ? '✓ ' : ''}{st.text}</span>
      {#if st.ok}
        <button type="button" class="small" onclick={() => (preview[i] = !preview[i])}>{preview[i] ? 'Hide text' : 'Show text'}</button>
      {/if}
      <RowTools bind:list={value} index={i} label="reference" />
    </div>
    {#if st.ok && preview[i]}<div class="preview"><VerseText ref={value[i].trim()} /></div>{/if}
    <FieldError path="{path}[{i}]" />
  {/each}
  <button type="button" class="small" onclick={() => value.push('')}>+ Add a reference</button>
</div>

<style>
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }
  .row input {
    width: 110px;
  }
  .row input.bad {
    border-color: #b3261e;
  }
  .status {
    font-size: 12px;
    color: #b3261e;
  }
  .status.ok {
    color: #1d5b2c;
  }
  .preview {
    background: #f7faf9;
    border-radius: 6px;
    padding: 4px 10px;
    margin-bottom: 6px;
  }
</style>
