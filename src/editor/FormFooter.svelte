<script lang="ts">
  import type { Issue } from '../lib/validate';

  let {
    busy,
    dirty,
    message,
    errors,
    isNew,
    onsave,
    ondelete,
  }: {
    busy: boolean;
    dirty: boolean;
    message: string;
    errors: Issue[];
    isNew: boolean;
    onsave: () => void;
    ondelete?: () => void;
  } = $props();
</script>

<div class="form-footer">
  {#if errors.length}
    <div class="problems" role="alert">
      <strong>{errors.length} problem{errors.length > 1 ? 's' : ''}:</strong>
      <ul>
        {#each errors as e, i (i)}
          <li>
            {#if e.path}<code>{e.path}</code>{/if}
            {#if e.id && e.file && e.file.includes('/')}<span class="muted">({e.file})</span>{/if}
            {e.message}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <div class="buttons">
    <button type="button" class="primary" disabled={busy} onclick={onsave}>{busy ? 'Saving…' : isNew ? 'Create' : 'Save'}</button>
    {#if dirty}<span class="dirty">Unsaved changes</span>{/if}
    {#if message}<span class="message" class:ok={message.startsWith('Saved')}>{message}</span>{/if}
    {#if ondelete && !isNew}
      <button type="button" class="danger" disabled={busy} onclick={ondelete}>Delete</button>
    {/if}
  </div>
</div>

<style>
  .form-footer {
    position: sticky;
    bottom: 0;
    background: var(--bg);
    border-top: 1px solid var(--line);
    padding: 10px 0;
    margin-top: 18px;
  }
  .buttons {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .buttons .danger {
    margin-inline-start: auto;
  }
  .dirty {
    font-size: 12px;
    color: #8a4b00;
  }
  .message {
    font-size: 13px;
    color: #b3261e;
  }
  .message.ok {
    color: #1d5b2c;
  }
  .problems {
    background: #fdecea;
    border: 1px solid #f3b8b1;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 8px;
    font-size: 13px;
    max-height: 180px;
    overflow-y: auto;
  }
  .problems ul {
    margin: 4px 0 0;
    padding-inline-start: 18px;
  }
</style>
