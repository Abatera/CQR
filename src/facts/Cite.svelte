<script lang="ts">
  import { fullCite, shortCite } from '../lib/format';
  import { t } from '../lib/i18n';
  import { refId, type SourceRef } from '../lib/schema';
  import { app } from '../state/app.svelte';

  let { refs }: { refs: SourceRef[] | undefined } = $props();
</script>

<!-- Citations are bibliographic and stay in the form of the cited edition; <bdi> keeps them readable inside Arabic text. -->
{#if refs?.length}
  <span class="cites">
    {#each refs as r, i (i)}
      {@const s = app.sourcesById.get(refId(r))}
      <bdi><a class="cite" href="#src-{refId(r)}" title={s ? fullCite(s) : 'Missing source'}>{shortCite(s, r)}</a></bdi>{i < refs.length - 1 ? '; ' : ''}
    {/each}
  </span>
{:else}
  <span class="unsourced" title={t('noSourceTitle', app.lang)}>{t('noSource', app.lang)}</span>
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
