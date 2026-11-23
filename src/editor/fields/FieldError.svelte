<script lang="ts">
  import { under, useErrors } from '../errors';

  let { path, exact = false }: { path: string; exact?: boolean } = $props();
  const errors = useErrors();
  const mine = $derived(errors().filter((i) => under(i.path, path, exact)));
</script>

{#each mine as e, i (i)}
  <p class="field-error" class:warning={e.level === 'warning'}>{e.message}</p>
{/each}

<style>
  .field-error {
    color: #b3261e;
    font-size: 12px;
    margin: 2px 0 0;
  }
  .field-error.warning {
    color: #8a4b00;
  }
</style>
