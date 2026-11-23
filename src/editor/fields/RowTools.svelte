<script lang="ts">
  /** Move up / move down / remove buttons for one row of a repeated field. */
  let { list = $bindable(), index, label = 'item' }: { list: unknown[]; index: number; label?: string } = $props();

  function move(d: -1 | 1) {
    const j = index + d;
    if (j < 0 || j >= list.length) return;
    const [x] = list.splice(index, 1);
    list.splice(j, 0, x);
  }
</script>

<span class="row-tools">
  <button type="button" class="icon" title="Move {label} up" disabled={index === 0} onclick={() => move(-1)}>↑</button>
  <button type="button" class="icon" title="Move {label} down" disabled={index === list.length - 1} onclick={() => move(1)}>↓</button>
  <button type="button" class="icon danger" title="Remove {label}" onclick={() => list.splice(index, 1)}>✕</button>
</span>

<style>
  .row-tools {
    display: inline-flex;
    gap: 2px;
    margin-inline-start: auto;
  }
</style>
