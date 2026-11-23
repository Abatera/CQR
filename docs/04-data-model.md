# Data model

The whole model is **proposed**. Nothing here is final. The format (YAML or JSON) and the bilingual fields depend on open questions in [08-decisions.md](08-decisions.md).

## Approach

- Content is plain data files that the app reads, so contributors can add or fix an event without touching code.
- *Proposed:* content is written in **YAML**, one file per event, and compiled to JSON at build time. YAML allows comments and multi-line text, handles Arabic cleanly, and gives readable diffs.
- A build script validates everything. It checks the schema, and it checks that every lane, source and related event referenced actually exists and that every Quran reference exists in the dataset. It then emits a single JSON bundle for the app.

## Conventions

- **Years** are signed integers: negative for BCE, positive for CE. For example, `-1010` is 1010 BCE. There is no year 0, because the year before 1 CE is `-1`. The display shows "1010 BCE". Any code that computes durations across the BCE/CE boundary must account for the missing year 0.
- **Geometry** is GeoJSON, with coordinates in `[longitude, latitude]` order. Points are used for known places and polygons for areas.
- **Quran references** are `"surah:ayah"` for one verse or `"surah:ayah-ayah"` for a range within one surah. Examples: `"34:10-11"` and `"21:80"`.
- **IDs** are unique kebab-case strings. An event's ID is also its file name and its URL slug.
- **Text fields** are language maps, `{ en: ..., ar: ... }`. Which languages are required depends on the UI language decision.

## Files

```
content/
├── lanes.yaml        # timeline lanes
├── eras.yaml         # background era bands
├── sources.yaml      # bibliography
└── events/
    └── <event-id>.yaml
```

## Lanes

```yaml
- id: quran
  name: { en: Quran, ar: القرآن }
  order: 0
  pinned: true          # always at the top
- id: egypt
  name: { en: Egypt, ar: مصر }
  order: 2
  color: "#..."
```

## Eras

The values below are illustrative. Verify them before use.

```yaml
- id: late-bronze-age
  name: { en: Late Bronze Age, ar: العصر البرونزي المتأخر }
  from: -1550
  to: -1200
  region: { en: Eastern Mediterranean and Near East }
  sources: [cline-1177]
```

## Sources

```yaml
- id: cline-1177
  type: book            # book | article | chapter | inscription | tafsir | website
  authors: [Eric H. Cline]
  title: "1177 B.C.: The Year Civilization Collapsed"
  edition: Revised and updated
  year: 2021
  publisher: Princeton University Press
```

Items that cite a source can add a precise location in the work, such as `{ id: cline-1177, locator: "pp. 102-110" }`.

## Events

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Kebab-case. Also the file name and URL slug. |
| `kind` | yes | `event` (drawn as a dot or short range) or `period` (a long bar, such as a dynasty or an empire). |
| `lane` | yes | A lane ID. |
| `title`, `summary` | yes | Language maps. |
| `when` | yes | `from`, `to`, `certainty` (`established`, `estimated`, `traditional`, `debated` or `unknown`), `basis` (what the date rests on), and an optional `alternatives` list of `{from, to, basis, source}`. |
| `place` | yes | `status` (`known`, `proposed` or `unknown`), `names`, `description`, and `geometry` (left out when the status is `unknown`). An `opinions` list of `{name, geometry, source}` is used for disputed locations. |
| `quran` | no | A list of references. Mostly used in the Quran lane, but any event may cite verses. |
| `tafsir` | no | A list of `{text, source}`. |
| `history` | no | A list of `{claim, status, sources}`, with status `established` or `debated`. |
| `connection` | no | `{text, confidence}`, with confidence `low`, `medium` or `high`. |
| `related` | no | A list of `{id, type}`, with type `context`, `consequence` or `parallel`. |
| `tags` | no | Free-form tags. |

### Example

This is a skeleton, not finished content. The TODOs need research.

```yaml
# content/events/david-armor.yaml
id: david-armor
kind: event
lane: quran
title:
  en: David and the making of armor
  ar: داوود وصناعة الدروع
summary:
  en: The Quran says God made iron soft for David and taught him to make coats of armor.
when:
  from: -1010
  to: -970
  certainty: traditional
  basis: Traditional dates of David's reign (biblical chronology). The Quran gives no date.
place:
  status: proposed
  description:
    en: David's kingdom in the southern Levant, with Jerusalem as its capital according to tradition. The Quran names no place for this event.
  geometry:
    type: Point
    coordinates: [35.23, 31.78]
quran: ["34:10-11", "21:80"]
tafsir:
  - text: { en: "TODO: how classical commentators explain sābighāt and sard." }
    source: TODO
history:
  - claim: { en: Iron became common for tools and weapons in the Levant during the 11th–10th centuries BCE. }
    status: established   # TODO: verify
    sources: [TODO]
connection:
  text:
    en: The Quran ties David to iron worked into armor, at the time archaeology shows iron becoming common in the region. This does not claim that no one else could work iron.
  confidence: TODO        # the owner decides
related:
  - { id: iron-spread-levant, type: context }
  - { id: solomon-molten-copper, type: parallel }
tags: [metallurgy, david]
```
