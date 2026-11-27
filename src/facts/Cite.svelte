<script lang="ts" module>
  /**
   * Scrolls to an element inside the page without touching the URL: the hash holds the route,
   * so in-page anchors must not change it. Briefly highlights the target.
   */
  export function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1400);
  }
</script>

<script lang="ts">
  import { fullCite, shortCite } from '../lib/format';
  import { t } from '../lib/i18n';
  import { refId, type SourceRef } from '../lib/schema';
  import { app } from '../state/app.svelte';

  let { refs }: { refs: SourceRef[] | undefined } = $props();

  function go(ev: MouseEvent, id: string) {
    ev.preventDefault();
    scrollToId(`src-${id}`);
  }
</script>

<!-- Citations are bibliographic and stay in the form of the cited edition; <bdi> keeps them readable inside Arabic text. -->
{#if refs?.length}
  <span class="cites">
    {#each refs as r, i (i)}
      {@const s = app.sourcesById.get(refId(r))}
      <bdi><a class="cite" href="#src-{refId(r)}" onclick={(e) => go(e, refId(r))} title={s ? fullCite(s) : 'Missing source'}>{shortCite(s, r)}</a></bdi>{i < refs.length - 1 ? '; ' : ''}
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
