<script lang="ts">
  import { containsArabic, normalizeArabic } from '../lib/arabic';
  import { foldLatin } from '../lib/text';
  import { pick, t } from '../lib/i18n';
  import { parseRef } from '../lib/quran-ref';
  import type { CqrEvent } from '../lib/schema';
  import { formatRange } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { href, type Route } from '../state/route';
  import Icon from './Icon.svelte';

  let { inputEl = $bindable(), onclose }: { inputEl?: HTMLInputElement; onclose?: () => void } = $props();

  let query = $state('');
  let open = $state(false);
  let active = $state(0);
  const lang = $derived(app.lang);
  const listId = $props.id();

  interface Result {
    key: string;
    route: Route;
    title: string;
    titleLang: 'en' | 'ar';
    sub: string;
    color?: string;
    icon?: 'quran' | 'compass';
  }

  function score(e: CqrEvent, q: string, arabic: boolean): number {
    if (arabic) {
      const nq = normalizeArabic(q);
      const title = normalizeArabic(e.title.ar ?? '');
      if (title.startsWith(nq)) return 3;
      if (title.includes(nq)) return 2;
      if (normalizeArabic(e.summary.ar ?? '').includes(nq)) return 1;
      return 0;
    }
    const fq = foldLatin(q);
    const title = foldLatin(e.title.en);
    if (title.startsWith(fq) || title.split(/[\s(]+/).some((w) => w.startsWith(fq))) return 3;
    if (title.includes(fq)) return 2;
    const extra = [...(e.tags ?? []), ...(e.place.names ?? []).map((n) => n.name), ...(e.place.opinions ?? []).map((o) => o.name.en)].map(foldLatin);
    if (extra.some((x) => x.includes(fq))) return 1.5;
    if (foldLatin(e.summary.en).includes(fq)) return 1;
    return 0;
  }

  const results = $derived.by((): Result[] => {
    const q = query.trim();
    if (q.length < 2) return [];
    const out: Result[] = [];
    const ref = parseRef(q.replace(/\s/g, ''));
    if (ref) {
      out.push({ key: 'ref', route: { view: 'quran', surah: ref.surah, ayah: ref.from }, title: `${t('goToVerse', lang)} ${q}`, titleLang: lang, sub: '', icon: 'quran' });
    }
    const arabic = containsArabic(q);
    const events = (app.content?.events ?? [])
      .map((e) => ({ e, s: score(e, q, arabic) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.e.when.from - b.e.when.from)
      .slice(0, 7);
    for (const { e } of events) {
      const p = pick(e.title, lang);
      out.push({
        key: e.id,
        route: { view: 'explore', eventId: e.id },
        title: p.text,
        titleLang: p.lang,
        sub: formatRange(e.when.from, e.when.to, lang),
        color: app.lanesById.get(e.lane)?.color,
      });
    }
    for (const j of app.journeys) {
      const hay = arabic ? normalizeArabic(j.title.ar ?? '') : foldLatin(j.title.en);
      if (hay.includes(arabic ? normalizeArabic(q) : foldLatin(q))) {
        const p = pick(j.title, lang);
        out.push({ key: `j-${j.id}`, route: { view: 'journey', id: j.id, step: 1 }, title: p.text, titleLang: p.lang, sub: t('journeys', lang), icon: 'compass' });
      }
    }
    if (arabic) {
      out.push({ key: 'quran', route: { view: 'quran', query: q }, title: `${t('searchInQuran', lang)} «${q}»`, titleLang: 'ar', sub: '', icon: 'quran' });
    }
    return out;
  });

  $effect(() => {
    void results;
    active = 0;
  });

  function choose(r: Result | undefined) {
    if (!r) return;
    app.navigate(r.route);
    query = '';
    open = false;
    inputEl?.blur();
    onclose?.();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(results.length - 1, active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(0, active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      query = '';
      open = false;
      inputEl?.blur();
      onclose?.();
    }
  }
</script>

<div class="search" {lang}>
  <label class="box">
    <Icon name="search" size={18} />
    <span class="visually-hidden">{t('searchLabel', lang)}</span>
    <input
      bind:this={inputEl}
      bind:value={query}
      type="search"
      placeholder={t('searchPlaceholder', lang)}
      role="combobox"
      aria-expanded={open && query.trim().length >= 2}
      aria-controls={listId}
      aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
      autocomplete="off"
      onfocus={() => (open = true)}
      onblur={() => setTimeout(() => (open = false), 150)}
      onkeydown={onKey}
    />
    <kbd aria-hidden="true">Ctrl K</kbd>
  </label>
  {#if open && query.trim().length >= 2}
    <ul class="results" id={listId} role="listbox" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {#each results as r, i (r.key)}
        <li id="{listId}-{i}" role="option" aria-selected={i === active}>
          <a href={href(r.route)} class:active={i === active} onmousedown={(e) => e.preventDefault()} onclick={(e) => { e.preventDefault(); choose(r); }}>
            {#if r.icon}<span class="ic"><Icon name={r.icon} size={16} /></span>{:else}<span class="dot" style:background={r.color ?? '#666'}></span>{/if}
            <span class="title" lang={r.titleLang}>{r.title}</span>
            {#if r.sub}<span class="sub">{r.sub}</span>{/if}
          </a>
        </li>
      {:else}
        <li class="empty">{t('searchNoResults', lang)}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .search {
    position: relative;
    flex: 1 1 260px;
    max-width: 520px;
  }
  .box {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 10px 0 12px;
    border: 1px solid var(--control);
    border-radius: 10px;
    background: var(--card);
    color: var(--muted);
  }
  .box:focus-within {
    border-color: #7fb5a6;
    box-shadow: 0 0 0 3px rgb(31 111 92 / 0.12);
  }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0 !important;
    padding: 0;
    background: transparent;
    font-size: 14px;
  }
  input::-webkit-search-cancel-button {
    cursor: pointer;
  }
  kbd {
    font: inherit;
    font-size: 11px;
    border: 1px solid var(--control);
    border-radius: 5px;
    padding: 0 6px;
    color: var(--muted);
    white-space: nowrap;
  }
  .results {
    position: absolute;
    z-index: 2000;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    list-style: none;
    margin: 0;
    padding: 6px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 12px 32px rgb(30 25 10 / 0.16);
    max-height: 60vh;
    overflow-y: auto;
  }
  .results a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--ink);
  }
  .results a.active,
  .results a:hover {
    background: var(--accent-tint);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  .ic {
    color: var(--accent);
    display: inline-flex;
  }
  .title {
    flex: 1;
    min-width: 0;
  }
  .sub {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }
  .empty {
    padding: 8px 10px;
    color: var(--muted);
    font-size: 13px;
  }
  @media (max-width: 760px) {
    kbd {
      display: none;
    }
    .search {
      max-width: none;
    }
  }
</style>
