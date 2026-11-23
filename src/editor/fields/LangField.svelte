<script lang="ts">
  /** A text shown to readers, in English (required) and Arabic (optional). */
  import type { LangForm } from '../model';
  import FieldError from './FieldError.svelte';

  let {
    label,
    value = $bindable(),
    path,
    multiline = false,
    required = false,
    hint = '',
  }: { label: string; value: LangForm; path: string; multiline?: boolean; required?: boolean; hint?: string } = $props();

  const uid = $props.id();
</script>

<div class="field lang">
  <span class="label" id="{uid}-l">{label}{required ? ' *' : ''}</span>
  {#if hint}<span class="hint">{hint}</span>{/if}
  <div class="pair">
    <label class="en">
      <span class="tag">English</span>
      {#if multiline}
        <textarea rows="3" bind:value={value.en} aria-labelledby="{uid}-l"></textarea>
      {:else}
        <input type="text" bind:value={value.en} aria-labelledby="{uid}-l" />
      {/if}
    </label>
    <label class="ar">
      <span class="tag">العربية (optional)</span>
      {#if multiline}
        <textarea rows="3" bind:value={value.ar} dir="rtl" lang="ar"></textarea>
      {:else}
        <input type="text" bind:value={value.ar} dir="rtl" lang="ar" />
      {/if}
    </label>
  </div>
  <FieldError {path} />
</div>

<style>
  .pair {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 8px;
  }
  .pair label {
    display: flex;
    flex-direction: column;
  }
  .tag {
    font-size: 11px;
    color: var(--muted);
  }
  .ar textarea,
  .ar input {
    font-family: var(--font-ar);
    font-size: 16px;
  }
</style>
