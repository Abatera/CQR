/** Settings that are likely to change. */

/** The timeline's initial window, as historical years (negative = BCE): the whole sequence of prophets. */
export const DEFAULT_VIEW = { from: -5800, to: 800 };

/** The span of the overview strip above the timeline ("all of time"), and the prophets named on it. */
export const OVERVIEW = { from: -5800, to: 800 };
export const OVERVIEW_NAMED = ['adam', 'noah', 'abraham', 'moses', 'david', 'jesus', 'muhammad'];
/** The fewer names shown on a phone, where the strip is narrow. */
export const OVERVIEW_NAMED_NARROW = ['adam', 'noah', 'abraham', 'muhammad'];

/** The narrowest and widest timeline windows, in years. */
export const MIN_SPAN = 5;
export const MAX_SPAN = 20000;

/** Below this width the app switches to its phone layout. */
export const NARROW_QUERY = '(max-width: 760px)';

const ATTR_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Basemaps. The first is the default: terrain with no modern borders or place names, since
 * those are anachronistic (docs/02-ui-design.md). It is served by Stadia Maps, which needs the
 * site's domain registered in a (free, non-commercial) Stadia account; until it is, or if its
 * tiles fail for any other reason, the map falls back to the second basemap by itself.
 * Check each provider's usage policy: the standard OpenStreetMap tile server allows only light use.
 */
export const BASEMAPS = [
  {
    id: 'terrain',
    name: { en: 'Terrain, without modern names', ar: 'تضاريس بلا أسماء حديثة' },
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 16,
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
        ATTR_OSM,
    },
  },
  {
    id: 'topo',
    name: { en: 'Terrain with modern names (OpenTopoMap)', ar: 'تضاريس بالأسماء الحديثة (OpenTopoMap)' },
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc',
      maxZoom: 15,
      attribution: `Map data ${ATTR_OSM}, SRTM | Map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`,
    },
  },
  {
    id: 'osm',
    name: { en: 'Streets (OpenStreetMap)', ar: 'شوارع (OpenStreetMap)' },
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 18, attribution: ATTR_OSM },
  },
] as const;

/**
 * Region names drawn on the map instead of modern ones: broad, long-lived names that the
 * commentators and historians use. They are labels for orientation, not claims about borders.
 */
export const REGION_LABELS: { en: string; ar: string; lat: number; lon: number; size?: 'l' | 's' }[] = [
  { en: 'Mesopotamia', ar: 'بلاد الرافدين', lat: 33.0, lon: 44.6, size: 'l' },
  { en: 'al-Jazira', ar: 'الجزيرة', lat: 36.3, lon: 40.4 },
  { en: 'al-Sham', ar: 'بلاد الشام', lat: 34.2, lon: 37.4 },
  { en: 'Anatolia', ar: 'الأناضول', lat: 39.2, lon: 33.6, size: 'l' },
  { en: 'Egypt', ar: 'مصر', lat: 26.6, lon: 30.4, size: 'l' },
  { en: 'Sinai', ar: 'سيناء', lat: 29.6, lon: 33.9, size: 's' },
  { en: 'Hijaz', ar: 'الحجاز', lat: 23.8, lon: 39.4 },
  { en: 'Najd', ar: 'نجد', lat: 25.0, lon: 44.6 },
  { en: 'Yemen', ar: 'اليمن', lat: 15.4, lon: 45.2 },
  { en: 'Persia', ar: 'فارس', lat: 31.0, lon: 53.5, size: 'l' },
];

/** Map view when nothing is selected: the Eastern Mediterranean and the Near East. */
export const DEFAULT_MAP = { center: [30.5, 38] as [number, number], zoom: 4 };

/** Radius drawn around a proposed location given as a single point. */
export const PROPOSED_POINT_RADIUS_M = 40000;
