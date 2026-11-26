<script lang="ts">
  /**
   * A content text in the reader's language, with English as the fallback where the
   * Arabic is missing. The span carries the language actually shown, so fallback
   * English inside Arabic text keeps its own direction and font.
   */
  import { pick } from '../lib/i18n';
  import { app } from '../state/app.svelte';

  let { m }: { m: { en: string; ar?: string } | undefined } = $props();

  const s = $derived(pick(m, app.lang));
</script>

<span lang={s.lang} dir={s.dir}>{s.text}</span>
