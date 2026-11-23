<script lang="ts">
  /**
   * Picks a point or draws an area on a small map. Coordinates are stored as GeoJSON
   * [longitude, latitude], rounded to 4 decimals (about 10 m).
   */
  import L from 'leaflet';
  import { onMount } from 'svelte';
  import { BASEMAPS, DEFAULT_MAP } from '../../config';
  import type { Geometry } from '../../lib/schema';
  import FieldError from './FieldError.svelte';

  let { value = $bindable(), path, label = 'On the map' }: { value: Geometry | undefined; path: string; label?: string } = $props();

  type Mode = 'point' | 'polygon';
  let mode = $state<Mode>(value?.type === 'Polygon' ? 'polygon' : 'point');
  /** Corners of the area being drawn, without the closing point. */
  let corners = $state<[number, number][]>(value?.type === 'Polygon' ? value.coordinates[0].slice(0, -1) : []);

  let el: HTMLDivElement;
  let map: L.Map | undefined = $state();
  let layer: L.LayerGroup;

  const r4 = (n: number) => Math.round(n * 10000) / 10000;

  function setCorners(c: [number, number][]) {
    corners = c;
    value = c.length >= 3 ? { type: 'Polygon', coordinates: [[...c, c[0]]] } : undefined;
  }

  function setMode(m: Mode) {
    if (m === mode) return;
    if (value && !confirm('Switching clears the current location. Continue?')) return;
    mode = m;
    corners = [];
    value = undefined;
  }

  onMount(() => {
    const b = BASEMAPS[0];
    const m = L.map(el, { worldCopyJump: true }).setView(DEFAULT_MAP.center, DEFAULT_MAP.zoom);
    L.tileLayer(b.url, { ...b.options }).addTo(m);
    layer = L.layerGroup().addTo(m);
    m.on('click', (ev: L.LeafletMouseEvent) => {
      const ll = ev.latlng.wrap();
      const c: [number, number] = [r4(ll.lng), r4(ll.lat)];
      if (mode === 'point') value = { type: 'Point', coordinates: c };
      else setCorners([...corners, c]);
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el);
    map = m;
    if (value) {
      const pts = value.type === 'Point' ? [value.coordinates] : value.coordinates[0];
      const bounds = L.latLngBounds(pts.map((p) => [p[1], p[0]] as [number, number]));
      if (value.type === 'Point') m.setView(bounds.getCenter(), 6);
      else m.fitBounds(bounds.pad(0.3));
    }
    return () => {
      ro.disconnect();
      m.remove();
    };
  });

  $effect(() => {
    const m = map;
    const v = value;
    const c = corners;
    if (!m) return;
    layer.clearLayers();
    if (mode === 'point' && v?.type === 'Point') {
      L.circleMarker([v.coordinates[1], v.coordinates[0]], { radius: 8, color: '#111', weight: 2, fillColor: '#1f6f5c', fillOpacity: 0.9 }).addTo(layer);
    }
    if (mode === 'polygon' && c.length) {
      const lls = c.map((p) => [p[1], p[0]] as [number, number]);
      if (c.length >= 3) L.polygon(lls, { color: '#1f6f5c', weight: 2, fillOpacity: 0.2 }).addTo(layer);
      else L.polyline(lls, { color: '#1f6f5c', weight: 2, dashArray: '4 4' }).addTo(layer);
      lls.forEach((ll) => L.circleMarker(ll, { radius: 4, color: '#1f6f5c', weight: 2, fillColor: '#fff', fillOpacity: 1 }).addTo(layer));
    }
  });

  function setPoint(i: 0 | 1, text: string) {
    const n = Number(text);
    const cur: [number, number] = value?.type === 'Point' ? [...value.coordinates] : [0, 0];
    cur[i] = text.trim() === '' || !Number.isFinite(n) ? NaN : n;
    value = { type: 'Point', coordinates: cur };
  }
</script>

<div class="field geometry">
  <span class="label">{label}</span>
  <div class="modes">
    <label><input type="radio" checked={mode === 'point'} onchange={() => setMode('point')} /> Point</label>
    <label><input type="radio" checked={mode === 'polygon'} onchange={() => setMode('polygon')} /> Area</label>
    {#if mode === 'point'}
      <span class="hint">Click the map to place the point, or type the coordinates.</span>
    {:else}
      <span class="hint">Click the map to add corners ({corners.length} so far; at least 3).</span>
    {/if}
  </div>
  <div class="mini-map" bind:this={el}></div>
  <div class="coords">
    {#if mode === 'point'}
      <label>Longitude <input type="number" step="0.0001" value={value?.type === 'Point' ? value.coordinates[0] : ''} oninput={(e) => setPoint(0, e.currentTarget.value)} /></label>
      <label>Latitude <input type="number" step="0.0001" value={value?.type === 'Point' ? value.coordinates[1] : ''} oninput={(e) => setPoint(1, e.currentTarget.value)} /></label>
    {:else}
      <button type="button" class="small" disabled={!corners.length} onclick={() => setCorners(corners.slice(0, -1))}>Undo last corner</button>
    {/if}
    <button type="button" class="small" disabled={!value && !corners.length} onclick={() => { corners = []; value = undefined; }}>Clear</button>
  </div>
  <FieldError {path} />
</div>

<style>
  .modes {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 13px;
  }
  .mini-map {
    height: 240px;
    border: 1px solid var(--line);
    border-radius: 6px;
    margin: 6px 0;
    cursor: crosshair;
  }
  .coords {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 13px;
  }
  .coords input {
    width: 110px;
  }
</style>
