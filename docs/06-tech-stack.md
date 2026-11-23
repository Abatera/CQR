# Tech stack

## Agreed by the owner

| Area | Choice |
|---|---|
| Build | Vite |
| Language | TypeScript |
| Map | Leaflet, with free OpenStreetMap-based tiles |
| Timeline | A custom SVG component. No timeline library fits lanes, era bands, periods and links together. |
| Hosting | A static site with no backend, deployed to GitHub Pages |

## Open

- **UI framework.** None (vanilla TypeScript), or a light one such as Svelte or Preact, or React. The three panels share selection state, and there is also a Quran reader and search. Ask the owner, and decide at scaffold time.
- **Content format.** YAML compiled to JSON is proposed (see [04-data-model.md](04-data-model.md)).
- **Basemap style and provider.** A terrain basemap without modern borders is suggested (see [02-ui-design.md](02-ui-design.md)). Check the OpenStreetMap tile usage policy: the standard tile.openstreetmap.org server allows light use with attribution, and heavier traffic needs another provider.
- **Testing tools.** Not discussed.

## Licensing (decided)

- **Code:** MIT, in a `LICENSE` file at the repo root.
- **Written content** (`content/`): CC BY-SA 4.0, in a separate license file such as `content/LICENSE`. The README must state the split clearly.
- **Third-party material:** the Quran text, fonts, map tiles and libraries keep their own licenses, listed in `THIRD_PARTY.md`.

## Proposed repo layout

```
/
├── CLAUDE.md
├── README.md                 # public-facing; to write at scaffold
├── LICENSE                   # MIT (code)
├── THIRD_PARTY.md
├── docs/                     # these planning docs
├── content/                  # CC BY-SA 4.0
│   ├── LICENSE
│   ├── lanes.yaml
│   ├── eras.yaml
│   ├── sources.yaml
│   └── events/*.yaml
├── data/third-party/quran/   # verified Quran text, unmodified, with its license
├── public/fonts/
├── scripts/                  # validate content, compile to JSON, build search index
└── src/
    ├── main.ts
    ├── state/                # selection, visible lanes, zoom, routing
    ├── timeline/
    ├── map/
    ├── facts/
    └── quran/                # reader and search
```

## GitHub

- The repository will be **public**. It has not been created yet.
- The owner chose "local only for now". Ask before creating the repo, pushing, or enabling Pages.
- Deployment to Pages would use GitHub Actions.
- The GitHub CLI (`gh`) was not installed on the planning PC. Check whether it is installed on this one.
- The owner uses Windows.
