<script lang="ts">
  import { onMount } from 'svelte';
  import About from './About.svelte';
  import EditorView from './editor/EditorView.svelte';
  import FactsPanel from './facts/FactsPanel.svelte';
  import Txt from './facts/Txt.svelte';
  import Home from './Home.svelte';
  import JourneyView from './journey/JourneyView.svelte';
  import { certaintyText, pick, t, tx } from './lib/i18n';
  import { formatRange } from './lib/years';
  import MapView from './map/MapView.svelte';
  import QuranView from './quran/QuranView.svelte';
  import { app, CAN_EDIT } from './state/app.svelte';
  import { href, type Route } from './state/route';
  import Overview from './timeline/Overview.svelte';
  import Timeline from './timeline/Timeline.svelte';
  import Icon, { type IconName } from './ui/Icon.svelte';
  import Mark from './ui/Mark.svelte';
  import SearchBox from './ui/SearchBox.svelte';

  // The editor exists only on the local dev server; on the public site its route opens the explorer.
  const view = $derived(app.route.view === 'edit' && !CAN_EDIT ? 'explore' : app.route.view);
  const lang = $derived(app.lang);
  const dir = $derived(lang === 'ar' ? 'rtl' : 'ltr');
  const narrow = $derived(app.narrow);
  const errors = $derived((app.content?.issues ?? []).filter((i) => i.level === 'error').length);
  const warnings = $derived((app.content?.issues ?? []).filter((i) => i.level === 'warning').length);

  let searchInput = $state<HTMLInputElement>();
  let searchOpen = $state(false);

  const NAV: { view: Route['view']; route: Route; label: 'explore' | 'journeys' | 'quran' | 'about'; icon: IconName }[] = [
    { view: 'explore', route: { view: 'explore' }, label: 'explore', icon: 'map' },
    { view: 'journeys', route: { view: 'journeys' }, label: 'journeys', icon: 'compass' },
    { view: 'quran', route: { view: 'quran' }, label: 'quran', icon: 'quran' },
    { view: 'about', route: { view: 'about' }, label: 'about', icon: 'info' },
  ];
  const isActive = (v: Route['view']) => (v === 'journeys' ? view === 'journeys' || view === 'journey' : view === v);
  const navRoute = (r: Route): Route => (r.view === 'explore' ? { view: 'explore', eventId: app.selectedId } : r);

  function isTyping(el: EventTarget | null) {
    return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  }

  async function focusSearch() {
    if (narrow) searchOpen = true;
    await Promise.resolve();
    searchInput?.focus();
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        void focusSearch();
        return;
      }
      if (e.key === '/' && !isTyping(e.target)) {
        e.preventDefault();
        void focusSearch();
        return;
      }
      // Left and right arrow keys step through events in the explore view.
      if (app.route.view !== 'explore' || isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        app.step(lang === 'ar' ? -1 : 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        app.step(lang === 'ar' ? 1 : -1);
      } else if (e.key === 'Escape') {
        if (app.entryOpen) app.entryOpen = false;
        else app.select(undefined);
      }
    };

    // Ask before leaving a form with unsaved changes.
    const onClick = (e: MouseEvent) => {
      if (!app.editorDirty) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#/"]');
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
    const title = app.selected ? tx(app.selected.title, app.lang) : undefined;
    const j = app.route.view === 'journey' ? app.journeysById.get(app.route.id) : undefined;
    const name = 'Chronotope of Quranic Reality';
    document.title = view === 'explore' && title ? `${title} · ${name}` : j ? `${tx(j.title, app.lang)} · ${name}` : name;
    document.documentElement.lang = app.lang;
  });

  // Leaving the explore view closes a phone's full-screen entry.
  $effect(() => {
    if (view !== 'explore') app.entryOpen = false;
  });

  function swatch(c: string) {
    return `swatch c-${c}`;
  }
</script>

