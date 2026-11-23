<script lang="ts">
  /** Adds a source to the bibliography without leaving the form you are in. */
  import { onMount } from 'svelte';
  import SourceForm from './SourceForm.svelte';

  let { onclose, oncreated }: { onclose: () => void; oncreated: (id: string) => void } = $props();
  let dialog: HTMLDialogElement;

  onMount(() => dialog.showModal());
</script>

<dialog bind:this={dialog} onclose={onclose}>
  <div class="head">
    <h3>New source</h3>
    <button type="button" class="icon" onclick={() => dialog.close()} title="Close">✕</button>
  </div>
  <SourceForm
    embedded
    onsaved={(id) => {
      oncreated(id);
      dialog.close();
    }}
  />
</dialog>

<style>
  dialog {
    width: min(760px, 92vw);
    max-height: 88vh;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 0 18px 12px;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.3);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 1;
  }
</style>
