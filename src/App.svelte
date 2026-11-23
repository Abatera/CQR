<script lang="ts">
  import { onMount } from 'svelte';
  import About from './About.svelte';
  import EditorView from './editor/EditorView.svelte';
  import FactsPanel from './facts/FactsPanel.svelte';
  import MapView from './map/MapView.svelte';
  import QuranView from './quran/QuranView.svelte';
  import { app, CAN_EDIT } from './state/app.svelte';
  import { href } from './state/route';
  import Timeline from './timeline/Timeline.svelte';

  const view = $derived(app.route.view);
  const errors = $derived((app.content?.issues ?? []).filter((i) => i.level === 'error').length);
  const warnings = $derived((app.content?.issues ?? []).filter((i) => i.level === 'warning').length);

  function isTyping(t: EventTarget | null) {
    return t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
  }

  onMount(() => {
    // Left and right arrow keys step through events in the explore view.
    const onKey = (e: KeyboardEvent) => {
      if (app.route.view !== 'explore' || isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        app.step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        app.step(-1);
      } else if (e.key === 'Escape') {
        app.select(undefined);
      }
    };

    // Ask before leaving a form with unsaved changes.
    const onClick = (e: MouseEvent) => {
      if (!app.editorDirty) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a || a.getAttribute('href') === location.hash) return;
      if (!confirm('You have unsaved changes. Leave this form and discard them?')) {
        e.preventDefault();
        e.stopPropagation();
      } else app.editorDirty = false;
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (app.editorDirty) e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onUnload);
    };
  });

  $effect(() => {
    const t = app.selected?.title.en;
    document.title = view === 'explore' && t ? `${t} · Chronotope of Quranic Reality` : 'Chronotope of Quranic Reality';
  });
</script>

<div class="app">
  <header class="top">
    <a class="brand" href="#/">Chronotope of Quranic Reality</a>
    <nav aria-label="Views">
      <a href={href({ view: 'explore', eventId: app.selectedId })} class:active={view === 'explore'}>Explore</a>
      <a href={href({ view: 'quran' })} class:active={view === 'quran'}>Quran</a>
      {#if CAN_EDIT}
        <a href={href({ view: 'edit', collection: 'events' })} class:active={view === 'edit'}>Editor</a>
      {/if}
      <a href={href({ view: 'about' })} class:active={view === 'about'}>About</a>
    </nav>
    {#if CAN_EDIT && app.content}
      <a class="status" href={href({ view: 'edit', collection: 'events' })} title="Content validation (local dev server)">
        {#if errors}<span class="err">{errors} error{errors > 1 ? 's' : ''}</span>{/if}
        <span class="warn">{warnings} open item{warnings === 1 ? '' : 's'}</span>
        <span class="local">local editing on</span>
      </a>
    {/if}
  </header>

  <main>
    {#if app.contentError}
      <p class="error page">{app.contentError}</p>
    {:else if !app.content}
      <p class="muted page">Loading…</p>
    {:else if view === 'explore'}
      <div class="explore">
        <div class="tl"><Timeline /></div>
        <div class="bottom">
          <div class="map-cell"><MapView /></div>
          <div class="facts-cell"><FactsPanel /></div>
        </div>
      </div>
    {:else if view === 'quran'}
      <QuranView />
    {:else if view === 'edit'}
      <EditorView />
    {:else}
      <About />
    {/if}
  </main>
</div>

<style>
  .app {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 0 16px;
    height: 46px;
    border-bottom: 1px solid var(--line);
    background: #fff;
  }
  .brand {
    font-weight: 700;
    font-size: 16px;
    color: #1f3d36;
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 4px;
  }
  nav a {
    padding: 6px 12px;
    border-radius: 6px;
    text-decoration: none;
    color: #333;
    font-size: 14px;
  }
  nav a.active {
    background: #e2efea;
    color: #123;
    font-weight: 600;
  }
  .status {
    margin-inline-start: auto;
    display: flex;
    gap: 8px;
    font-size: 12px;
    text-decoration: none;
  }
  .status span {
    border-radius: 10px;
    padding: 2px 8px;
  }
  .err {
    background: #fde2dc;
    color: #8a1f1f;
  }
  .warn {
    background: #fff1cc;
    color: #6b4f00;
  }
  .local {
    background: #e8eef7;
    color: #24426b;
  }
  main {
    min-height: 0;
    overflow: hidden;
  }
  .page {
    padding: 20px;
  }
  .explore {
    display: grid;
    grid-template-rows: minmax(220px, 42%) 1fr;
    height: 100%;
  }
  .tl {
    min-height: 0;
    border-bottom: 1px solid var(--line);
  }
  .bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 0;
  }
  .map-cell {
    min-height: 0;
    border-inline-end: 1px solid var(--line);
  }
  .facts-cell {
    min-height: 0;
  }
</style>
