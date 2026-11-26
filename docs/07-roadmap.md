# Roadmap

The order and the first milestone were confirmed on 2026-11-23 (D14 in [08-decisions.md](08-decisions.md)).

## Progress (2026-11-23)

- **Phase 0: done.** Scaffold, licenses, `THIRD_PARTY.md`, the content schema, the validator and the build. The decisions are D14 and D15.
- **Phase 1: done**, except spot-checking verses against a printed mushaf and checking the font in Firefox and Safari. The Tanzil dataset is stored unmodified and verified. The reader and search are built, with Amiri Quran.
- **Phase 2: done.** The three panels, URL routing, lane toggles, arrow keys and links between lanes. Added at the owner's request: a local **editor** with forms for events, lanes, eras and sources (D15). There is no small-screen layout yet (open question 13).
- **Phase 3: drafted, not researched.** The pilot events below exist as drafts, written only from the leads in these docs, with their open items in `notes` and in the validator's warnings. The verse references were checked against the dataset. **None of the historical content has been checked against a source yet**; that is the next step. The Late Bronze Age collapse is an era band, not an event, and the end of the New Kingdom is the end of its period bar.
- **Phase 4: not started.**
- **Added on 2026-11-23: the chronology of the prophets** (D16–D19). There is a new Tradition layer, a pinned Prophets lane, and 25 draft entries, one per prophet named in the Quran. The entries are researched in hadith, Ibn Kathir's *al-Bidaya wa-l-Nihaya*, Ibn Sa'd and Ibn 'Asakir, with gradings, and the years before Abraham are marked as a reckoning. The research and what is still to check are in [research/prophets-chronology.md](research/prophets-chronology.md).
- **Added on 2026-11-26: Abraham** (D24, D25). Abraham anchored at about 2166 BCE and told in eight dated episodes, with the kings and figures named by the sources (Nimrod, al-Dahhak, the king of Egypt, Jurhum), the People of the Book neither affirmed nor denied, and the Third Dynasty of Ur and its fall in the Mesopotamia lane. Everything counted from Abraham moved by −166 years. The research is in [research/abraham.md](research/abraham.md).
- **Added on 2026-11-26: Arabic** (D21–D23). An EN / عربي switch; Arabic for all 450 texts in the content, drafted by Claude and awaiting the owner's review; the source's own wording kept apart in a new `original` field; Noto Naskh Arabic for Arabic text.
- **Added on 2026-11-25: the Flood of Noah**, with the scholars' debate on its extent, the Mesopotamian flood texts and flood layers, and the Black Sea hypothesis, in four draft entries. The research is in [research/the-flood.md](research/the-flood.md).

## Phase 0: Confirm and scaffold

- Settle the open questions in [08-decisions.md](08-decisions.md).
- Run `git init`. Set up the Vite and TypeScript project, `.gitignore`, `README.md`, `LICENSE` (MIT), the content license (CC BY-SA 4.0) and `THIRD_PARTY.md`.
- Create the folder structure ([06-tech-stack.md](06-tech-stack.md)).
- Write the content schema and the validation and compile script ([04-data-model.md](04-data-model.md)).

## Phase 1: Quran data

- Choose the source and verify its license and integrity ([05-quran-data.md](05-quran-data.md)).
- Store the files unmodified, and generate the search index.
- Build the Quran reader view and search, and choose a font.

## Phase 2: App shell

- The three-panel layout.
- The timeline: the axis, zoom and pan, lanes, era bands, events and periods, stacking, selection and lane toggles.
- The map: fly to the selected event, show each location status, and mark other events from the same period.
- The facts panel, with its four layers.
- URL routing for each event.
- Develop with a few placeholder events.

## Phase 3: Pilot content, 1200–900 BCE (proposed first milestone)

The pilot is 8–10 events, fully researched and cited. It tests the whole design on one well-documented section of the timeline before scaling up. All items below are **leads to verify**.

**Quran lane**

- Talut is appointed king, and the river test (2:246–249).
- David kills Jalut and receives kingship and wisdom (2:251).
- David and armor (21:80, 34:10–11).
- Solomon inherits from David (27:16).
- Solomon and the spring of molten copper (34:12).
- Solomon and the Queen of Sheba (27:20–44).
- Solomon's death (34:14).

**Other lanes**

- The Late Bronze Age collapse, c. 1200–1150 BCE.
- The fall of the Hittite Empire, c. 1180 BCE.
- Ramesses III and the Sea Peoples, c. 1177 BCE (the Medinet Habu reliefs).
- The end of Egypt's New Kingdom, c. 1070 BCE.
- The spread of iron in the Levant, 11th–10th centuries BCE.
- Copper production at Timna and Faynan, 10th century BCE.
- The beginnings of the kingdom of Saba'. The dating is debated, which makes it a good test of how "debated" is shown.
- The rise of the Neo-Assyrian Empire, c. 911 BCE.
- The Tel Dan stele, 9th century BCE, as evidence.

## Phase 4: Review and publish

- The owner reviews all the content.
- With the owner's OK: create the public GitHub repo and deploy to GitHub Pages with Actions.
- Write `CONTRIBUTING.md` (how to add an event, and the sourcing rules from [03-content-principles.md](03-content-principles.md)) and a code of conduct.

## Later

Further periods. All of these are unverified leads:

- Thamud and al-Hijr (Hegra). Assyrian inscriptions of Sargon II, from the 8th century BCE, are said to mention the Thamud.
- Saba' and the breaking of the Ma'rib dam (34:15–16). The final breach is usually dated to the 6th century CE.
- The People of the Elephant and Abraha's campaign (surah 105). Traditionally dated to around 570 CE; some scholars date it earlier.
- The Byzantine–Persian war (30:2–4): the Persian conquests around 614 CE, and the Byzantine recovery around 622–628 CE.
- Moses and Egypt, and Joseph. The dating of both is heavily debated.
- The life of the Prophet ﷺ.

Further features:

- translations;
- search by root or lemma;
- an Arabic UI with right-to-left layout;
- mobile layout;
- more lanes;
- a section for the undated prophets, depending on the open decision about them.
