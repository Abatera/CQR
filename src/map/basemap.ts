/**
 * Shared map setup: the basemaps (with a fallback when the default fails) and the layer of
 * ancient region names. Used by the explore map and the journey map.
 */
import L from 'leaflet';
import { BASEMAPS, REGION_LABELS } from '../config';
import type { Lang } from '../lib/i18n';

export interface Basemaps {
  /** Rebuilds the layer switcher's labels in another language. */
  setLang(lang: Lang): void;
  /** Whether the current basemap is the one without modern names (region names are drawn only then). */
  plain(): boolean;
}

export function addBasemaps(
  m: L.Map,
  lang: Lang,
  onChange: () => void = () => {},
  withControl = true,
  /** Where the layer switcher goes; the journey map keeps it off the story card's side. */
  position: L.ControlPosition | (() => L.ControlPosition) = 'topright',
): Basemaps {
  const layers = BASEMAPS.map((b) => ({ b, layer: L.tileLayer(b.url, { ...b.options }) }));
  const [terrain, fallback] = layers;
  let current: string = terrain.b.id;
  terrain.layer.addTo(m);

  // If the default basemap fails before any tile loads (for example, when the site's domain is
  // not yet registered with Stadia Maps), switch to the fallback once, without the reader noticing.
  let loaded = false;
  let errors = 0;
  terrain.layer.on('tileload', () => (loaded = true));
  terrain.layer.on('tileerror', () => {
    errors += 1;
    if (!loaded && errors >= 3 && m.hasLayer(terrain.layer)) {
      m.removeLayer(terrain.layer);
      fallback.layer.addTo(m);
      current = fallback.b.id;
      onChange();
    }
  });

  let control: L.Control.Layers | undefined;
  const build = (l: Lang) => {
    if (!withControl) return;
    control?.remove();
    const pos = typeof position === 'function' ? position() : position;
    control = L.control.layers(Object.fromEntries(layers.map(({ b, layer }) => [b.name[l], layer])), undefined, { position: pos }).addTo(m);
  };
  build(lang);

  m.on('baselayerchange', (e: L.LayersControlEvent) => {
    current = layers.find((x) => x.layer === e.layer)?.b.id ?? current;
    onChange();
  });

  return { setLang: build, plain: () => current === terrain.b.id };
}

/** The ancient region names, in a pane under the markers. */
export function regionLabels(m: L.Map, lang: Lang): L.LayerGroup {
  if (!m.getPane('regions')) {
    const pane = m.createPane('regions');
    pane.style.zIndex = '350';
    pane.style.pointerEvents = 'none';
  }
  const g = L.layerGroup();
  for (const r of REGION_LABELS) {
    const text = lang === 'ar' ? r.ar : r.en;
    L.marker([r.lat, r.lon], {
      icon: L.divIcon({ className: `region-label ${r.size ?? ''}`, html: `<span lang="${lang}">${text}</span>`, iconSize: [0, 0] }),
      interactive: false,
      keyboard: false,
      pane: 'regions',
    }).addTo(g);
  }
  return g;
}

/** A point standing for a geometry: the point itself, or the average of an area's corners. */
export function representativePoint(g: { type: 'Point'; coordinates: [number, number] } | { type: 'Polygon'; coordinates: [number, number][][] }): [number, number] {
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

export function latLng(c: [number, number]): L.LatLngExpression {
  return [c[1], c[0]];
}
