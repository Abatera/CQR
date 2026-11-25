/** Settings that are likely to change. */

/** The timeline's initial window, as historical years (negative = BCE): the whole sequence of prophets. */
export const DEFAULT_VIEW = { from: -4400, to: 800 };

/** The narrowest and widest timeline windows, in years. */
export const MIN_SPAN = 5;
export const MAX_SPAN = 20000;

/**
 * Basemaps. The basemap is still an open question (docs/08-decisions.md, question 9):
 * modern borders and place names are anachronistic, so a terrain map with few labels
 * is probably the better default. Check each provider's usage policy before
 * deploying: the standard OpenStreetMap tile server allows only light use.
 */
export const BASEMAPS = [
  {
    name: 'Terrain (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc',
      maxZoom: 15,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },
  {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
] as const;

/** Map view when nothing is selected: the Eastern Mediterranean and the Near East. */
export const DEFAULT_MAP = { center: [30.5, 38] as [number, number], zoom: 4 };

/** Radius drawn around a proposed location given as a single point. */
export const PROPOSED_POINT_RADIUS_M = 40000;
