# Decisions and open questions

All entries are from the planning conversation on 2026-11-23.

## Decided by the owner

| # | Decision |
|---|---|
| D1 | The name is **Chronotope of Quranic Reality**. It is a public, educational GitHub project. |
| D2 | It is an **interactive visual web app**. A documentation site, a Markdown-only repo and a dataset with notebooks were all considered and not chosen. |
| D3 | The focus is the **time and space of Quranic narratives**, specifically linking Quranic events to history known across civilizations, **including consequences**. |
| D4 | The layout has a **timeline at the top, a map at the lower left, and facts at the lower right**. Selecting a point drives the other two panels. |
| D5 | **No branches.** The first git-graph idea was dropped in favor of **multiple independent, parallel timeline lanes** for events that happen independently at the same time. |
| D6 | Time is shown as **periods**, researched as precisely as possible, not just as an order of events. |
| D7 | The map covers **earthly places only**. The unseen and the Hereafter are out of scope. |
| D8 | If a location is not known, it is **described, not pinned**. |
| D9 | The project needs a **high-quality, readable, searchable Hafs Quran text** database. |
| D10 | The stack is **Vite and TypeScript, Leaflet with OpenStreetMap tiles, a custom SVG timeline, a static site, and GitHub Pages**. The owner said: "I also agree on the stack you chose." |
| D11 | The licenses are **CC BY-SA 4.0 for content and MIT for code**. |
| D12 | **Local only for now.** No GitHub repo yet, and none is created without asking. |
| D13 | The David and iron idea is kept in its refined form: **the timing** fits the spread of iron, not "a monopoly on iron". See [03-content-principles.md](03-content-principles.md). |

## Decided on 2026-11-23, on the development machine

| # | Decision |
|---|---|
| D14 | Claude recommended four answers to the questions that blocked the scaffold, and the owner replied "Implement it": **Svelte** as the UI framework, **YAML** content compiled to JSON, an **English UI with optional Arabic text** in every reader-facing field (`{ en, ar }`), and the **1200–900 BCE pilot** as the first milestone. These close former open questions 2, 5, 7 and 8. A full Arabic, right-to-left UI remains a later feature. |
| D15 | The owner asked for "all the needed forms to add whatever information or data". They are implemented as a **local editor**: forms for events, lanes, eras and sources that run on the dev server (`npm run dev`) and write the YAML files in `content/`. The published site stays static and read-only. |
| D16 | The owner asked for research "in Tafsirs and Hadiths and greatest muslim historians" to fill the chronology, focusing on the 25 prophets named in the Quran, without being exhaustive. Hadith and the historians go in a **new fifth layer, Tradition**, between Tafsir and History: each report has its kind (hadith, Companion or Successor, historian, People of the Book), its attribution, the work it is found in, and for hadith its gradings with the scholar who gave each. |
| D17 | The prophets before Abraham get **traditional years, clearly marked**: years computed from intervals reported in tradition, drawn in a distinct "reckoned" style, with the other reckonings listed as alternatives and a note that history cannot date them. This closes former open question 1. |
| D18 | The owner's "tree" means the **chronological order of the prophets**, not a genealogy. No family-tree view; the relationships between prophets do not matter for now. |
| D19 | **Honorifics:** ﷺ after the name of the Prophet Muhammad, and "peace be upon him" after other prophets at their first mention in each entry. This closes former open question 11. The validator warns when "Muhammad" (the Prophet) is written without ﷺ. |
| D20 | (2026-11-25) The ages of the earliest prophets drive their dates. To keep the prophets after Noah where they are, the reckoning is **anchored on Noah's death** (about 3000 BCE, ten *qurun* read as a thousand years before Abraham) and **counted back to Adam** through the reported ages: Noah lived 350 years after the Flood (Ibn Sa'd), spent 950 years among his people (Quran 29:14) and was sent at 50 (one report); he was born 126 years after Adam's death (Ibn Jarir); Adam lived **960 years** (the owner's reading of al-Tirmidhi's version of the hadith, the thousand written for him less the forty he gave David), with 1,000 (Ahmad's version, Ibn Kathir) and 930 (the Torah) as alternatives; Idris lived through 308 years of Adam's life (Ibn Ishaq) and 365 years in all (the Torah's Enoch). Bars before Abraham are now lifespans, not 500-year windows. |

## Decided on 2026-11-26

