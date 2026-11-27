# UI design

The design is called **Strata** (D27, 2026-11-27). The five layers of knowledge that every entry keeps apart become the design itself: each layer has one color, icon, order and name, used the same way in every view. The concept, with desktop and phone screens, is on a design canvas: https://claude.ai/artifact/XJKT6aN4WSPxNZBpZgJ78g (private to the owner).

## Principles

1. **Keep the layers apart.** Quran (emerald), Tafsir (indigo), Tradition (ochre), History (terracotta), Our reflection (plum, always dashed). Never blended, always in that order.
2. **Show how sure.** Every date and place carries its certainty in the drawing, not only in a label.
3. **Place before detail.** Start from where and when; the sources open up from there.
4. **Calm, never sensational.** Quiet colors and plain words. The Quran's text gets the most room.

The mark is a circle of time crossed by a meridian, with one moment on it: one moment, one place.

## Views

| URL | View |
|---|---|
| `#/` | **Home**: what the site is, a live map of a featured journey, the journeys, and "How to read an entry". |
| `#/explore`, `#/event/<id>` | **Explore**: the "all of time" strip, the timeline, the map and the entry panel. |
| `#/journeys`, `#/journey/<id>/<step>` | **Journeys** (D28): the list, and one journey walked step by step. |
| `#/quran` | The Quran reader and search. |
| `#/about` | About, licenses and credits. |
| `#/edit/…` | The editor, on the local dev server only. |

The header has the mark, a search box (events by title, place or tag in either language; a verse reference opens the verse; Arabic text can be searched in the Quran; Ctrl+K or "/"), the views, and the EN / عربي switch.

## Explore

```
┌──────────────────────────────────────────────────────────┐
│  ALL OF TIME  [▒▒▒▒▒[  window  ]▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒]   │
├──────────────────────────────────────────────────────────┤
│  TIMELINE: lanes on one shared time axis                 │
├────────────────────────────────┬─────────────────────────┤
│  MAP                           │  ENTRY                  │
└────────────────────────────────┴─────────────────────────┘
```

Selecting an event highlights it on the timeline with a band across all lanes, moves the map to its place, and opens its entry. Opened from outside the timeline (a link, search, the map, a journey), the timeline zooms to a window around it; clicks in the timeline and the arrow keys keep the zoom.

### The timeline

**How this design was reached.** The owner's first picture was a horizontal git-style graph, where each point is like a commit. They later dropped branches. The decided design is **several independent, parallel lanes on one shared time axis**, because many events happened independently at the same time in different places.

- **The "all of time" strip** above the timeline shows the whole sequence of prophets, with every prophet as a tick and the main ones named, the reckoned years before Abraham hatched, and the timeline's current window framed. Clicking or dragging on it moves the window.
- **Lanes:** one per region or civilization, with the Prophets lane pinned at the top, then the Quran lane. Lanes with nothing in the current window fold into one line ("Levant, Egypt…: nothing recorded between … yet"), with a button to show them.
- **How sure is the date** is drawn, one style per certainty: documented (solid), estimated (fading at the ends), traditional (dashed), reckoned from tradition (hatched), debated or unknown (dotted). A part of a span fixed by a source (such as Noah's 950 years) is drawn solid inside the bar.
- Zoomed far out, and on a phone, prophets are labeled by their short English name ("Noah" for "Nuh (Noah)") so the lane stacks less.
- Era bands are a thin strip under the axis and a faint wash behind the lanes. Links to related events are drawn only while an event is selected.

### The entry

In this order:

1. A top line (lane, kind, a draft pill, previous / next / copy link), the title in both languages.
2. Chips: the date with its certainty, the place with its status and number of opinions, the number of Quran passages.
3. The summary, in the reading font.
4. **How the date is known.** For a reckoned date, the chain of the reckoning step by step (D29), with the full basis behind a disclosure; otherwise the basis. The certain part and other datings follow.
5. **Where**: the description, names, and the opinions lettered A, B, C as on the map.
6. **The layer navigator**: five segments with their counts, jumping to each layer.
7. **The layers.** Quran (one passage at a time, from the dataset, with its references as chips), Tafsir, Tradition (kind badges and grading badges by named scholars; People of the Book "neither affirmed nor denied"), History (established or debated, with sources), Our reflection (dashed, with its confidence).
8. **Around this time**: other events overlapping it, then the nearest ones ("about 400 years later"). Then related events and the sources.

### The map

- **Basemap (D30):** terrain without modern borders or names (Stadia Maps, "Stamen Terrain Background"), with the broad ancient region names the sources use (Mesopotamia, al-Jazira, al-Sham, Hijaz…). It falls back to OpenTopoMap by itself if Stadia's tiles fail.
- How each location status is shown:

  | Status | On the map | In the entry |
  |---|---|---|
  | `known` | a point with a ring, or an outlined area | the place's names |
  | `proposed` | a dashed area per opinion, lettered A (filled), B, C… (hollow), with a legend | each opinion, lettered, with its source |
  | `unknown` | nothing (decided by the owner), with a note | what the text says about the place |

- Other events from the same time are diamonds in their lane's color; with nothing selected, every event with a place is a faint dot.

## Journeys (D28)

A journey walks through a story one step at a time. The map flies to each step's place and draws the route, the part already walked solid; steps at the same place share a marker ("1 · 2"). A story card gives the step's title, date, summary, first verse, place, and "Meanwhile, in history"; a strip at the bottom shows the steps on their own time scale with what history records for the same years. Arrow keys move between steps.

## Phone layout

Below 760 px wide: a compact header (mark, search, language), a tab bar (Explore, Journeys, Quran, About), the strip and a shorter timeline with lane names inside the lanes, the map, and a bottom sheet that previews the selected entry (title, date, a five-color bar of its layers, "Read the entry"). The entry opens as its own page, with previous / next and "On the map and timeline". A journey's story sits under its map.

## Language (D21)

The EN / عربي switch is in the header and remembered. In Arabic the header, the entry, the journeys and the home page read right to left with Arabic labels; the time axis still runs left to right. The Quran reader, About and the editor stay in English for now (open question 18).
