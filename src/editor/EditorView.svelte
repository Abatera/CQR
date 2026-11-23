<script lang="ts">
  import { fullCite, shortCite } from '../lib/format';
  import type { Collection } from '../lib/schema';
  import { formatRange } from '../lib/years';
  import { app, CAN_EDIT } from '../state/app.svelte';
  import { href } from '../state/route';
  import EraForm from './EraForm.svelte';
  import EventForm from './EventForm.svelte';
  import LaneForm from './LaneForm.svelte';
  import { COLLECTION_LABEL } from './model';
  import SourceForm from './SourceForm.svelte';

  const route = $derived(app.route.view === 'edit' ? app.route : { view: 'edit' as const, collection: 'events' as Collection });
  const collection = $derived(route.collection);
  let filter = $state('');

  interface Row {
    id: string;
    title: string;
    sub: string;
    draft?: boolean;
  }

  const rows = $derived.by((): Row[] => {
    const c = app.content;
    if (!c) return [];
    switch (collection) {
      case 'events':
        return c.events.map((e) => ({
          id: e.id,
          title: e.title.en,
          sub: `${formatRange(e.when.from, e.when.to)} · ${app.lanesById.get(e.lane)?.name.en ?? e.lane}`,
          draft: e.review === 'draft',
        }));
      case 'lanes':
        return app.lanes.map((l) => ({ id: l.id, title: l.name.en, sub: `order ${l.order}${l.pinned ? ' · pinned' : ''}` }));
      case 'eras':
        return c.eras.map((e) => ({ id: e.id, title: e.name.en, sub: formatRange(e.from, e.to), draft: e.review === 'draft' }));
      case 'sources':
        return [...c.sources]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((s) => ({ id: s.id, title: shortCite(s, s.id), sub: s.title }));
    }
  });

  const shown = $derived.by(() => {
    const f = filter.trim().toLowerCase();
    return f ? rows.filter((r) => `${r.id} ${r.title} ${r.sub}`.toLowerCase().includes(f)) : rows;
  });

  const issues = $derived(app.content?.issues ?? []);
  const issueCount = (c: Collection, id?: string) => issues.filter((i) => i.collection === c && (id === undefined || i.id === id)).length;

  const current = $derived.by(() => {
    const c = app.content;
    const id = route.id;
    if (!c || !id) return undefined;
    switch (collection) {
      case 'events':
        return c.events.find((x) => x.id === id);
      case 'lanes':
        return c.lanes.find((x) => x.id === id);
      case 'eras':
        return c.eras.find((x) => x.id === id);
      case 'sources':
        return c.sources.find((x) => x.id === id);
    }
  });

  function saved(id: string) {
    app.editorDirty = false;
    app.navigate({ view: 'edit', collection, id });
  }

  function deleted() {
    app.editorDirty = false;
    app.navigate({ view: 'edit', collection });
  }

  const TABS: Collection[] = ['events', 'lanes', 'eras', 'sources'];
  const collectionIssues = $derived(issues.filter((i) => i.collection === collection));
</script>

