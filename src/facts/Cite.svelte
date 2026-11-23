<script lang="ts">
  import { fullCite, shortCite } from '../lib/format';
  import { refId, type SourceRef } from '../lib/schema';
  import { app } from '../state/app.svelte';

  let { refs }: { refs: SourceRef[] | undefined } = $props();
</script>

{#if refs?.length}
  <span class="cites">
    {#each refs as r, i (i)}
      {@const s = app.sourcesById.get(refId(r))}
      <a class="cite" href="#src-{refId(r)}" title={s ? fullCite(s) : 'Missing source'}>{shortCite(s, r)}</a>{i < refs.length - 1 ? '; ' : ''}
    {/each}
  </span>
{:else}
  <span class="unsourced" title="This needs a source before the entry can be reviewed.">no source yet</span>
{/if}

<style>
  .cites {
    font-size: 12px;
    color: var(--muted);
  }
  .cite {
    color: inherit;
  }
  .unsourced {
    font-size: 11px;
    color: #a04000;
    background: #fdf0e6;
    border-radius: 3px;
    padding: 0 4px;
  }
</style>
