# Data model

This is the schema as implemented on 2026-11-23. It follows the proposal from planning, with the refinements listed in [08-decisions.md](08-decisions.md). The code is in [src/lib/schema.ts](../src/lib/schema.ts) (the shape of each item) and [src/lib/validate.ts](../src/lib/validate.ts) (references between items and the sourcing rules).

## Approach

- Content is plain YAML files that the app reads, so contributors can add or fix an event without touching code: one file per event, plus lists of lanes, eras and sources (decided, D14).
- The local editor (`npm run dev`, then Editor) has a form for every field and writes these files (D15). The files can also be edited by hand.
- One validator runs in three places: on every save from the editor, in `npm run validate`, and in `npm run build`. It checks the schema, checks that every lane, source and related event referenced exists, and checks every Quran reference against the dataset. It then emits a single `content.json` for the app.
- Errors fail the build. Warnings (unsourced claims and missing confidence levels in drafts) do not, but they become errors when an entry is marked `reviewed`.
- The editor refuses a save or delete that would add an error, for example deleting a source that an event still cites.

## Conventions

- **Years** are signed integers: negative for BCE, positive for CE. For example, `-1010` is 1010 BCE. There is no year 0, because the year before 1 CE is `-1`. The display shows "1010 BCE". Positions and durations go through [src/lib/years.ts](../src/lib/years.ts), which handles the missing year 0. In the editor a year is typed as a number plus BCE or CE.
- **Ranges are inclusive.** `from: -1010, to: -970` covers both years. A single year has the same `from` and `to`.
- **Geometry** is GeoJSON, with coordinates in `[longitude, latitude]` order: a `Point` or a `Polygon` (one closed ring). The editor picks them on a map and rounds to 4 decimals.
- **Quran references** are `"surah:ayah"` for one verse or `"surah:ayah-ayah"` for a range within one surah, for example `"34:10-11"` and `"21:80"`. They are always quoted in YAML, because YAML 1.1 parsers read `21:80` as a number.
- **IDs** are unique kebab-case strings. An event's ID is also its file name and its URL slug (`#/event/david-armor`). IDs cannot be changed in the editor; to rename an item, create a new one and delete the old one.
- **Text shown to readers** is a language map, `{ en: ..., ar: ... }`. English is required; Arabic is optional in the schema (D14), and since 2026-11-26 every text has it (D21). Readers choose the language with the EN / عربي switch; a text without Arabic falls back to English.
- **Source citations** are a source ID, or `{ id, locator }` with the place in the work, such as `{ id: cline-1177, locator: "pp. 102-110" }`.

## Files

```
content/
├── LICENSE           # CC BY-SA 4.0
├── lanes.yaml        # timeline lanes
├── eras.yaml         # background era bands
├── sources.yaml      # bibliography
├── journeys.yaml     # guided journeys (D28)
└── events/
    └── <event-id>.yaml
```

## Lanes

| Field | Required | Notes |
|---|---|---|
| `id` | yes | |
| `name` | yes | Language map. |
| `order` | yes | Lower numbers are higher up. |
| `pinned` | no | Always shown at the top, and cannot be hidden. |
| `color` | no | `#rrggbb`. |
| `description` | no | Language map. |

## Eras

| Field | Required | Notes |
|---|---|---|
| `id`, `name` | yes | |
| `from`, `to` | yes | Years. |
| `review` | yes | `draft` or `reviewed`. |
| `region` | no | Where these period names apply. Archaeological periods differ by region. |
| `color` | no | |
| `sources` | for review | Sources for the dates. |
| `notes` | no | Editorial notes. |

## Sources

| Field | Required | Notes |
|---|---|---|
| `id` | yes | |
| `type` | yes | `book`, `article`, `chapter`, `inscription`, `tafsir`, `website` or `other`. |
| `title` | yes | |
| `authors`, `editors` | no | Lists of names. For tafsir, the commentator. |
| `title_original` | no | The title in its original script, such as Arabic. |
| `container` | no | The journal for an article, or the book for a chapter. |
| `edition`, `volume`, `issue`, `pages`, `year`, `publisher`, `place`, `doi`, `url`, `accessed`, `notes` | no | `year` may be a number or text, such as "1420 AH / 2000". |

