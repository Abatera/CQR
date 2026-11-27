<script lang="ts">
  /** The mark: a circle of time crossed by a meridian, with one moment on it. One moment, one place. */
  let { size = 30 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
  <circle cx="16" cy="16" r="12" fill="none" stroke="var(--accent)" stroke-width="2" />
  <path d="M16 3v26" stroke="var(--accent)" stroke-width="2" />
  <circle cx="16" cy="16" r="3.2" fill="var(--mark)" />
</svg>
