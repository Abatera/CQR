# Chronotope of Quranic Reality

An educational, interactive web app that places events narrated in the Quran on a timeline and a map, next to what history and archaeology know about the same periods and places across civilizations: what else was happening in the world at the same time, and what followed.

"Chronotope" is Mikhail Bakhtin's term for how a narrative binds time and space together.

> **Status: early development.** All entries are drafts. Their claims, dates, locations and sources are still being checked and must not be relied on yet.

## What you see

- **Timeline** (top): parallel lanes on one time axis, one per region or civilization, with the Quran lane pinned at the top. Archaeological periods are shaded in the background. Scroll to zoom, drag to pan, and use the arrow keys to step through events.
- **Map** (lower left): the selected event's place. A known place gets a marker or an outline. A disputed place is drawn as shaded areas. A place that is not known is described in the facts panel, not pinned. Faint markers show other events from the same period.
- **Facts** (lower right): each entry keeps five layers apart:
  1. **Quran:** verse references, shown in the Uthmani script from the verified Tanzil dataset;
  2. **Tafsir:** what classical commentators said, with the work cited;
  3. **Tradition:** hadith, reports from the Companions and Successors, and the classical historians, each with its source and, for hadith, its grading by named scholars;
  4. **History and archaeology:** claims from outside the Quran, each marked *established* or *debated*, with sources;
  5. **Connection:** the project's own reflection linking the layers, always labeled as interpretation, with a confidence level.
- **Prophets lane:** the 25 prophets named in the Quran, in their traditional order. Before Abraham, history cannot date them; their years are a *reckoning* from intervals reported in hadith, drawn in a hatched style and explained in each entry.
- **Quran reader:** all 114 surahs, with search on the Arabic text (diacritics and hamza forms are ignored) and links from verses to the events that cite them.

## Running it locally

You need [Node.js](https://nodejs.org) 22 or later.

```sh
npm install
npm run dev
```

Then open http://localhost:5173.

## Adding and editing content

Content lives in plain YAML files in [content/](content/): one file per event in `content/events/`, plus `lanes.yaml`, `eras.yaml` and `sources.yaml`.

The easiest way to edit them is the **Editor**, which appears in the menu when the app runs on the local dev server (`npm run dev`). It has forms for events, lanes, eras and sources:

- every field of the content model, in English and optionally Arabic;
- years entered as a number plus BCE or CE;
- points and areas picked on a map;
- Quran references checked against the dataset as you type, with a preview of the verse text;
- citations picked from the bibliography, and new sources added without leaving the form.

Saving writes the YAML files directly. A save is refused if it would introduce an error, such as a reference to a source or event that does not exist. Review your changes with `git diff` before committing. The published site is static and has no editor.

You can also edit the YAML by hand. Run `npm run validate` to check your changes, and `npm run format:content` to put the files in the editor's style so later saves from the editor produce small diffs.

### Rules for content

The full principles are in [docs/03-content-principles.md](docs/03-content-principles.md). In short:

- **The Quran text is never typed or paraphrased as the text.** Content files store verse references only; the app shows the text from the dataset.
- **Every historical claim needs a source and a status** (established or debated). Popular websites are not sources.
- **Dates are ranges** with a certainty (established, estimated, traditional, debated or unknown) and a stated basis.
- **Connections are interpretation**, never presented as fact or proof.
- An entry stays a **draft** until it has been reviewed. A reviewed entry cannot have unsourced claims; the validator enforces this.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app with the local editor |
| `npm run build` | Validates the content and builds the static site into `dist/` |
| `npm run preview` | Serves the built site |
| `npm run validate` | Checks all content: schema, references between items, Quran references, sourcing rules |
| `npm run format:content` | Rewrites the content files in the editor's style |
| `npm test` | Runs the unit tests |
| `npm run check` | Type-checks the code |
| `npm run quran:verify` | Checks the Quran dataset against its recorded checksums and verse counts |
| `npm run quran:fetch` | Downloads the Quran dataset again from Tanzil (only when deliberately updating it) |

## Project layout

```
content/                 the content (CC BY-SA 4.0): events, lanes, eras, sources
data/third-party/quran/  the Tanzil Quran text, unmodified, with checksums
docs/                    planning and design documents
public/fonts/            Amiri Quran and Noto Naskh Arabic fonts (OFL)
scripts/                 validation, content files, Quran dataset, dev-server plugin
src/                     the app (Svelte + TypeScript)
  lib/                   schema, validation, years, Quran references, Arabic search
  timeline/ map/ facts/  the three panels
  quran/                 reader and search
  editor/                the local editor forms
tests/                   unit tests
```

## Licenses

- **Code:** MIT. See [LICENSE](LICENSE).
- **Written content** in [content/](content/): Creative Commons Attribution-ShareAlike 4.0. See [content/LICENSE](content/LICENSE).
- **Third-party material** keeps its own license and is not covered by the above: the Quran text (Tanzil Project), the Amiri and Noto Naskh Arabic fonts (SIL OFL 1.1), map tiles and libraries. See [THIRD_PARTY.md](THIRD_PARTY.md).
