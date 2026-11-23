<script lang="ts">
  /** Shows verses in the Uthmani script, from the Tanzil dataset. Never from content files. */
  import { verseEndMark } from '../lib/arabic';
  import { app } from '../state/app.svelte';
  import { versesFor } from './quran-data';

  let { ref }: { ref: string } = $props();

  $effect(() => {
    if (!app.quran) void app.loadQuran();
  });

  const verses = $derived(app.quran ? versesFor(app.quran, ref) : []);
</script>

{#if app.quranError}
  <p class="error">{app.quranError}</p>
{:else if !app.quran}
  <p class="muted">Loading the Quran text…</p>
{:else if verses.length === 0}
  <p class="error">{ref} is not in the dataset.</p>
{:else}
  <p class="quran-text" dir="rtl" lang="ar">
    {#each verses as v (v.ayah)}<span class="verse">{v.text}&nbsp;<span class="end">{verseEndMark(v.ayah)}</span></span>{' '}{/each}
  </p>
{/if}
