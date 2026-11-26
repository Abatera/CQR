# Third-party material

This project's own code is MIT-licensed ([LICENSE](LICENSE)) and its written content is CC BY-SA 4.0 ([content/LICENSE](content/LICENSE)). The material below is not covered by either license. Each item keeps its own terms.

## Quran text: Tanzil Project

- **Files:** [data/third-party/quran/](data/third-party/quran/): `quran-uthmani.xml`, `quran-simple-clean.xml`, `quran-data.xml`
- **Source:** [tanzil.net](https://tanzil.net), Hafs narration. The Uthmani text is used for display and the Simple-clean text for search.
- **License:** Creative Commons Attribution 3.0, with Tanzil's terms of use: verbatim copies only, **changing the text is not allowed**, the source must be credited with a link to tanzil.net, and the copyright notice must be kept. The full notice is at the top of each XML file and on the app's About page.
- **How this project uses it:** the files are stored and served exactly as downloaded. [SOURCE.json](data/third-party/quran/SOURCE.json) records each file's URL, download date and SHA-256 checksum, and `npm run quran:verify` checks them. Search normalization happens in memory in the browser; no modified copy of the text is stored or published.

## Fonts: Amiri and Amiri Quran

- **Files:** [public/fonts/amiri/](public/fonts/amiri/): `AmiriQuran.ttf`, `Amiri-Regular.ttf`
- **Source:** [github.com/aliftype/amiri](https://github.com/aliftype/amiri), release 1.003
- **License:** SIL Open Font License 1.1, in [public/fonts/amiri/OFL.txt](public/fonts/amiri/OFL.txt). Copyright 2010-2022 The Amiri Project Authors.
- **Used for:** Amiri Quran for the Quran text only.

## Font: Noto Naskh Arabic

- **Files:** [public/fonts/noto-naskh-arabic/](public/fonts/noto-naskh-arabic/): `NotoNaskhArabic-wght.ttf`, the variable font with weights 400–700. Its file name was shortened from `NotoNaskhArabic[wght].ttf`; the font itself is unchanged.
- **Source:** [github.com/google/fonts](https://github.com/google/fonts/tree/main/ofl/notonaskharabic) (`ofl/notonaskharabic`), downloaded on 2026-11-26. SHA-256 `67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f`.
- **License:** SIL Open Font License 1.1, in [public/fonts/noto-naskh-arabic/OFL.txt](public/fonts/noto-naskh-arabic/OFL.txt). Copyright 2022 The Noto Project Authors. No Reserved Font Name is declared.
- **Used for:** all Arabic text other than the Quran: titles, the content in Arabic, and the quotations from the cited works.

## Map tiles

Loaded at runtime from the providers' servers, not stored in this repository. See [src/config.ts](src/config.ts).

- **OpenTopoMap:** map data © OpenStreetMap contributors, SRTM; map style © OpenTopoMap (CC-BY-SA). See the [OpenTopoMap usage notes](https://opentopomap.org/about).
- **OpenStreetMap standard tiles:** © OpenStreetMap contributors, data under the ODbL. The standard tile server allows only light use; see the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

Attribution is shown on the map.

## Libraries

Installed through npm and bundled into the built site. Each keeps its own license (see `node_modules/<name>/LICENSE`).

| Library | License | Used for |
|---|---|---|
| [Leaflet](https://leafletjs.com) | BSD-2-Clause | Maps |
| [Svelte](https://svelte.dev) | MIT | UI framework |
| [Zod](https://zod.dev) | MIT | Content schema and validation |

Build and development tools (Vite, TypeScript, yaml, tsx, Vitest, svelte-check) are not shipped in the built site.
