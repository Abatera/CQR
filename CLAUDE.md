# Chronotope of Quranic Reality (CQR)

A public, educational, interactive web app. It places events narrated in the Quran on a timeline and a map, next to what history and archaeology know about the same periods and places across civilizations: what else was happening in the world at the same time, and what followed.

## Status

**Phases 0–2 are built (2026-11-23); Phase 3 content is in draft.** The app runs: timeline, map, facts panel, Quran reader and search, and a local editor with forms for all content. The 15 pilot events are drafts written from unverified research leads. A Prophets lane with 25 researched draft entries and a Tradition layer (hadith and historians, with gradings) were added the same day; the research is in [docs/research/prophets-chronology.md](docs/research/prophets-chronology.md). On 2026-11-25 the Flood of Noah was researched and added in four draft entries ([docs/research/the-flood.md](docs/research/the-flood.md)). On 2026-11-26 all content got Arabic, with an EN / عربي switch (D21–D23); the Arabic is Claude's draft, not yet reviewed by the owner. The same day Abraham was anchored at about 2166 BCE and told in eight episodes, which moved every date counted from him (D24; [docs/research/abraham.md](docs/research/abraham.md)). See [docs/07-roadmap.md](docs/07-roadmap.md) for what is done and what is next.

The planning docs were written on 2026-11-23 on a different PC, at the end of a planning conversation between the project owner and Claude. Development happens on this machine. Decisions made since then are logged in [docs/08-decisions.md](docs/08-decisions.md) (D14 onward).

A git repository exists, with `origin` at `github.com/Abatera/CQR`. The owner commits and pushes the versions (v0.1 to v0.4.1 by 2026-11-27). The repository is public, and the site is deployed to GitHub Pages by a GitHub Actions workflow on every push to `main` (D26), so **a push publishes**.

## Commands

- `npm run dev`: the app, with the editor at `#/edit` (local only)
- `npm run validate`: content checks. `npm run build` runs it first, and errors fail the build.
- `npm test` (Vitest, through `scripts/test.mjs`, which works around a Windows drive-letter issue) and `npm run check` (svelte-check)
- `npm run quran:verify`: dataset checksums and verse counts
- `npm run format:content`: rewrite the content YAML in the editor's style

## Read these first, in order

1. [docs/01-vision.md](docs/01-vision.md): what the project is for and where the idea came from
2. [docs/02-ui-design.md](docs/02-ui-design.md): the three-panel layout and the timeline lanes
3. [docs/03-content-principles.md](docs/03-content-principles.md): how claims are layered, dated, located and sourced
4. [docs/04-data-model.md](docs/04-data-model.md): the proposed content schema and file layout
5. [docs/05-quran-data.md](docs/05-quran-data.md): the Quran text database (Hafs), search, fonts and licensing
6. [docs/06-tech-stack.md](docs/06-tech-stack.md): the stack, licenses and repo layout
7. [docs/07-roadmap.md](docs/07-roadmap.md): the phases and the first milestone
8. [docs/08-decisions.md](docs/08-decisions.md): the decision log and the **open questions**

## First thing to do in a new session

Check the open questions at the end of [docs/08-decisions.md](docs/08-decisions.md) and the choices listed there as "Choices Claude made while implementing", which the owner has not yet confirmed.

## Working agreements

- **Discuss before building.** The owner shapes the design by thinking out loud and refining it. For example, they replaced git-style branches with parallel lanes partway through planning. Propose, get agreement, then build. Small implementation details don't need sign-off. Anything that changes what the reader sees or how content is structured does.
- **"Proposed" is not "decided."** Items marked *proposed* in docs/08 came from Claude, and the owner did not explicitly confirm them. Confirm them before relying on them.
- **Never type Quran text from memory or generate it.** All Arabic Quran text shown in the app must come from the verified dataset (see docs/05). Content files store verse references only, and every reference must be checked against the dataset. The few Arabic phrases quoted in these planning docs are for discussion only.
- **Every historical claim needs a source and a status** (established or debated). Never present the project's own connections between the Quran and history as established fact. See docs/03.
- **Islamic sources lead (D25).** Quran, tafsir, hadith and the Muslim historians come first. Reports of the People of the Book follow, with the kind `ahl-al-kitab`, and the app labels them "neither affirmed nor denied"; never present them as fact. Greek and Roman writers go in the History layer.
- **Hadith and historians go in the Tradition layer**, each with its source and, for hadith, gradings by named scholars. Never write hadith text or gradings from memory: quote only what was read in a cited work, and say so in the source's notes when a work was read through another that quotes it.
- **The source's words and the project's words stay apart (D22).** In Tafsir and Tradition, `original` holds the source's own wording, quoted from the cited work; `text` (English and Arabic) is the project's summary. Write hadith summaries as reports («يذكر الحديث أن…»), never in the hadith's voice.
- **Arabic text is the project's own.** Never reproduce Quran wording in it: refer to verses by number and paraphrase. Check new Arabic against the Tanzil text for runs of three or more words matching a verse. Quote a scholar's Arabic only where it was read. Mark quotations translated from English as «مترجمةٌ عن الإنجليزية». See docs/03.
- **Honorifics:** ﷺ after the Prophet Muhammad's name; "peace be upon him" (in Arabic «عليه السلام») after other prophets at their first mention in each entry (D19).
- **The research leads in these docs are unverified.** They were recalled during the planning conversation, not checked against sources. Verify each against a real source before it goes into content.
- **Ask before committing or pushing.** The repository is public, and every push to `main` redeploys the public site (D26).
- **Versions mark functionality, not content** (the owner, 2026-11-26). Commits are named like "v0.4, added: …" only when the app's functionality changes. A commit that only adds or edits content keeps the current version and just describes the content.
- **Draft until reviewed.** New content is `review: draft`. Only the owner marks an entry `reviewed`, and only after its sources are verified.
- **Never edit `data/third-party/quran/`.** Tanzil's terms forbid changes. `npm run quran:verify` detects them.
- **Licensing.** Code is MIT and written content is CC BY-SA 4.0. Third-party material (the Quran text, fonts, map tiles, libraries) keeps its own license and must not be relabeled. Only openly licensed fonts go in the repo: Thmanyah's font was set aside because its license forbids redistribution (D23).
