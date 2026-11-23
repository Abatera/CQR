# Chronotope of Quranic Reality (CQR)

A public, educational, interactive web app. It places events narrated in the Quran on a timeline and a map, next to what history and archaeology know about the same periods and places across civilizations: what else was happening in the world at the same time, and what followed.

## Status

**Planning only.** No code, no git repository, no GitHub repo yet.

These docs were written on 2026-11-23 on a different PC, at the end of a planning conversation between the project owner and Claude. Development happens on this machine. Everything decided or proposed in that conversation is recorded in `docs/`. Nothing else from that conversation carried over, so treat these files as the full context.

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

Go through the open questions at the end of [docs/08-decisions.md](docs/08-decisions.md) with the owner before writing code. Several of them affect the scaffold, such as the UI framework, the content format and the UI language.

## Working agreements

- **Discuss before building.** The owner shapes the design by thinking out loud and refining it. For example, they replaced git-style branches with parallel lanes partway through planning. Propose, get agreement, then build. Small implementation details don't need sign-off. Anything that changes what the reader sees or how content is structured does.
- **"Proposed" is not "decided."** Items marked *proposed* in docs/08 came from Claude, and the owner did not explicitly confirm them. Confirm them before relying on them.
- **Never type Quran text from memory or generate it.** All Arabic Quran text shown in the app must come from the verified dataset (see docs/05). Content files store verse references only, and every reference must be checked against the dataset. The few Arabic phrases quoted in these planning docs are for discussion only.
- **Every historical claim needs a source and a status** (established or debated). Never present the project's own connections between the Quran and history as established fact. See docs/03.
- **The research leads in these docs are unverified.** They were recalled during the planning conversation, not checked against sources. Verify each against a real source before it goes into content.
- **Local-first.** Do not create the GitHub repository, push, or enable GitHub Pages without asking the owner. The repository will be public.
- **Licensing.** Code is MIT and written content is CC BY-SA 4.0. Third-party material (the Quran text, fonts, map tiles, libraries) keeps its own license and must not be relabeled.
