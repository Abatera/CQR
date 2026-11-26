<script lang="ts">
  import { tick } from 'svelte';
  import { containsArabic, verseEndMark } from '../lib/arabic';
  import { parseRef, refIncludes } from '../lib/quran-ref';
  import { pick, t } from '../lib/i18n';
  import type { CqrEvent } from '../lib/schema';
  import { app } from '../state/app.svelte';
  import { href } from '../state/route';
  import { highlightSegments, searchQuran, type SearchMode } from './quran-data';

  const PAGE = 100;

  const route = $derived(app.route.view === 'quran' ? app.route : { view: 'quran' as const });
  const surahNo = $derived(route.query ? undefined : (route.surah ?? 1));

  let input = $state('');
  let mode = $state<SearchMode>('substring');
  let shown = $state(PAGE);

  $effect(() => {
    void app.loadQuran();
  });

  $effect(() => {
    input = route.query ?? '';
    shown = PAGE;
  });

  const q = $derived(app.quran);
  const surah = $derived(q && surahNo ? q.surahs[surahNo - 1] : undefined);
  const verses = $derived(q && surahNo ? (q.verses[surahNo] ?? []) : []);
  const hits = $derived(q && route.query && containsArabic(route.query) ? searchQuran(q, route.query, mode) : []);

  /** Events that cite each verse, keyed "surah:ayah", for the verses on screen. */
  function citing(s: number, a: number): CqrEvent[] {
    return (app.content?.events ?? []).filter((e) =>
      (e.quran ?? []).some((r) => {
        const p = parseRef(r);
        return p !== null && refIncludes(p, s, a);
      }),
    );
  }

  function submit(ev: SubmitEvent) {
    ev.preventDefault();
    const text = input.trim();
    if (!text) return app.navigate({ view: 'quran', surah: surahNo });
    const ref = parseRef(text);
    if (ref) return app.navigate({ view: 'quran', surah: ref.surah, ayah: ref.from });
    if (/^\d{1,3}$/.test(text)) return app.navigate({ view: 'quran', surah: Number(text) });
    app.navigate({ view: 'quran', query: text });
  }

  // Scroll to the requested verse.
  $effect(() => {
    const a = route.ayah;
    const s = surahNo;
    if (!q || !s) return;
    void tick().then(() => {
      const el = document.getElementById(a ? `v-${s}-${a}` : 'reader-top');
      el?.scrollIntoView({ block: a ? 'center' : 'start' });
    });
  });
</script>