| # | Decision |
|---|---|
| D21 | The owner asked for "the arabic translations of the content, all of it". Every reader-facing text in `content/` now has Arabic. Readers choose with an **EN / عربي switch** in the header: in Arabic the facts panel reads right to left and its headings are in Arabic, the timeline and map labels are in Arabic, and any text without Arabic falls back to English. The rest of the interface (the Quran reader, About, the editor) stays in English for now. This extends D14. |
| D22 | In Tafsir and Tradition, the **source's own wording is kept apart from the project's summary**: a new field, `original`, holds the words as quoted from the cited work, and `text` (English and Arabic) is the project's own summary or translation. In Arabic the original comes first, labeled «بلفظ المصدر», and the summary is labeled «بصياغة المشروع». Hadith wording is never written by Claude: reports with no `original` show only the summary until their wording is read in the source. |
| D23 | **Font for Arabic content: Noto Naskh Arabic** (SIL OFL 1.1). The owner first asked to try Thmanyah's font; its custom license reportedly forbids redistributing the files, so it cannot go into a public repository, and the owner chose an open Arabic content font instead. Amiri Quran stays for the Quran text. |
| D24 | **Abraham's birth is anchored at about 2166 BCE**, the Hebrew Bible's numbers counted back from the Exodus at about 1446 BCE, within the owner's estimate of 2500–2000 BCE and consistent with Ibn Kathir's "more than a thousand years" before Solomon. His life (to about 1991 BCE) is told in episodes, each placed by the age the sources give. Everything counted from Abraham moved by −166 years: his family after him (Lot, Ishmael, Isaac, Jacob, Joseph; Jacob now enters Egypt in 1876 BCE, 430 years before the Exodus) and the reckoning before him (D20: Noah's death now about 3166 BCE, the Flood about 3516 BCE, Adam about 5601–4642 BCE). Alternatives counted from something else, such as Ibn Sa'd's chain from the Prophet's birth, did not move. The former 2000–1826 BCE is kept as an alternative. Research: [research/abraham.md](research/abraham.md). |
| D25 | **The main sources are Islamic.** The owner: "our main sources are Islamic, but others, as the Prophet Muhammad ﷺ said, we should neither believe nor reject Israelite reports". Reports of the People of the Book (the Torah, Jubilees, the rabbis, Josephus) appear in the Tradition layer after the Islamic ones, and the app labels each "neither affirmed nor denied". Greek and Roman writers go in the History layer, as statements of what they wrote. |
| D26 | **Deploy to GitHub Pages with GitHub Actions** (2026-11-27). The owner: "the repository is already public, let's go for Github pages". Every push to `main` builds, checks and publishes the site. Free hosts compared before choosing: Cloudflare Pages, Vercel Hobby, Netlify Free, Codeberg Pages. The basemap is still open (question 9): OpenTopoMap is reported to be in reduced "survival mode", and Stadia Maps' "Stamen Terrain Background" (free for non-commercial use, no modern labels) was proposed but not chosen. |

## Implemented as proposed, not yet confirmed by the owner

These were built as proposed, because the app needed them, but the owner has not explicitly confirmed them. Each is easy to change.

- The four content layers: Quran, tafsir, history and archaeology, and connection, with status and confidence labels ([03](03-content-principles.md)).
- Era bands in the timeline background.
- Lanes by region or civilization, with the Quran lane pinned at the top and a theme lane for technology and climate. Seeded lanes: Quran, Levant, Egypt, Anatolia, Mesopotamia, Arabia, Technology and climate. The Aegean has no lane yet because no event needs one.
- Links between lanes, drawn only while an event is selected, with the types context, consequence and parallel.
- Faint map markers for other events from the same period.
- Shaded areas on the map for disputed locations.
- Lane toggles, a URL for each event, and arrow-key navigation.
- Tanzil as the Quran source ([05](05-quran-data.md)).
- One YAML file per event, with the schema in [04](04-data-model.md).

## Choices Claude made while implementing (confirm with the owner)

- **Tanzil XML format**, so the basmala stays apart from verse 1. The plain-text format puts the basmala in front of verse 1 of each surah ([05](05-quran-data.md)).
- **Amiri Quran** as the Quran font, for its clear license (SIL OFL 1.1). The KFGQPC font's terms were not checked. Rendering has been checked only in Chrome so far.
- **Default basemap: OpenTopoMap** (terrain), with OpenStreetMap as the alternative. Both still show modern borders and place names, so open question 9 remains.
- **A `review` field** (`draft` or `reviewed`) on events and eras. A draft may have unsourced claims and a connection without a confidence level; these are warnings. A reviewed entry may not; they are errors that fail the build. Drafts are labeled in the app.
- **A `notes` field** for editorial notes. They are not shown to readers and appear only on the local dev server.
- **Schema refinements** to [04](04-data-model.md): `basis` is a language map; location opinions and alternative dates take a `sources` list; place names have the form `{ name, type: ancient | modern, language }`; geometry is a GeoJSON Point or Polygon.
- **A proposed location given as a single point** is drawn as a dashed circle 40 km across, not as a pin.
- **An unknown location** shows a short notice on the map ("described in the facts panel") and nothing else.
- **The Quran reader is a separate view.** The facts panel links to it ("open in reader"), and the reader links verses back to the events that cite them. Open question 10 asked about this; the owner can still choose an overlay instead.
- **Draft pilot content:** 15 events, 4 eras and 1 source, written only from the leads in these docs. Every one is a draft, with what still needs checking in its `notes`. The verse references were checked against the dataset text; the historical leads were not checked against sources.
- **Vitest** for unit tests, with an end-to-end check of the editor forms run by hand during development.

### For the Prophets lane (D16–D19)

The research behind these is in [research/prophets-chronology.md](research/prophets-chronology.md).

- **A pinned Prophets lane** above the Quran lane, with one period entry per prophet (25), plus one Quran-lane event, "Abraham and Ishmael raise the foundations of the House". The Quran-lane events on David and Solomon link to the new entries.
- **The reckoning before Abraham** uses the one sound report from the Prophet ﷺ, the hadith of Abu Umama: ten *qurun* between Adam and Noah, and ten between Noah and Abraham. Each *qarn* is read as a hundred years, as Ibn Sa'd's report does. The count starts from Abraham at about 2000 BCE, following Ibn Kathir's remark that more than a thousand years separate Abraham from Solomon. Each prophet before Abraham is drawn as a **500-year window**, not a lifespan. The weak year-by-year chains of Ibn Sa'd (through al-Waqidi and al-Kalbi) appear only as alternatives and as graded reports.
- **From Abraham onward,** the ages of the patriarchs are the People of the Book's figures as Ibn Kathir reports them. Moses uses 1 Kings 6:1. The prophets from the 9th century BCE are tied to the biblical kings; Josephus is cited for John and Tacitus for Jesus.
- **Job, Shu'ayb and Dhu al-Kifl** use the "unknown" certainty: they are placed only by Ibn Kathir's order of the prophets.
- **Hadith gradings are attributed to named scholars**, and a narrator's grading (for example Ibn Hajar on al-Kalbi) is shown as such. Hadith that could not be read on sunnah.com or Dorar, which refuse automated access, are cited through the works that quote them, and the source's notes say so.
- **The default timeline window** now shows the whole sequence of prophets (4400 BCE – 800 CE), instead of 1350–850 BCE.
- **The history layer of the prophet entries** has only claims whose sources were read: Josephus on John and Tacitus on Jesus. Claims about Thamud and Hegra, Ahab, Jeroboam II and the Exodus are left as TODOs in the entries' notes until sources are found.

### For the Flood (2026-11-25)

The owner asked for "a further search" on the great flood. The research is in [research/the-flood.md](research/the-flood.md).

- **"The Flood of Noah"** is a Quran-lane event, reckoned at about 3000 BCE at the end of Noah's reckoned time. It uses all five layers. The question of the Flood's extent (the whole earth, or Noah's people) is set out in the **Tafsir** layer, each view in its author's words with its source, without the app taking a side.
- **Three context entries:** "The Sumerian flood traditions" and "Flood layers at Kish and Shuruppak" in the Mesopotamia lane, and "The Black Sea flood hypothesis" (debated) in the Technology and climate lane.
- **A draft connection** in the Flood entry notes that the reckoned date for Noah falls on the same horizon as the Kish and Shuruppak flood layers, about 3000 BCE, and calls this a coincidence, not a proof. The owner decides whether to keep it and sets its confidence.
- **People of the Book in the Tradition layer** now also covers their scriptures cited directly (here Genesis), not only as transmitted by Muslim scholars.
- **A certain part inside a span** (`when.core`): for Noah, the Quran's 950 years are drawn solid inside his reckoned life, whose years before his mission and after the Flood are only reported (D20). The Flood is now reckoned at about 3350 BCE, and its draft connection was reworded accordingly.
- **The ﷺ check** now recognizes other people named Muhammad by the name that follows (for example "Muhammad 'Abduh").

### For the Arabic translation (2026-11-26, D21–D23)

- **The Arabic was written by Claude** from the English, for all 450 texts that lacked it (about 10,100 English words). It is a draft like the rest of the content, and needs the owner's review. Where the source's Arabic wording was available (`original`), it guided the terms used.
- **Quran wording is never reproduced.** Verses are referred to by number and paraphrased. Every Arabic text was checked by script against the Tanzil text for runs of three or more words matching a verse; the matches left are names and everyday phrases (for example «في سبيل الله», «عيسى ابن مريم»).
- **Quotations that reached the project in English** (Kramer's Sumerian texts, Josephus, Tacitus, Diodorus, Time magazine, the Bible in the World English Bible, 1 Enoch) are translated by the project and marked «مترجمةٌ عن الإنجليزية» or «بترجمة المشروع عن الإنجليزية», so they are not taken for published Arabic translations.
- **Arabic wording of scholars is quoted only where it was read** (in `original`, or given in Arabic or in transliteration in the English). Elsewhere their words are reported indirectly, without quotation marks.
- **Hadith summaries are written as reports** («يذكر الحديث أن…»), not in the hadith's own voice, so they cannot be mistaken for its wording.
- **Honorifics in Arabic:** ﷺ after the Prophet's name and «عليه السلام» where the English has "peace be upon him". The validator now also checks Arabic text for «محمد» without ﷺ.
- **Names** use the forms of the Arabic sources where they exist (داوود as in the existing titles, أرفخشذ, عوص), and the forms of the Arabic Bible for biblical names (أخآب، يربعام، أرفكشاد). Modern names are transliterated (كريمر، وولي). Hazarmaveth is written حَصَرماوِت, not حضرموت, so that the Hud entry's connection stays an observation of resemblance.
- **Numbers and dates:** Western digits, as in verse references; ق.م and م for BCE and CE, with Arabic number agreement (آيتان، 3 آيات، 11 آية). The timeline axis keeps time running left to right.
- **Citations and the bibliography** stay in the form of the cited edition (mostly English), isolated so they read correctly inside Arabic text.
- **The grading scholar (`by`)** became a language map, so it can be shown in Arabic.
- **The project's name** is shown in English in both languages; it has no Arabic name yet (open question 17).
- **A layout bug** was fixed on the way: when the lanes needed a vertical scrollbar, the timeline widened by the scrollbar's width on every frame and pushed the facts panel off the screen.

## Open questions (ask the owner)

3. **The layers.** Confirm the model (now five layers, with Tradition), and decide who assigns the confidence level for connections. The editor currently says "set by the owner".
4. **The lanes.** Confirm the seeded lanes and the technology and climate lane.
6. **Translations.** Which English translation, if any, can be used given copyright? Or should verses link out to another site? None is included yet; search works on the Arabic text only.
9. **Basemap.** A terrain map without modern borders? Which provider? See the note on OpenTopoMap above.
10. **The Quran reader.** Confirm the separate view (see above), or choose an overlay.
12. **Contributors and review.** Who writes the content, and who reviews it? Is scholarly review wanted?
13. **Mobile.** Is a small-screen layout needed for the first version? The current layout is for desktop screens.
14. **Hijri dates.** For Islamic-era events in later phases, should dates also be shown in the Hijri calendar?
15. **Audience.** Who is the main audience? This affects tone and depth.

16. **The hadith on the periods between the prophets.** Is the weak report in al-Hakim's *al-Mustadrak* (Ibn Abbas, through Ali ibn Zayd ibn Jud'an and Yusuf ibn Mihran) the one the owner had in mind? See [research/prophets-chronology.md](research/prophets-chronology.md).
17. **The project's name in Arabic.** Should "Chronotope of Quranic Reality" have an Arabic name for the Arabic view, and if so, which?
18. **A full Arabic interface.** Should the Quran reader, the About page and the header also switch to Arabic, beyond what D21 covers?

Questions 2, 5, 7 and 8 were answered by D14, question 1 by D17, and question 11 by D19.
