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
| Paths | `base: './'`, so the built site works from a GitHub Pages project path. Routes use the URL hash (`#/`, `#/explore`, `#/event/<id>`, `#/journey/<id>/<step>`, `#/quran`), which needs no server configuration. |
| Design (D27) | Tokens and shared styles in [src/app.css](../src/app.css); fonts in [src/fonts.css](../src/fonts.css), self-hosted under `public/fonts/`; icons in [src/ui/Icon.svelte](../src/ui/Icon.svelte). Below 760 px wide the app switches to its phone layout (`NARROW_QUERY` in [src/config.ts](../src/config.ts)). |

## Open

- **Stadia Maps account (D30).** The default basemap, Stadia's "Stamen Terrain Background", needs the site's domain registered in a free, non-commercial Stadia account. Until then the map falls back to OpenTopoMap by itself. Basemaps and the ancient region names are in [src/config.ts](../src/config.ts).

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
├── public/fonts/noto-naskh-arabic/  # Noto Naskh Arabic (variable), with OFL.txt
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

- The repository is **public**, at `github.com/Abatera/CQR`. The owner commits and pushes the versions; ask before committing or pushing.
- **Deployment (D26):** [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) runs on every push to `main`. It installs with `npm ci`, runs `quran:verify`, the tests, `check` and `build` (which validates the content first), and publishes `dist/` to GitHub Pages at `https://abatera.github.io/CQR/`. Any failing step stops the deployment, and the previous version stays online. One-time setup: in the repository's Settings > Pages, "Source" must be "GitHub Actions".
- The editor exists only on the dev server: the public build drops it, and its `#/edit` route opens the explorer.
- The GitHub CLI (`gh`) is not installed on either machine.
- The owner uses Windows.