{#if !CAN_EDIT}
  <div class="not-local">
    <h2>Editing works only locally</h2>
    <p>
      This site is static, so it cannot save changes. To add or change content, clone the repository, run
      <code>npm install</code> and <code>npm run dev</code>, and open the Editor there. The forms write the YAML files in
      <code>content/</code>, which you then commit.
    </p>
  </div>
{:else}
  <div class="editor">
    <aside class="list">
      <nav class="tabs" aria-label="Content type">
        {#each TABS as t (t)}
          <a href={href({ view: 'edit', collection: t })} class:active={t === collection}>
            {COLLECTION_LABEL[t].many}
            <span class="count">{app.content?.[t].length ?? 0}</span>
          </a>
        {/each}
      </nav>
      <div class="list-tools">
        <input type="search" bind:value={filter} placeholder="Filter…" aria-label="Filter" />
        <a class="button primary" href={href({ view: 'edit', collection, isNew: true })}>+ New {COLLECTION_LABEL[collection].one}</a>
      </div>
      <ul>
        {#each shown as r (r.id)}
          {@const n = issueCount(collection, r.id)}
          <li>
            <a href={href({ view: 'edit', collection, id: r.id })} class:current={r.id === route.id}>
              <span class="t">{r.title}</span>
              <span class="s">{r.sub}</span>
              <span class="flags">
                {#if r.draft}<span class="flag draft">draft</span>{/if}
                {#if n}<span class="flag issues" title="Open items">{n}</span>{/if}
              </span>
            </a>
          </li>
        {:else}
          <li class="empty">Nothing here yet.</li>
        {/each}
      </ul>
    </aside>

    <section class="pane">
      {#if !app.content}
        <p class="muted">Loading…</p>
      {:else if route.isNew}
        {#key `${collection}-new`}
          {#if collection === 'events'}<EventForm onsaved={saved} />
          {:else if collection === 'lanes'}<LaneForm onsaved={saved} />
          {:else if collection === 'eras'}<EraForm onsaved={saved} />
          {:else}<SourceForm onsaved={saved} />{/if}
        {/key}
      {:else if route.id && !current}
        <p>There is no {COLLECTION_LABEL[collection].one} with the ID "{route.id}". It may have been renamed or deleted.</p>
      {:else if current}
        {#key `${collection}-${route.id}`}
          {#if collection === 'events'}<EventForm initial={current as never} onsaved={saved} ondeleted={deleted} />
          {:else if collection === 'lanes'}<LaneForm initial={current as never} onsaved={saved} ondeleted={deleted} />
          {:else if collection === 'eras'}<EraForm initial={current as never} onsaved={saved} ondeleted={deleted} />
          {:else}<SourceForm initial={current as never} onsaved={saved} ondeleted={deleted} />{/if}
        {/key}
      {:else}
        <div class="overview">
          <h2>{COLLECTION_LABEL[collection].many}</h2>
          <p>
            Choose an item on the left to edit it, or create a new one. Saving writes the YAML files in <code>content/</code>; the
            app reloads automatically. Review the changes with <code>git diff</code> before committing.
          </p>
          <p class="muted">
            A save is refused if it would add an error, such as a reference to a source or event that does not exist. Warnings,
            such as an unsourced claim in a draft, are allowed until the entry is marked "reviewed".
          </p>
          <h3>Open items in {COLLECTION_LABEL[collection].many.toLowerCase()} ({collectionIssues.length})</h3>
          {#if collectionIssues.length}
            <ul class="issues">
              {#each collectionIssues as i, n (n)}
                <li class={i.level}>
                  <span class="lvl">{i.level}</span>
                  {#if i.id}<a href={href({ view: 'edit', collection, id: i.id })}>{i.id}</a>{/if}
                  {#if i.path}<code>{i.path}</code>{/if}
                  {i.message}
                  <span class="muted">({i.file})</span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="muted">None.</p>
          {/if}
          {#if collection === 'sources' && app.content.sources.length}
            <h3>Bibliography</h3>
            <ol class="bib">
              {#each app.content.sources as s (s.id)}<li><a href={href({ view: 'edit', collection: 'sources', id: s.id })}>{s.id}</a>: {fullCite(s)}</li>{/each}
            </ol>
          {/if}
        </div>
      {/if}
    </section>
  </div>
{/if}

<style>
  .editor {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: 100%;
    min-height: 0;
  }
  .list {
    border-inline-end: 1px solid var(--line);
    background: var(--panel);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--line);
  }
  .tabs a {
    padding: 8px 4px;
    text-align: center;
    font-size: 13px;
    text-decoration: none;
    color: #333;
    border-bottom: 2px solid transparent;
  }
  .tabs a.active {
    border-color: var(--accent);
    font-weight: 600;
  }
  .count {
    display: block;
    font-size: 11px;
    color: var(--muted);
  }
  .list-tools {
    display: flex;
    gap: 6px;
    padding: 8px;
  }
  .list-tools input {
    flex: 1;
    min-width: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }
  .list li a {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 6px 10px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f0f0f0;
  }
  .list li a:hover {
    background: #f3f6f5;
  }
  .list li a.current {
    background: #e2efea;
  }
  .t {
    font-size: 14px;
    font-weight: 600;
  }
  .s {
    grid-column: 1;
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flags {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .flag {
    font-size: 10px;
    border-radius: 8px;
    padding: 0 6px;
  }
  .flag.draft {
    background: #fff1cc;
    color: #6b4f00;
  }
  .flag.issues {
    background: #fde2dc;
    color: #8a1f1f;
  }
  .empty {
    padding: 10px;
    color: var(--muted);
  }
  .pane {
    overflow-y: auto;
    padding: 6px 26px 0;
    min-height: 0;
  }
  .issues {
    overflow: visible;
  }
  .issues li {
    font-size: 13px;
    padding: 3px 0;
  }
  .lvl {
    font-size: 10px;
    text-transform: uppercase;
    border-radius: 3px;
    padding: 0 4px;
    margin-inline-end: 4px;
  }
  .error .lvl {
    background: #fde2dc;
    color: #8a1f1f;
  }
  .warning .lvl {
    background: #fff1cc;
    color: #6b4f00;
  }
  .bib {
    font-size: 13px;
  }
  .not-local {
    max-width: 640px;
    margin: 40px auto;
    padding: 0 20px;
  }
</style>
