<script lang="ts">
  /**
   * A journey on the map: numbered stops joined by the route, the part already walked drawn solid.
   * Interactive in the journey view (it flies to each step); a still preview on the home page.
   */
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { onMount, untrack } from 'svelte';
  import { tx } from '../lib/i18n';
  import type { Journey } from '../lib/schema';
  import { app } from '../state/app.svelte';
  import { addBasemaps, latLng, regionLabels, type Basemaps } from '../map/basemap';
  import '../map/map.css';
  import { journeyStops, stepPoint } from './stops';

  let {
    journey,
    current = -1,
    interactive = true,
    /** Pixels on the reading side covered by the story card, kept clear when flying to a stop. */
    cover = 0,
    /** Pixels at the bottom covered by a caption, kept clear when the whole route is shown. */
    coverBottom = 0,
    onpick,
  }: { journey: Journey; current?: number; interactive?: boolean; cover?: number; coverBottom?: number; onpick?: (i: number) => void } = $props();

  const ACCENT = '#1f6f5c';
  let el: HTMLDivElement;
  let map: L.Map | undefined = $state();
  let basemaps: Basemaps;
  let plain = $state(true);
  let routeLayer: L.LayerGroup;
  let stopLayer: L.LayerGroup;
  let altLayer: L.LayerGroup;
  let regions: L.LayerGroup | undefined;
  let zoomControl: L.Control.Zoom | undefined;

  const lang = $derived(app.lang);
  const stops = $derived(journeyStops(journey, app.eventsById, lang));

  onMount(() => {
    const m = L.map(el, {
      zoomControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      zoomSnap: 0.25,
    }).setView([30, 40], 4);
    // The story card covers the reading side, so the map's controls go on the other side.
    const side = () => (app.lang === 'ar' ? 'topleft' : 'topright') as L.ControlPosition;
    basemaps = addBasemaps(m, app.lang, () => (plain = basemaps.plain()), interactive, side);
    if (interactive) zoomControl = L.control.zoom({ position: side() }).addTo(m);
    routeLayer = L.layerGroup().addTo(m);
    altLayer = L.layerGroup().addTo(m);
    stopLayer = L.layerGroup().addTo(m);
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el);
    map = m;
    return () => {
      ro.disconnect();
      m.remove();
    };
  });

  $effect(() => {
    const m = map;
    const l = lang;
    const show = plain;
    if (!m) return;
    untrack(() => {
      regions?.remove();
      regions = show ? regionLabels(m, l).addTo(m) : undefined;
      basemaps.setLang(l);
      zoomControl?.setPosition(l === 'ar' ? 'topleft' : 'topright');
    });
  });

  // Route and stops.
  $effect(() => {
    const m = map;
    const list = stops;
    const cur = current;
    if (!m) return;
    routeLayer.clearLayers();
    stopLayer.clearLayers();
    const order = journey.steps.map((s) => stepPoint(app.eventsById.get(s.event)));
    let prev: { p: [number, number]; i: number } | null = null;
    order.forEach((p, i) => {
      if (!p) return;
      if (prev && (prev.p[0] !== p[0] || prev.p[1] !== p[1])) {
        const walked = cur >= i;
        L.polyline([latLng(prev.p), latLng(p)], {
          color: ACCENT,
          weight: walked ? 4 : 3,
          opacity: walked ? 0.95 : 0.55,
          dashArray: walked ? undefined : '2 9',
          lineCap: 'round',
          interactive: false,
        }).addTo(routeLayer);
      }
      prev = { p, i };
    });
    for (const s of list) {
      const isCurrent = s.steps.includes(cur);
      const visited = s.steps[0] <= cur;
      const num = s.steps.map((i) => i + 1).join(' · ');
      const marker = L.marker(latLng(s.point), {
        icon: L.divIcon({ className: `stop${isCurrent ? ' current' : visited ? ' visited' : ''}`, html: `<span>${num}</span>`, iconSize: [0, 0] }),
        keyboard: false,
        zIndexOffset: isCurrent ? 1000 : 0,
      }).addTo(stopLayer);
      if (onpick) marker.on('click', () => onpick(s.steps.find((i) => i > cur) ?? s.steps[0]));
      if (s.name && (isCurrent || cur < 0)) {
        L.marker(latLng(s.point), {
          icon: L.divIcon({ className: 'stop-label', html: `<span lang="${lang}">${s.name}</span>`, iconSize: [0, 0] }),
          interactive: false,
          keyboard: false,
          zIndexOffset: 900,
        }).addTo(stopLayer);
      }
    }
  });

  // The current step's other opinions on its place, as dashed circles; then fly there.
  $effect(() => {
    const m = map;
    const cur = current;
    const l = lang;
    if (!m) return;
    altLayer.clearLayers();
    const e = cur >= 0 ? app.eventsById.get(journey.steps[cur]?.event ?? '') : undefined;
    e?.place.opinions?.slice(1).forEach((op) => {
      if (op.geometry?.type !== 'Point') return;
      L.circleMarker(latLng(op.geometry.coordinates), { radius: 11, color: ACCENT, weight: 2.5, dashArray: '4 3', fillColor: '#fff', fillOpacity: 0.85 })
        .bindTooltip(tx(op.name, l), { permanent: true, direction: 'right', offset: [12, 0], className: 'alt-tip' })
        .addTo(altLayer);
    });
    untrack(() => frame(m, cur));
  });

  function frame(m: L.Map, cur: number) {
    const pts = stops.map((s) => s.point);
    if (!pts.length) return;
    const pad = interactive ? 60 : 30;
    if (cur < 0) {
      m.fitBounds(L.latLngBounds(pts.map(latLng)), {
        paddingTopLeft: [pad + (app.lang === 'ar' ? 0 : cover), pad],
        paddingBottomRight: [pad + (app.lang === 'ar' ? cover : 0), pad + coverBottom],
        maxZoom: 6,
      });
      return;
    }
    const p = stepPoint(app.eventsById.get(journey.steps[cur]?.event ?? ''));
    if (!p) return;
    const zoom = Math.max(Math.min(m.getZoom(), 7), 5);
    // Shift the target so it lands in the middle of the part of the map the card does not cover.
    const shift = (app.lang === 'ar' ? 1 : -1) * (cover / 2);
    const target = m.unproject(m.project(latLng(p), zoom).add([shift, 0]), zoom);
    m.flyTo(target, zoom, { duration: 0.9 });
  }
</script>

<div class="journey-map" bind:this={el}></div>

<style>
  .journey-map {
    position: absolute;
    inset: 0;
    background: #a9bfd3;
  }
  :global(.alt-tip) {
    font-size: 12.5px;
    border-radius: 7px;
  }
</style>
