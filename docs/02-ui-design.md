# UI design

## Layout (decided)

The app has three panels on one screen:

```
┌──────────────────────────────────────────────────────────┐
│  TIMELINE                         (top, full width)      │
├────────────────────────────┬─────────────────────────────┤
│  MAP                       │  FACTS                      │
│  (lower left)              │  (lower right)              │
└────────────────────────────┴─────────────────────────────┘
```

Selecting an event on the timeline does three things:

1. highlights the event on the timeline;
2. moves the map to the event's location, if the location is known;
3. shows the event's facts in the right panel.

## Timeline

### How this design was reached

The owner's first picture was a horizontal git-style graph, where each point is like a commit. They later dropped branches. The decided design is **several independent, parallel lanes on one shared time axis**, because many events happened independently at the same time in different places.

### Mockup

The positions are illustrative and the facts are unverified:

```
              1300 BCE      1200          1100          1000          900
Eras          ░ Late Bronze ░│▓ collapse ▓│░░░ Iron I ░░░│░░ Iron II ░░░
Quran                        │             │       ●Talut ●David ●Solomon
Levant                       ●Sea Peoples  │             │  ●copper mines
Egypt         ══ New Kingdom ══●Ramesses III══╡ Third Intermediate ══
Anatolia      ══ Hittite Empire ═╡ (falls c. 1180)
```

### Elements

- **Time axis.** Years BCE/CE, horizontal, with zoom and pan. The span covers thousands of years, so zoom is required.
- **Events are periods (decided).** Each event has a range and a stated certainty, researched "as precise as we can", in the owner's words. Short or precisely dated events are drawn as dots, long ones as bars.
- **Periods and polities** are drawn as long bars inside a lane, such as the Egyptian New Kingdom or the Hittite Empire. A bar that stops at the collapse tells the story without any text.
- **Lanes (decided in principle; the exact list is open).**
  - *Proposed:* one lane per region or civilization, such as Egypt, the Levant, Anatolia, Mesopotamia, Arabia and the Aegean.
  - *Proposed:* the Quran lane is always pinned at the top.
  - *Proposed:* an optional theme lane, "technology and climate", for things like the spread of iron.
- **Era bands (proposed).** Shaded background bands for archaeological periods: Late Bronze Age, the collapse, Iron Age I, Iron Age II. These period names are specific to regions (they fit the Near East and the Eastern Mediterranean), so the bands are context, not hard boundaries.
- **Stacking.** Overlapping items in the same lane stack automatically into sub-rows.
- **Lane toggles (proposed).** Readers can switch lanes on and off, and possibly reorder them, so the panel doesn't get crowded.

### Links between lanes (proposed)

Events can be related to events in other lanes with the types `context`, `consequence` and `parallel`. The links are drawn as faint connectors **only while an event is selected**, so the default view stays clean.

## Map

- Leaflet, earthly places only (decided).
- The selected event: the map flies to its location and highlights it.
- *Proposed:* other events from the same time window appear as faint markers, so the reader sees what else was happening in the world at that moment.
- How each location status is shown:

  | Status | On the map | In the facts panel |
  |---|---|---|
  | `known` | a marker | the place's names |
  | `proposed` (disputed) | a shaded area, or several candidate areas | each opinion, with its source |
  | `unknown` | nothing (decided by the owner) | what the text says about the place |

  For an unknown location, the map may zoom to the wider region, but only if the region itself is not disputed.
- **Basemap (open).** Modern borders and place names are anachronistic and can be politically sensitive. A terrain or physical basemap with minimal labels is probably a better fit. Ancient and modern names can be given in the facts panel instead.

## Facts panel

For the selected event, in this order:

1. The title, the period with its certainty, and the place with its status.
2. **Quran.** Verse references. Clicking a reference shows the verse in Uthmani script, from the verified dataset.
3. **Tafsir.** What classical commentators said, with citations.
4. **History and archaeology.** Claims, each with a status (established or debated) and sources.
5. **Connection.** The project's own reflection linking the layers above. It has a confidence level and is clearly labeled as interpretation.
6. Related events (clickable) and the list of sources.

These layers are *proposed*. The rules behind them are in [03-content-principles.md](03-content-principles.md).

## Quran reader and search

The owner wants a readable, searchable Hafs Quran ([05-quran-data.md](05-quran-data.md)). Where it lives in the UI is **open**. It could be a separate view or tab, or an overlay opened from the facts panel. An idea for later: searching a word could also list the timeline events that cite matching verses.

## Other UI points

- *Proposed:* each event has its own URL, such as `#/event/david-armor`, so it can be shared.
- *Proposed:* the left and right arrow keys step through events.
- Not discussed yet: the layout on mobile and small screens, the UI language (English, Arabic, or both with right-to-left support), and dark mode.
