<script lang="ts">
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount, untrack } from 'svelte';
  import { DEFAULT_MAP, PROPOSED_POINT_RADIUS_M } from '../config';
  import { pick, t, tx } from '../lib/i18n';
  import type { CqrEvent, Geometry } from '../lib/schema';
  import { rangesOverlap } from '../lib/years';
  import { app } from '../state/app.svelte';
  import { addBasemaps, latLng, regionLabels, representativePoint, type Basemaps } from './basemap';
  import './map.css';

  let el: HTMLDivElement;
  let map: L.Map | undefined = $state();
  let basemaps: Basemaps;
  let plainBasemap = $state(true);
  let contextLayer: L.LayerGroup;
  let selectedLayer: L.FeatureGroup;
  let regions: L.LayerGroup | undefined;
  let contextCount = $state(0);

  const ACCENT = '#1f6f5c';
  const lang = $derived(app.lang);

  onMount(() => {
    const m = L.map(el, { zoomControl: true, worldCopyJump: true }).setView(DEFAULT_MAP.center, DEFAULT_MAP.zoom);
    basemaps = addBasemaps(m, app.lang, () => (plainBasemap = basemaps.plain()));
    L.control.scale({ imperial: false }).addTo(m);
    contextLayer = L.layerGroup().addTo(m);
    selectedLayer = L.featureGroup().addTo(m);
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el);
    map = m;
    return () => {
      ro.disconnect();
      m.remove();
    };
  });

  // Region names, in the reader's language, only on the basemap without modern names.
  $effect(() => {
    const m = map;
    const l = lang;
    const show = plainBasemap;
    if (!m) return;
    untrack(() => {
      regions?.remove();
      regions = show ? regionLabels(m, l).addTo(m) : undefined;
      basemaps.setLang(l);
    });
  });

  function eventPoint(e: CqrEvent): [number, number] | null {
    if (e.place.geometry) return representativePoint(e.place.geometry);
    const op = e.place.opinions?.find((o) => o.geometry);
    return op?.geometry ? representativePoint(op.geometry) : null;
  }

  /** A known place: a marked point, or an outlined area. */
  function drawKnown(g: Geometry, color: string, label: string): L.Layer {
    if (g.type === 'Point') {
      return L.marker(latLng(g.coordinates), {
        icon: L.divIcon({ className: 'sel-point', html: `<span style="--c:${color}"></span>`, iconSize: [0, 0] }),
        keyboard: false,
      }).bindTooltip(label, { direction: 'top', offset: [0, -14] });
    }
    return L.polygon(g.coordinates.map((ring) => ring.map((c) => latLng(c))), {
      color: ACCENT,
      weight: 2.5,
      fillColor: color,
      fillOpacity: 0.3,
    }).bindTooltip(label);
  }

  /** A proposed place: a dashed, lightly shaded area, or a circle around a point. */
  function drawProposed(g: Geometry, strong: boolean, label: string): L.Layer {
    const style = { color: ACCENT, weight: 2.5, dashArray: '7 6', fillColor: ACCENT, fillOpacity: strong ? 0.18 : 0.08 };
    if (g.type === 'Point') return L.circle(latLng(g.coordinates), { radius: PROPOSED_POINT_RADIUS_M, ...style }).bindTooltip(label);
    return L.polygon(g.coordinates.map((ring) => ring.map((c) => latLng(c))), style).bindTooltip(label);
  }

  function letterBadge(at: [number, number], letter: string, filled: boolean): L.Marker {
    return L.marker(latLng(at), {
      icon: L.divIcon({ className: `opinion-badge${filled ? '' : ' hollow'}`, html: `<span>${letter}</span>`, iconSize: [0, 0] }),
      keyboard: false,
      interactive: false,
    });
  }

  // The selected event: fly to it and draw it by its location status.
  $effect(() => {
    const m = map;
    const sel = app.selected;
    const l = lang;
    if (!m) return;
    selectedLayer.clearLayers();
    if (!sel) return;
    const color = app.lanesById.get(sel.lane)?.color ?? ACCENT;
    const p = sel.place;
    if (p.status === 'unknown') return;
    if (p.geometry) {
      selectedLayer.addLayer(p.status === 'proposed' ? drawProposed(p.geometry, true, tx(sel.title, l)) : drawKnown(p.geometry, color, tx(sel.title, l)));
    }
    p.opinions?.forEach((op, i) => {
      if (!op.geometry) return;
      selectedLayer.addLayer(drawProposed(op.geometry, i === 0, tx(op.name, l)));
      selectedLayer.addLayer(letterBadge(representativePoint(op.geometry), String.fromCharCode(65 + i), i === 0));
    });
    const b = selectedLayer.getBounds();
    if (!b.isValid()) return;
    if (b.getNorthEast().equals(b.getSouthWest())) m.flyTo(b.getCenter(), Math.max(m.getZoom(), 6), { duration: 0.8 });
    else m.flyToBounds(b.pad(0.45), { maxZoom: 8, duration: 0.8 });
  });

  // Other events: with a selection, those from the same time, as diamonds in their lane's color;
  // without one, every event with a place, as faint dots.
  $effect(() => {
    const m = map;
    const events = app.visibleEvents;
    const sel = app.selected;
    const l = lang;
    if (!m) return;
    contextLayer.clearLayers();
    let n = 0;
    for (const e of events) {
      if (e.id === sel?.id) continue;
      if (sel && !rangesOverlap(e.when.from, e.when.to, sel.when.from, sel.when.to)) continue;
      const pt = eventPoint(e);
      if (!pt) continue;
      const color = app.lanesById.get(e.lane)?.color ?? '#666';
      const marker = sel
        ? L.marker(latLng(pt), {
            icon: L.divIcon({ className: 'ctx-diamond', html: `<span style="--c:${color}"></span>`, iconSize: [0, 0] }),
            keyboard: false,
          })
        : L.circleMarker(latLng(pt), { radius: 5, color, weight: 1, opacity: 0.7, fillColor: color, fillOpacity: 0.4 });
      marker
        .bindTooltip(pick(e.title, l).text)
        .on('click', () => app.select(e.id))
        .addTo(contextLayer);
      n += 1;
    }
    contextCount = n;
  });

  const opinions = $derived(app.selected?.place.opinions ?? []);