<div class="app" class:narrow>
  <header class="top" {dir}>
    <a class="brand" href={href({ view: 'home' })} aria-label="Chronotope of Quranic Reality, {t('home', lang)}">
      <Mark size={narrow ? 26 : 30} />
      <span class="wordmark" lang="en" dir="ltr">
        <span class="w1">Chronotope</span>
        {#if !narrow}<span class="w2">of Quranic Reality</span>{/if}
      </span>
    </a>

    {#if !narrow}
      <SearchBox bind:inputEl={searchInput} />
      <nav aria-label={t('views', lang)} class="nav" {lang}>
        {#each NAV as n (n.view)}
          <a href={href(navRoute(n.route))} class:active={isActive(n.view)} aria-current={isActive(n.view) ? 'page' : undefined}>{t(n.label, lang)}</a>
        {/each}
        {#if CAN_EDIT}
          <a href={href({ view: 'edit', collection: 'events' })} class:active={view === 'edit'}>{t('editor', lang)}</a>
        {/if}
      </nav>
    {:else}
      <span class="spacer"></span>
      <button type="button" class="icon-btn plain" aria-label={t('searchLabel', lang)} aria-expanded={searchOpen} onclick={() => (searchOpen ? (searchOpen = false) : focusSearch())}>
        <Icon name={searchOpen ? 'close' : 'search'} size={20} />
      </button>
    {/if}

    <div class="lang" role="group" aria-label={t('language', lang)}>
      {#if narrow}
        <button type="button" class="icon-btn plain lang-one" lang={lang === 'ar' ? 'en' : 'ar'} title={t('switchTitle', lang)} onclick={() => app.setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'EN' : 'ع'}</button>
      {:else}
        <button type="button" aria-pressed={lang === 'en'} lang="en" onclick={() => app.setLang('en')}>EN</button>
        <button type="button" aria-pressed={lang === 'ar'} lang="ar" title={t('switchTitle', 'en')} onclick={() => app.setLang('ar')}>عربي</button>
      {/if}
    </div>

    {#if CAN_EDIT && app.content && !narrow}
      <a class="status" href={href({ view: 'edit', collection: 'events' })} title="Content validation (local dev server)">
        {#if errors}<span class="err">{errors} error{errors > 1 ? 's' : ''}</span>{/if}
        <span class="warn">{warnings} open</span>
      </a>
    {/if}
  </header>

  {#if narrow && searchOpen}
    <div class="search-row">
      <SearchBox bind:inputEl={searchInput} onclose={() => (searchOpen = false)} />
    </div>
  {/if}

  <main>
    {#if app.contentError}
      <p class="error page">{app.contentError}</p>
    {:else if !app.content}
      <p class="muted page">Loading…</p>
    {:else if view === 'home'}
      <Home />
    {:else if view === 'explore'}
      <div class="explore">
        <Overview />
        <div class="tl"><Timeline /></div>
        <div class="bottom">
          <div class="map-cell"><MapView /></div>
          {#if !narrow}
            <div class="facts-cell"><FactsPanel /></div>
          {/if}
        </div>

        {#if narrow}
          {@const ev = app.selected}
          <section class="peek" aria-label={ev ? tx(ev.title, lang) : t('explore', lang)} {lang} {dir}>
            <span class="handle" aria-hidden="true"></span>
            {#if ev}
              <div class="peek-head">
                <h2><Txt m={ev.title} /></h2>
                {#if lang === 'en' && ev.title.ar}<span class="peek-ar" lang="ar" dir="rtl">{ev.title.ar}</span>{/if}
              </div>
              <div class="peek-chips">
                <span class="chip"><strong><bdi {dir}>{formatRange(ev.when.from, ev.when.to, lang)}</bdi></strong><span class={swatch(ev.when.certainty)} aria-hidden="true"></span><span class="note">{certaintyText(ev.when.certainty, lang)}</span></span>
                {#if ev.review === 'draft'}<span class="draft-pill">{t('draftShort', lang)}</span>{/if}
              </div>
              <div class="peek-layers" aria-hidden="true">
                <span class="q" class:off={!ev.quran?.length}></span><span class="tf" class:off={!ev.tafsir?.length}></span><span class="tr" class:off={!ev.tradition?.length}></span><span class="h" class:off={!ev.history?.length}></span><span class="r" class:off={!ev.connection}></span>
              </div>
              <button type="button" class="primary read" onclick={() => (app.entryOpen = true)}>{t('readEntry', lang)}<Icon name={dir === 'rtl' ? 'left' : 'right'} size={16} stroke={2} /></button>
            {:else}
              <p class="peek-empty">{t('chooseEvent', lang)}</p>
              {#if app.journeys.length}
                <a class="button" href={href({ view: 'journeys' })}><Icon name="compass" size={16} /> {t('takeJourney', lang)}</a>
              {/if}
            {/if}
          </section>

          {#if app.entryOpen && ev}
            <div class="entry-page" role="dialog" aria-modal="true" aria-label={tx(ev.title, lang)}>
              <div class="entry-top" {dir}>
                <button type="button" class="icon-btn plain" aria-label={t('back', lang)} onclick={() => (app.entryOpen = false)}><Icon name={dir === 'rtl' ? 'right' : 'left'} size={22} stroke={2} /></button>
                <span class="entry-crumb" {lang}>{pick(app.lanesById.get(ev.lane)?.name, lang).text} · <bdi {dir}>{formatRange(ev.when.from, ev.when.to, lang)}</bdi></span>
              </div>
              <div class="entry-body"><FactsPanel page /></div>
              <div class="entry-bar" {dir}>
                <button type="button" class="icon-btn" aria-label={t('previousEvent', lang)} onclick={() => app.step(-1)}><Icon name={dir === 'rtl' ? 'right' : 'left'} size={20} stroke={2} /></button>
                <button type="button" class="map-btn" onclick={() => (app.entryOpen = false)}><Icon name="pin" size={18} />{t('onTheMapAndTimeline', lang)}</button>
                <button type="button" class="icon-btn" aria-label={t('nextEvent', lang)} onclick={() => app.step(1)}><Icon name={dir === 'rtl' ? 'left' : 'right'} size={20} stroke={2} /></button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    {:else if view === 'journeys' || view === 'journey'}
      <JourneyView />
    {:else if view === 'quran'}
      <QuranView />
    {:else if CAN_EDIT && view === 'edit'}
      <EditorView />
    {:else}
      <About />
    {/if}
  </main>

  {#if narrow}
    <nav class="tabbar" aria-label={t('views', lang)} {lang}>
      {#each NAV as n (n.view)}
        <a href={href(navRoute(n.route))} class:active={isActive(n.view)} aria-current={isActive(n.view) ? 'page' : undefined}>
          <Icon name={n.icon} size={22} />
          <span>{t(n.label, lang)}</span>
        </a>
      {/each}
    </nav>
  {/if}
</div>

<style>
  .app {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    /* minmax(0, …): the column must not grow to the widest content (see .explore below). */
    grid-template-columns: minmax(0, 1fr);
    height: 100vh;
    height: 100dvh;
  }
  /* Fixed rows, so the optional search row and tab bar never move the main area into another row. */
  .top {
    grid-row: 1;
  }
  .search-row {
    grid-row: 2;
  }
  main {
    grid-row: 3;
  }
  .tabbar {
    grid-row: 4;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 18px;
    height: 60px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    position: relative;
    z-index: 1500;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--ink);
    flex: none;
  }
  .brand:hover {
    color: var(--ink);
  }
  .wordmark {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
  }
  .w1 {
    font-family: var(--font-read);
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .w2 {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  .nav {
    display: flex;
    gap: 2px;
    margin-inline-start: auto;
  }
  .nav a {
    padding: 8px 13px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--ink-2);
    font-size: 14px;
  }
  .nav a:hover {
    background: var(--hover);
    color: var(--ink);
  }
  .nav a.active {
    background: var(--accent-tint);
    color: var(--ink);
    font-weight: 600;
  }
  .nav:lang(ar) a {
    font-size: 15px;
  }
  .spacer {
    flex: 1;
  }
  .plain {
    border: 0;
    background: transparent;
    width: 44px;
    height: 44px;
  }
  .lang {
    display: flex;
    border: 1px solid var(--control);
    border-radius: 9px;
    overflow: hidden;
    background: var(--card);
    flex: none;
  }
  .lang button {
    border: 0;
    border-radius: 0;
    padding: 6px 12px;
    font-size: 13px;
    background: var(--card);
  }
  .lang button:lang(ar) {
    font-size: 15px;
    padding: 4px 12px;
  }
  .lang button[aria-pressed='true'] {
    background: var(--ink);
    color: #fff;
    font-weight: 600;
  }
  .narrow .lang {
    border: 0;
    background: transparent;
  }
  .lang-one {
    font-size: 16px !important;
    font-weight: 600;
  }
  .status {
    display: flex;
    gap: 6px;
    font-size: 12px;
    text-decoration: none;
    flex: none;
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
  .search-row {
    padding: 8px 12px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
    position: relative;
    z-index: 1400;
  }
  main {
    min-height: 0;
    overflow: hidden;
    position: relative;
  }
  .page {
    padding: 20px;
  }
  /*
   * minmax(0, …) keeps the columns at the screen's width. With plain auto or 1fr tracks the grid
   * grows to its content, and the timeline, which sizes its SVG to its own width, then widens by
   * the scrollbar's width on every frame, without end.
   */
  .explore {
    display: grid;
    grid-template-rows: auto minmax(220px, 38%) 1fr;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
  }
  .tl {
    min-height: 0;
    border-bottom: 1px solid var(--line);
  }
  .bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, clamp(440px, 42%, 680px));
    min-height: 0;
  }
  .map-cell {
    min-height: 0;
    position: relative;
  }
  .facts-cell {
    min-height: 0;
    border-inline-start: 1px solid var(--line);
  }
  .swatch {
    width: 18px;
    height: 8px;
    border-radius: 2px;
    border: 1.5px dashed #7a5c2e;
    background: rgb(122 92 46 / 0.12);
  }
  .swatch.c-established {
    background: #7a5c2e;
    border-style: solid;
  }
  .swatch.c-reckoned {
    border: 1px solid rgb(122 92 46 / 0.6);
    background: repeating-linear-gradient(135deg, rgb(122 92 46 / 0.45) 0 2px, rgb(122 92 46 / 0.1) 2px 4px);
  }
  .swatch.c-debated,
  .swatch.c-unknown {
    border-style: dotted;
    background: none;
  }

  /* Phone layout */
  .narrow .top {
    height: 56px;
    gap: 6px;
    padding: 0 6px 0 14px;
  }
  .narrow .explore {
    grid-template-rows: auto 214px 1fr auto;
  }
  .narrow .bottom {
    grid-template-columns: minmax(0, 1fr);
  }
  .peek {
    position: relative;
    z-index: 900;
    margin-top: -16px;
    background: var(--paper);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -6px 20px rgb(30 25 10 / 0.14);
    padding: 8px 16px 12px;
  }
  .handle {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: #d5cec1;
    margin: 0 auto 8px;
  }
  .peek-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .peek h2 {
    margin: 0;
    font-family: var(--font-read);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.15;
  }
  .peek:lang(ar) h2 {
    font-family: var(--font-ar);
    line-height: 1.5;
  }
  .peek-ar {
    font-size: 17px;
    color: var(--ink-2);
  }
  .peek-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .peek-chips .chip {
    min-height: 26px;
    font-size: 12px;
  }
  .peek-layers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin-top: 10px;
  }
  .peek-layers span {
    height: 6px;
    border-radius: 3px;
  }
  .peek-layers .q {
    background: var(--l-quran);
  }
  .peek-layers .tf {
    background: var(--l-tafsir);
  }
  .peek-layers .tr {
    background: var(--l-tradition);
  }
  .peek-layers .h {
    background: var(--l-history);
  }
  .peek-layers .r {
    background: repeating-linear-gradient(90deg, var(--l-reflection) 0 6px, transparent 6px 9px);
  }
  .peek-layers .off {
    background: #e6e1d7;
  }
  .read {
    margin-top: 10px;
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 600;
    border-radius: 11px;
    font-size: 14px;
  }
  .peek-empty {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .entry-page {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    background: var(--paper);
  }
  .entry-top {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border-bottom: 1px solid var(--line);
    flex: none;
  }
  .entry-crumb {
    font-size: 13px;
    color: var(--muted);
  }
  .entry-body {
    flex: 1;
    min-height: 0;
  }
  .entry-bar {
    flex: none;
    height: 68px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-top: 1px solid var(--line);
  }
  .entry-bar .icon-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }
  .map-btn {
    flex: 1;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    background: var(--ink);
    border-color: var(--ink);
    color: #fff;
    font-weight: 600;
    font-size: 14px;
  }
  .map-btn:hover {
    background: #333b38 !important;
  }
  .tabbar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: 64px;
    background: var(--paper);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .tabbar a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-decoration: none;
    color: #4a5551;
    font-size: 11px;
  }
  .tabbar:lang(ar) a {
    font-size: 13px;
  }
  .tabbar a.active {
    color: var(--accent);
    font-weight: 600;
  }
</style>