## Events

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Kebab-case. Also the file name and URL slug. |
| `kind` | yes | `event` (drawn as a dot or short bar) or `period` (a long bar, such as a dynasty or an empire). |
| `lane` | yes | A lane ID. |
| `review` | yes | `draft` or `reviewed`. Drafts are labeled in the app. |
| `title`, `summary` | yes | Language maps. |
| `when` | yes | `from`, `to`, `certainty` (`established`, `estimated`, `traditional`, `reckoned`, `debated` or `unknown`; `reckoned` is for years computed from intervals reported in tradition, see [03](03-content-principles.md)), `basis` (a language map: what the date rests on), an optional `core` `{ from, to, basis }` for the part of the span that a source fixes (drawn solid inside the bar; it must lie inside the span), an optional `chain` (D29): a list of `{ label, year, gap }` steps from an anchor to the entry's own years, where `gap` (from the second step on) says how the step is counted from the one before and on what source, and an optional `alternatives` list of `{ from, to, basis, sources }`. |
| `place` | yes | `status` (`known`, `proposed` or `unknown`), `names` (a list of `{ name, type: ancient or modern, language }`), `description`, `geometry`, and `opinions` (a list of `{ name, geometry, sources }`). |
| `quran` | no | A list of references. Mostly used in the Quran lane, but any event may cite verses. |
| `tafsir` | no | A list of `{ text, original, source }`. `text` is a language map: what the commentator says, in the project's words. `original` (optional) is the commentator's own words, quoted from the cited work (D22). |
| `tradition` | no | A list of reports: `{ kind, attribution, text, original, source, gradings }`. `kind` is `hadith`, `athar` (a Companion or Successor), `historian` or `ahl-al-kitab` (the People of the Book, as transmitted by Muslim scholars or cited from their scriptures). `attribution` and `text` are language maps; `text` is the project's own summary or translation, in English and Arabic, never the source's wording. `original` (optional) is the report's own words, quoted from the cited work as they were read there, never from memory (D22). `gradings` is a list of `{ grade, by, source, note }`, with grade `sahih`, `hasan`, `daif`, `very-weak`, `fabricated` or `other`, and `by` (a language map) the scholar who gave it. |
| `history` | no | A list of `{ claim, status, sources }`, with status `established` or `debated`. |
| `connection` | no | `{ text, confidence }`, with confidence `low`, `medium` or `high`, set by the owner. |
| `related` | no | A list of `{ id, type }`, with type `context`, `consequence` or `parallel`. |
| `tags` | no | Free-form tags. |
| `notes` | no | Editorial notes: open questions, things to verify. Never shown to readers. |

## Journeys

A guided journey (D28), in `content/journeys.yaml`:

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Kebab-case; the URL is `#/journey/<id>`. |
| `title`, `summary` | yes | Language maps. The summary is shown on the journey's card. |
| `review` | yes | `draft` or `reviewed`. |
| `order` | yes | Lower numbers are listed first. |
| `steps` | yes | At least two `{ event, note }`: an event ID, and an optional language map that links the step to the one before, e.g. "Archaeology: flood deposits found in Mesopotamian cities." |
| `notes` | no | Editorial notes, never shown to readers. |

Every step must name an existing event; deleting an event that a journey uses is refused.

### Location rules

| Status | Must have | Must not have |
|---|---|---|
| `known` | `geometry` | `opinions` |
| `proposed` | `geometry` or at least one opinion | |
| `unknown` | `description` (what the text says about the place) | `geometry`, `opinions` |

### Sourcing rules

For a reviewed entry these are errors; for a draft they are warnings:

- every `history` claim has at least one source;
- every `tafsir` item has a source;
- every `tradition` report has a source, and every hadith or `athar` has at least one grading;
- every location opinion and every alternative date has a source;
- a `connection` has a confidence level;
- an era has at least one source.

### Example

The draft in [content/events/david-armor.yaml](../content/events/david-armor.yaml), shortened:

```yaml
id: david-armor
kind: event
lane: quran
review: draft
title:
  en: David and the making of armor
  ar: داوود وصناعة الدروع
summary:
  en: The Quran says God made iron soft for David and taught him to make coats of armor.
when:
  from: -1010
  to: -970
  certainty: traditional
  basis:
    en: Traditional dates of David's reign (biblical chronology). The Quran gives no date.
place:
  status: proposed
  description:
    en: David's kingdom in the southern Levant, with Jerusalem as its capital according to tradition. The Quran names no place for this event.
  geometry:
    type: Point
    coordinates: [ 35.23, 31.78 ]
quran: [ "34:10-11", "21:80" ]
history:
  - claim:
      en: Iron became common for tools and weapons in the Levant during the 11th–10th centuries BCE.
    status: established
    # no sources yet: a warning while this is a draft
connection:
  text:
    en: The Quran ties David to iron worked into armor, at the time archaeology shows iron becoming common in the region. This does not claim that no one else could work iron.
related:
  - { id: iron-spread-levant, type: context }
  - { id: solomon-molten-copper, type: parallel }
tags: [ metallurgy, david, iron ]
notes: "TODO tafsir: how classical commentators explain sābighāt and sard. The owner sets the connection's confidence."
```