</script>

<section class="map" aria-label="Map" {lang}>
  <div class="leaflet-host" bind:this={el}></div>
  {#if app.selected?.place.status === 'unknown'}
    <div class="notice" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{t('mapUnknown', lang)}</div>
  {/if}
  {#if !app.narrow && (opinions.length || (app.selected && contextCount))}
    <div class="legend" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {#if opinions.length}
        <div class="legend-title">{t('mapOpinions', lang)}</div>
        {#each opinions as op, i (i)}
          <div class="row">
            <span class="badge" class:hollow={i > 0}>{String.fromCharCode(65 + i)}</span>
            <span lang={pick(op.name, lang).lang}>{pick(op.name, lang).text}{op.geometry ? '' : t('notMapped', lang)}</span>
          </div>
        {/each}
        <div class="note">{t('roughSketches', lang)}</div>
      {/if}
      {#if app.selected && contextCount}
        <div class="row ctx"><span class="diamond"></span><span>{t('mapSameTime', lang)}</span></div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .map {
    position: relative;
    height: 100%;
    min-height: 0;
  }
  .leaflet-host {
    position: absolute;
    inset: 0;
    background: #a9bfd3;
  }
  .notice {
    position: absolute;
    z-index: 500;
    top: 12px;
    left: 56px;
    right: 56px;
    margin: 0 auto;
    max-width: 400px;
    background: rgb(252 251 248 / 0.96);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 13px;
    text-align: center;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
  }
  .legend {
    position: absolute;
    z-index: 500;
    left: 12px;
    bottom: 28px;
    max-width: min(380px, calc(100% - 24px));
    background: rgb(252 251 248 / 0.96);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12.5px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
  }
  .legend-title {
    font-weight: 600;
    margin-bottom: 6px;
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-top: 4px;
  }
  .badge {
    flex: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1f6f5c;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: inline-grid;
    place-items: center;
    transform: translateY(3px);
  }
  .badge.hollow {
    background: #fff;
    color: #1f6f5c;
    box-shadow: inset 0 0 0 2px #1f6f5c;
  }
  .note {
    margin-top: 6px;
    color: var(--muted);
    font-size: 11.5px;
  }
  .row.ctx {
    align-items: center;
  }
  .diamond {
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    background: #3a6ea5;
    margin: 0 4px;
    flex: none;
  }
  .legend:lang(ar) {
    font-size: 14px;
  }
  @media (max-width: 760px) {
    .legend {
      bottom: 22px;
      left: 8px;
      font-size: 12px;
      padding: 8px 10px;
    }
  }
</style>
