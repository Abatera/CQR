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

## Proposed by Claude, not yet confirmed

- The four content layers: Quran, tafsir, history and archaeology, and connection, with status and confidence labels ([03](03-content-principles.md)).
- Era bands in the timeline background.
- Lanes by region or civilization, with the Quran lane pinned at the top and an optional theme lane for technology and climate.
- Links between lanes, drawn only while an event is selected, with the types context, consequence and parallel.
- Faint map markers for other events from the same period.
- Shaded areas on the map for disputed locations.
- Lane toggles, a URL for each event, and arrow-key navigation.
- Tanzil as the Quran source, with Amiri Quran or the KFGQPC font ([05](05-quran-data.md)).
- Content in YAML with one file per event, and the schema in [04](04-data-model.md).
- 1200–900 BCE as the first milestone ([07](07-roadmap.md)).

## Open questions (ask the owner)

1. **The undated prophets.** Adam, Noah, Hud, Salih and others have no dates that history can anchor. Should they go in an "undated" section at the start of the timeline, or should the timeline begin only where history can anchor it?
2. **The first milestone.** Should development start with the 1200–900 BCE pilot?
3. **The four layers.** Confirm the model, and decide who assigns the confidence level for connections.
4. **The lanes.** Which lanes does the pilot need? Should there be a theme lane for technology and climate?
5. **UI language.** English, Arabic, or both? Both would need right-to-left support.
6. **Translations.** Which English translation, if any, can be used given copyright? Or should verses link out to another site?
7. **UI framework.** Vanilla TypeScript, Svelte or Preact, or React?
8. **Content format.** YAML or JSON?
9. **Basemap.** A terrain map without modern borders? Which provider?
10. **The Quran reader.** Where does it live in the UI: a separate view or an overlay?
11. **Honorifics.** Which convention should content use, for example "peace be upon him" or ﷺ?
12. **Contributors and review.** Who writes the content, and who reviews it? Is scholarly review wanted?
13. **Mobile.** Is a small-screen layout needed for the first version?
14. **Hijri dates.** For Islamic-era events in later phases, should dates also be shown in the Hijri calendar?
15. **Audience.** Who is the main audience? This affects tone and depth.
