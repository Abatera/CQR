# Tech stack

## Agreed by the owner

| Area | Choice |
|---|---|
| Build | Vite |
| Language | TypeScript |
| Map | Leaflet, with free OpenStreetMap-based tiles |
| Timeline | A custom SVG component. No timeline library fits lanes, era bands, periods and links together. |
| Hosting | A static site with no backend, deployed to GitHub Pages |

## Decided on 2026-11-23 (D14)

| Area | Choice |
|---|---|
| UI framework | Svelte 5 |
| Content format | YAML, one file per event, compiled to `content.json` by a Vite plugin |

## As built

| Area | Choice |
|---|---|
| Versions | Vite 8, Svelte 5, TypeScript 6 (svelte-check does not support TypeScript 7 yet), Leaflet 1.9, Zod 4 for the schema, `yaml` for reading and writing content |
| Content pipeline | [scripts/vite-plugin-cqr.ts](../scripts/vite-plugin-cqr.ts) serves `content.json` and the Quran files on the dev server and emits them at build time. On the dev server it also provides the editor's write API. |
| Editor | Forms in `src/editor/`, on the dev server only. The built site has no write API. |
| Tests | Vitest (`npm test`) for the logic and the real dataset; svelte-check (`npm run check`) for types |
| Paths | `base: './'`, so the built site works from a GitHub Pages project path. Routes use the URL hash (`#/event/<id>`), which needs no server configuration. |

## Open

- **Basemap style and provider.** The default is OpenTopoMap (terrain), with OpenStreetMap as the alternative, both set in [src/config.ts](../src/config.ts). Both still show modern borders and place names, so a better fit is still wanted (see [02-ui-design.md](02-ui-design.md)). Check each provider's usage policy before deploying: the standard tile.openstreetmap.org server allows only light use with attribution.

## Licensing (decided)

- **Code:** MIT, in a `LICENSE` file at the repo root.
- **Written content** (`content/`): CC BY-SA 4.0, in a separate license file such as `content/LICENSE`. The README must state the split clearly.
- **Third-party material:** the Quran text, fonts, map tiles and libraries keep their own licenses, listed in `THIRD_PARTY.md`.

## Repo layout (as built)

```
/
├── CLAUDE.md
├── README.md                 # public-facing
├── LICENSE                   # MIT (code)
├── THIRD_PARTY.md
├── docs/                     # these planning docs
├── content/                  # CC BY-SA 4.0
│   ├── LICENSE
│   ├── lanes.yaml
│   ├── eras.yaml
│   ├── sources.yaml
│   └── events/*.yaml
├── data/third-party/quran/   # Tanzil text, unmodified, with SOURCE.json checksums and a README
├── public/fonts/amiri/       # Amiri and Amiri Quran, with OFL.txt
├── scripts/                  # validation, content read/write, Quran download and checks, Vite plugin
├── src/
│   ├── main.ts, App.svelte, About.svelte, app.css, config.ts
│   ├── lib/                  # schema, validation, years, Quran references, Arabic normalization, formatting
│   ├── state/                # app state and hash routing
│   ├── timeline/             # SVG timeline and its layout
│   ├── map/
│   ├── facts/
│   ├── quran/                # dataset loading, search, reader, verse display
│   └── editor/               # forms and form fields
└── tests/
```

## GitHub

- The repository will be **public**. On the development machine, `origin` points to `github.com/Abatera/CQR`, and the first commit (the planning docs) was already pushed. Whether the GitHub repository is public was not checked.
- The owner chose "local only for now". Ask before committing, pushing, or enabling Pages.
- Deployment to Pages would use GitHub Actions. No workflow has been added yet.
- The GitHub CLI (`gh`) is not installed on either machine.
- The owner uses Windows.
