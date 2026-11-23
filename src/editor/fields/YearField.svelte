<script lang="ts">
  /** A year entered as a number plus BCE/CE, stored as a signed integer (negative = BCE). */
  import FieldError from './FieldError.svelte';

  let { label, value = $bindable(), path }: { label: string; value: number | undefined; path: string } = $props();

  let era = $state<'BCE' | 'CE'>(value !== undefined && value > 0 ? 'CE' : 'BCE');
  const magnitude = $derived(value === undefined ? '' : String(Math.abs(value)));

  function setMagnitude(text: string) {
    const n = Number(text);
    value = text.trim() === '' || !Number.isFinite(n) ? undefined : era === 'BCE' ? -Math.abs(Math.trunc(n)) : Math.abs(Math.trunc(n));
  }

  function setEra(e: 'BCE' | 'CE') {
    era = e;
    if (value !== undefined) value = e === 'BCE' ? -Math.abs(value) : Math.abs(value);
  }
</script>

<label class="field year">
  <span class="label">{label}</span>
  <span class="row">
    <input type="number" min="1" step="1" value={magnitude} oninput={(e) => setMagnitude(e.currentTarget.value)} />
    <select value={era} onchange={(e) => setEra(e.currentTarget.value as 'BCE' | 'CE')}>
      <option value="BCE">BCE</option>
      <option value="CE">CE</option>
    </select>
  </span>
  <FieldError {path} exact />
</label>

<style>
  .row {
    display: flex;
    gap: 4px;
  }
  input {
    width: 90px;
  }
</style>
