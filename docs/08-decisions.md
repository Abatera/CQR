# Decisions and open questions

All entries are from the planning conversation on 2026-11-23.

## Decided by the owner

| # | Decision |
|---|---|
| D1 | The name is **Chronotope of Quranic Reality**. It is a public, educational GitHub project. |
| D2 | It is an **interactive visual web app**. A documentation site, a Markdown-only repo and a dataset with notebooks were all considered and not chosen. |
| D3 | The focus is the **time and space of Quranic narratives**, specifically linking Quranic events to history known across civilizations, **including consequences**. |
| D4 | The layout has a **timeline at the top, a map at the lower left, and facts at the lower right**. Selecting a point drives the other two panels. |
| D5 | **No branches.** The first git-graph idea was dropped in favor of **multiple independent, parallel timeline lanes** for events that happen independently at the same time. |
| D6 | Time is shown as **periods**, researched as precisely as possible, not just as an order of events. |
| D7 | The map covers **earthly places only**. The unseen and the Hereafter are out of scope. |
| D8 | If a location is not known, it is **described, not pinned**. |
| D9 | The project needs a **high-quality, readable, searchable Hafs Quran text** database. |
| D10 | The stack is **Vite and TypeScript, Leaflet with OpenStreetMap tiles, a custom SVG timeline, a static site, and GitHub Pages**. The owner said: "I also agree on the stack you chose." |
| D11 | The licenses are **CC BY-SA 4.0 for content and MIT for code**. |
| D12 | **Local only for now.** No GitHub repo yet, and none is created without asking. |
| D13 | The David and iron idea is kept in its refined form: **the timing** fits the spread of iron, not "a monopoly on iron". See [03-content-principles.md](03-content-principles.md). |

## Decided on 2026-11-23, on the development machine

| # | Decision |
|---|---|
| D14 | Claude recommended four answers to the questions that blocked the scaffold, and the owner replied "Implement it": **Svelte** as the UI framework, **YAML** content compiled to JSON, an **English UI with optional Arabic text** in every reader-facing field (`{ en, ar }`), and the **1200–900 BCE pilot** as the first milestone. These close former open questions 2, 5, 7 and 8. A full Arabic, right-to-left UI remains a later feature. |
| D15 | The owner asked for "all the needed forms to add whatever information or data". They are implemented as a **local editor**: forms for events, lanes, eras and sources that run on the dev server (`npm run dev`) and write the YAML files in `content/`. The published site stays static and read-only. |

## Implemented as proposed, not yet confirmed by the owner

These were built as proposed, because the app needed them, but the owner has not explicitly confirmed them. Each is easy to change.

- The four content layers: Quran, tafsir, history and archaeology, and connection, with status and confidence labels ([03](03-content-principles.md)).
- Era bands in the timeline background.
- Lanes by region or civilization, with the Quran lane pinned at the top and a theme lane for technology and climate. Seeded lanes: Quran, Levant, Egypt, Anatolia, Mesopotamia, Arabia, Technology and climate. The Aegean has no lane yet because no event needs one.
- Links between lanes, drawn only while an event is selected, with the types context, consequence and parallel.
- Faint map markers for other events from the same period.
- Shaded areas on the map for disputed locations.
- Lane toggles, a URL for each event, and arrow-key navigation.
- Tanzil as the Quran source ([05](05-quran-data.md)).
- One YAML file per event, with the schema in [04](04-data-model.md).

## Choices Claude made while implementing (confirm with the owner)

- **Tanzil XML format**, so the basmala stays apart from verse 1. The plain-text format puts the basmala in front of verse 1 of each surah ([05](05-quran-data.md)).
- **Amiri Quran** as the Quran font, for its clear license (SIL OFL 1.1). The KFGQPC font's terms were not checked. Rendering has been checked only in Chrome so far.
- **Default basemap: OpenTopoMap** (terrain), with OpenStreetMap as the alternative. Both still show modern borders and place names, so open question 9 remains.
- **A `review` field** (`draft` or `reviewed`) on events and eras. A draft may have unsourced claims and a connection without a confidence level; these are warnings. A reviewed entry may not; they are errors that fail the build. Drafts are labeled in the app.
- **A `notes` field** for editorial notes. They are not shown to readers and appear only on the local dev server.
- **Schema refinements** to [04](04-data-model.md): `basis` is a language map; location opinions and alternative dates take a `sources` list; place names have the form `{ name, type: ancient | modern, language }`; geometry is a GeoJSON Point or Polygon.
- **A proposed location given as a single point** is drawn as a dashed circle 40 km across, not as a pin.
- **An unknown location** shows a short notice on the map ("described in the facts panel") and nothing else.
- **The Quran reader is a separate view.** The facts panel links to it ("open in reader"), and the reader links verses back to the events that cite them. Open question 10 asked about this; the owner can still choose an overlay instead.
- **Draft pilot content:** 15 events, 4 eras and 1 source, written only from the leads in these docs. Every one is a draft, with what still needs checking in its `notes`. The verse references were checked against the dataset text; the historical leads were not checked against sources.
- **Vitest** for unit tests, with an end-to-end check of the editor forms run by hand during development.

## Open questions (ask the owner)

1. **The undated prophets.** Adam, Noah, Hud, Salih and others have no dates that history can anchor. Should they go in an "undated" section at the start of the timeline, or should the timeline begin only where history can anchor it?
3. **The four layers.** Confirm the model (now implemented), and decide who assigns the confidence level for connections. The editor currently says "set by the owner".
4. **The lanes.** Confirm the seeded lanes and the technology and climate lane.
6. **Translations.** Which English translation, if any, can be used given copyright? Or should verses link out to another site? None is included yet; search works on the Arabic text only.
9. **Basemap.** A terrain map without modern borders? Which provider? See the note on OpenTopoMap above.
10. **The Quran reader.** Confirm the separate view (see above), or choose an overlay.
11. **Honorifics.** Which convention should content use, for example "peace be upon him" or ﷺ? The draft content uses none for now.
12. **Contributors and review.** Who writes the content, and who reviews it? Is scholarly review wanted?
13. **Mobile.** Is a small-screen layout needed for the first version? The current layout is for desktop screens.
14. **Hijri dates.** For Islamic-era events in later phases, should dates also be shown in the Hijri calendar?
15. **Audience.** Who is the main audience? This affects tone and depth.

Questions 2, 5, 7 and 8 were answered by D14.