<div class="reader">
  <aside class="surah-list" aria-label="Surahs">
    {#if q}
      <ol>
        {#each q.surahs as s (s.index)}
          <li>
            <a href={href({ view: 'quran', surah: s.index })} class:current={s.index === surahNo}>
              <span class="no">{s.index}</span>
              <span class="tname">{s.tname}</span>
              <span class="aname" dir="rtl" lang="ar">{s.name}</span>
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </aside>

  <main class="content">
    <form class="search" onsubmit={submit} role="search">
      <input
        type="search"
        bind:value={input}
        placeholder="Search the Arabic text, or go to a reference such as 34:10"
        aria-label="Search the Quran"
        dir="auto"
      />
      <label><input type="radio" bind:group={mode} value="substring" /> part of a word</label>
      <label><input type="radio" bind:group={mode} value="word" /> whole word</label>
      <button type="submit">Search</button>
    </form>

    {#if app.quranError}
      <p class="error">{app.quranError}</p>
    {:else if !q}
      <p class="muted">Loading the Quran text…</p>
    {:else if route.query}
      {#if !containsArabic(route.query)}
        <p>
          Search works on the Arabic text. No translation is included yet. To go to a verse, type a reference such as
          <code>34:10</code>.
        </p>
      {:else}
        <p class="count">
          {hits.length} verse{hits.length === 1 ? '' : 's'} contain “<span dir="rtl" lang="ar">{route.query}</span>”
          ({mode === 'word' ? 'whole word' : 'part of a word'}). Diacritics and alef and hamza forms are ignored.
        </p>
        <ol class="results">
          {#each hits.slice(0, shown) as h (h.verse.surah * 1000 + h.verse.ayah)}
            {@const s = q.surahs[h.verse.surah - 1]}
            <li>
              <a class="where" href={href({ view: 'quran', surah: h.verse.surah, ayah: h.verse.ayah })}>
                {h.verse.surah}:{h.verse.ayah} · {s.tname}
              </a>
              <p class="quran-text" dir="rtl" lang="ar">
                {#each highlightSegments(h.verse, h, route.query) as seg, i (i)}{#if seg.hit}<mark>{seg.text}</mark>{:else}{seg.text}{/if}{/each}&nbsp;<span
                  class="end">{verseEndMark(h.verse.ayah)}</span
                >
              </p>
              {#each citing(h.verse.surah, h.verse.ayah) as e (e.id)}
                <a class="chip" href={href({ view: 'explore', eventId: e.id })}>{t('onTheTimeline', 'en')} <span lang={pick(e.title, app.lang).lang}>{pick(e.title, app.lang).text}</span></a>
              {/each}
            </li>
          {/each}
        </ol>
        {#if hits.length > shown}
          <button type="button" onclick={() => (shown += PAGE)}>Show more ({hits.length - shown} left)</button>
        {/if}
      {/if}
    {:else if surah}
      <header id="reader-top">
        <h2>
          {surah.index}. {surah.tname} <span class="muted">({surah.ename})</span>
          <span class="aname-title" dir="rtl" lang="ar">سورة {surah.name}</span>
        </h2>
        <p class="muted">
          {surah.ayas} verses · {surah.type} · number {surah.order} in the order of revelation (Tanzil metadata)
        </p>
      </header>
      {#if verses[0]?.bismillah}
        <p class="quran-text basmala" dir="rtl" lang="ar">{verses[0].bismillah}</p>
      {/if}
      <div class="verses" dir="rtl" lang="ar">
        {#each verses as v (v.ayah)}
          {@const evs = citing(v.surah, v.ayah)}
          <p class="quran-text verse" id="v-{v.surah}-{v.ayah}" class:target={route.ayah === v.ayah}>
            {v.text}&nbsp;<span class="end">{verseEndMark(v.ayah)}</span>
            {#each evs as e (e.id)}
              <a class="chip" dir={pick(e.title, app.lang).dir} lang={pick(e.title, app.lang).lang} href={href({ view: 'explore', eventId: e.id })}>{pick(e.title, app.lang).text}</a>
            {/each}
          </p>
        {/each}
      </div>
      <nav class="pager">
        {#if surah.index > 1}<a href={href({ view: 'quran', surah: surah.index - 1 })}>← Surah {surah.index - 1}</a>{/if}
        {#if surah.index < 114}<a href={href({ view: 'quran', surah: surah.index + 1 })}>Surah {surah.index + 1} →</a>{/if}
      </nav>
    {/if}

    <footer class="credit">
      Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a>, Hafs, Uthmani script,
      copied verbatim (Creative Commons Attribution 3.0; changes not allowed). Check for updates at
      <a href="https://tanzil.net/updates/" target="_blank" rel="noopener">tanzil.net/updates</a>. Font: Amiri Quran (SIL Open
      Font License 1.1).
    </footer>
  </main>
</div>

<style>
  .reader {
    display: grid;
    grid-template-columns: 250px 1fr;
    height: 100%;
    min-height: 0;
  }
  .surah-list {
    overflow-y: auto;
    border-inline-end: 1px solid var(--line);
    background: var(--panel);
  }
  .surah-list ol {
    list-style: none;
    margin: 0;
    padding: 4px 0;
  }
  .surah-list a {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    gap: 6px;
    padding: 4px 10px;
    color: inherit;
    text-decoration: none;
    font-size: 13px;
    align-items: baseline;
  }
  .surah-list a:hover {
    background: #f0f3f2;
  }
  .surah-list a.current {
    background: #e2efea;
    font-weight: 600;
  }
  .no {
    color: var(--muted);
    text-align: end;
  }
  .aname {
    font-family: var(--font-ar);
    font-size: 15px;
  }
  .content {
    overflow-y: auto;
    padding: 12px 28px 40px;
  }
  .search {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
    position: sticky;
    top: -12px;
    background: var(--bg);
    padding: 10px 0;
    z-index: 1;
  }
  .search input[type='search'] {
    flex: 1;
    min-width: 260px;
    font-size: 16px;
    padding: 6px 10px;
  }
  .search label {
    font-size: 13px;
  }
  h2 {
    display: flex;
    gap: 10px;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .aname-title {
    font-family: var(--font-quran);
    font-weight: 400;
    font-size: 26px;
    margin-inline-start: auto;
  }
  .basmala {
    text-align: center;
  }
  .verses .verse {
    margin: 0 0 6px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .verse.target {
    background: #fdf6dc;
  }
  .chip {
    display: inline-block;
    font-family: var(--font-ui);
    font-size: 12px;
    background: #e2efea;
    border-radius: 10px;
    padding: 1px 8px;
    margin-inline-start: 6px;
    text-decoration: none;
    vertical-align: middle;
  }
  .results {
    list-style: none;
    padding: 0;
  }
  .results li {
    border-bottom: 1px solid var(--line);
    padding: 8px 0;
  }
  .where {
    font-size: 13px;
    font-weight: 600;
  }
  mark {
    background: #fbe7a1;
    border-radius: 3px;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  .credit {
    margin-top: 30px;
    font-size: 12px;
    color: var(--muted);
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
</style>
