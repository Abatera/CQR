<script lang="ts">
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount } from 'svelte';
  import { BASEMAPS, DEFAULT_MAP, PROPOSED_POINT_RADIUS_M } from '../config';
  import { t, tx } from '../lib/i18n';
  import type { CqrEvent, Geometry } from '../lib/schema';
  import { rangesOverlap } from '../lib/years';
  import { app } from '../state/app.svelte';

  let el: HTMLDivElement;
  let map: L.Map | undefined = $state();
  let contextLayer: L.LayerGroup;
  let selectedLayer: L.FeatureGroup;

  const OPINION_COLORS = ['#c0392b', '#2471a3', '#7d3c98', '#b9770e', '#117a65'];

  onMount(() => {
    const m = L.map(el, { zoomControl: true, worldCopyJump: true }).setView(DEFAULT_MAP.center, DEFAULT_MAP.zoom);
    const layers: Record<string, L.TileLayer> = {};
    BASEMAPS.forEach((b, i) => {
      const t = L.tileLayer(b.url, { ...b.options });
      layers[b.name] = t;
      if (i === 0) t.addTo(m);
    });
    L.control.layers(layers, undefined, { position: 'topright' }).addTo(m);
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

  function latLng(c: [number, number]): L.LatLngExpression {
    return [c[1], c[0]];
  }

  function representativePoint(g: Geometry): [number, number] {
    if (g.type === 'Point') return g.coordinates;
    const ring = g.coordinates[0];
    const n = ring.length - 1;
    let lon = 0;
    let lat = 0;
    for (let i = 0; i < n; i++) {
      lon += ring[i][0];
      lat += ring[i][1];
    }
    return [lon / n, lat / n];
  }

  function eventPoint(e: CqrEvent): [number, number] | null {
    if (e.place.geometry) return representativePoint(e.place.geometry);
    const op = e.place.opinions?.find((o) => o.geometry);
    return op?.geometry ? representativePoint(op.geometry) : null;
  }

  /** Draws a geometry: solid for a known place, dashed and shaded for a proposed one. */
  function draw(g: Geometry, proposed: boolean, color: string, label: string): L.Layer {
    if (g.type === 'Point') {
      if (proposed) {
        return L.circle(latLng(g.coordinates), {
          radius: PROPOSED_POINT_RADIUS_M,
          color: '#1d1d1b',
          weight: 2.5,
          dashArray: '6 5',
          fillColor: color,
          fillOpacity: 0.3,
        }).bindTooltip(label);
      }
      return L.circleMarker(latLng(g.coordinates), {
        radius: 9,
        color: '#111',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      }).bindTooltip(label);
    }
    return L.polygon(g.coordinates.map((ring) => ring.map((c) => latLng(c))), {
      color: '#1d1d1b',
      weight: 2.5,
      dashArray: proposed ? '6 5' : undefined,
      fillColor: color,
      fillOpacity: proposed ? 0.3 : 0.45,
    }).bindTooltip(label);
  }

  // The selected event: fly to it and draw it by its location status.
  $effect(() => {
    const m = map;
    const sel = app.selected;
    if (!m) return;
    selectedLayer.clearLayers();
    if (!sel) return;
    const color = app.lanesById.get(sel.lane)?.color ?? '#1f6f5c';
    const p = sel.place;
    if (p.status === 'unknown') return;
    if (p.geometry) selectedLayer.addLayer(draw(p.geometry, p.status === 'proposed', color, tx(sel.title, app.lang)));
    p.opinions?.forEach((op, i) => {
      if (op.geometry) selectedLayer.addLayer(draw(op.geometry, true, OPINION_COLORS[i % OPINION_COLORS.length], tx(op.name, app.lang)));
    });
    const b = selectedLayer.getBounds();
    if (!b.isValid()) return;
    if (b.getNorthEast().equals(b.getSouthWest())) m.flyTo(b.getCenter(), Math.max(m.getZoom(), 6), { duration: 0.8 });
    else m.flyToBounds(b.pad(0.4), { maxZoom: 8, duration: 0.8 });
  });

  // Other events: faint markers. With a selection, only those from the same time window.
  $effect(() => {
    const m = map;
    const events = app.visibleEvents;
    const sel = app.selected;
    if (!m) return;
    contextLayer.clearLayers();
    for (const e of events) {
      if (e.id === sel?.id) continue;
      if (sel && !rangesOverlap(e.when.from, e.when.to, sel.when.from, sel.when.to)) continue;
      const pt = eventPoint(e);
      if (!pt) continue;
      const color = app.lanesById.get(e.lane)?.color ?? '#666';
      L.circleMarker(latLng(pt), {
        radius: 5,
        color,
        weight: 1,
        opacity: 0.6,
        fillColor: color,
        fillOpacity: 0.35,
      })
        .bindTooltip(tx(e.title, app.lang))
        .on('click', () => app.select(e.id))
        .addTo(contextLayer);
    }
  });
</script>

<section class="map" aria-label="Map">
  <div class="leaflet-host" bind:this={el}></div>
  {#if app.selected?.place.status === 'unknown'}
    <div class="notice" lang={app.lang} dir={app.lang === 'ar' ? 'rtl' : 'ltr'}>{t('mapUnknown', app.lang)}</div>
  {/if}
  <div class="caption" lang={app.lang} dir={app.lang === 'ar' ? 'rtl' : 'ltr'}>
    {t(app.selected ? 'mapFaintSelected' : 'mapFaintAll', app.lang)}
  </div>
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
    background: #dfe6e9;
  }
  .notice {
    position: absolute;
    z-index: 500;
    top: 10px;
    left: 50px;
    right: 50px;
    margin: 0 auto;
    max-width: 380px;
    background: rgb(255 255 255 / 0.94);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    text-align: center;
  }
  .caption {
    position: absolute;
    z-index: 500;
    bottom: 22px;
    right: 8px;
    background: rgb(255 255 255 / 0.85);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--muted);
  }
</style>
