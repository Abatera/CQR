# Content principles

The app links scripture to history, so its credibility depends on one thing: readers must always be able to tell what comes from where. This matters more than any feature.

## The five layers

Claude **proposed** the first four layers in planning, and they are implemented; the owner has not yet explicitly confirmed them. The owner added the **Tradition** layer on 2026-11-23 (D16 in [08-decisions.md](08-decisions.md)).

Every event keeps these layers apart:

| Layer | What it holds | Rule |
|---|---|---|
| **Quran** | Verse references. The text is loaded from the dataset. | Each reference is checked against the dataset. A paraphrase is never presented as the text. |
| **Tafsir** | What classical commentators said. | Name the commentator, the work, and where in it the passage is (volume and page, or the verse it comments on). |
| **Tradition** | Hadith, reports from the Companions and Successors, the classical historians, and reports from the People of the Book, whether transmitted by Muslim scholars or cited from their scriptures. | Name who the report is attributed to and the work it is found in. Give every hadith or Companion's report a grading, with the scholar who gave it and where. Present reports as reports, never as fact, and show weak ones as weak. The source's own words go in `original`, quoted from the cited work, never from memory; the English and Arabic in `text` are the project's summary (D22). |
| **History and archaeology** | What is known from outside the Quran. | Each claim has at least one source and a status: `established` or `debated`. |
| **Connection** (shown to readers as "Our reflection", D27) | The project's own reflection that links the layers above. | Labeled as interpretation, with a confidence of `low`, `medium` or `high`. Never stated as fact. |

## Arabic text (D21, D22)

Every text has an Arabic version, written by the project. These rules keep the project's Arabic from being taken for a source's words:

- **The project's Arabic is a translation or summary**, never a source's wording. The source's words, where they were read, go in `original` and are shown apart, labeled «بلفظ المصدر».
- **Never reproduce the Quran in the project's text.** Refer to verses by number and paraphrase them; readers open the verse itself from the dataset. Check new Arabic against the Tanzil text for runs of three or more words that match a verse.
- **Never write hadith wording.** Report a hadith indirectly («يذكر الحديث أن…»), and quote it only in `original`, from the cited work.
- **Quote a scholar's Arabic only where it was read.** Otherwise report it indirectly, without quotation marks.
- **Quotations that reached the project in another language** (a translated inscription, Josephus, the Bible in English) are translated by the project and marked «مترجمةٌ عن الإنجليزية».
- **Honorifics:** ﷺ after the Prophet's name; «عليه السلام» where the English has "peace be upon him".

## Dating

- The owner wants **periods, researched as precisely as possible**, not just an order of events.
- Store a range (`from` to `to`) and a certainty: `established`, `estimated`, `traditional` (from a religious or traditional chronology), `reckoned`, `debated` or `unknown`.
- `reckoned` is for periods that history cannot date at all, such as the prophets before Abraham. The years are computed from intervals reported in tradition, drawn in a distinct hatched style, and the facts panel says that they are a reckoning, not a date (D17). The range drawn is a window around the reckoning, not a lifespan; the basis must say how it was computed.
- Always state what the date is based on, such as "traditional biblical chronology" or "radiocarbon dating of slag layers".
- When scholars disagree, show the main alternatives.
- The Quran rarely gives dates. When a date comes from the Bible or from later tradition, say so.

## Locations

- Each location has a status of `known`, `proposed` or `unknown`. In the owner's words, a location "can be only spoken of but not pointed to if we don't know it".
- For a proposed location, list each opinion with its source.
- Give both ancient and modern names where they exist.

## Sources

- Prefer peer-reviewed scholarship and standard reference works. For tafsir, use the classical works that are actually consulted, and cite them precisely.
- Every source has a full entry in the sources file (see [04-data-model.md](04-data-model.md)).
- Popular websites are not sources. At most they point the way to a better source.
- **Islamic sources lead (D25).** The Quran, tafsir, hadith and the Muslim historians come first. Reports of the People of the Book (the Torah, Jubilees, the rabbis, Josephus) follow them in the Tradition layer, with the kind `ahl-al-kitab`, and the app labels each "neither affirmed nor denied". Greek and Roman writers go in the History layer, as statements of what they wrote.

## Tone

- Respectful of the Quran, and of readers of every background.
- Present debates fairly, including where the historical evidence is thin or conflicts with tradition.
- Avoid "proof" language.
- **Honorifics (decided, D19):** ﷺ after the name of the Prophet Muhammad, and "peace be upon him" after other prophets at their first mention in each entry. Titles and labels do not carry "peace be upon him"; "Muhammad ﷺ" keeps ﷺ everywhere. The validator warns when the Prophet's name appears without ﷺ.

## Worked example: David, iron and armor

This is how the owner's original idea maps onto the layers. Every historical item below is an **unverified research lead** that was recalled in planning. Verify each one before using it.

**Quran**

- 34:10–11: iron made soft for David, and the command to make *sābighāt* (full coats of mail) and to measure the *sard* (the links).
- 21:80: David was taught the making of armor (*ṣanʿat labūs*) to protect people in battle.
- 34:12: for Solomon, a spring of molten copper (*ʿayn al-qiṭr*).
- Background: 2:246–251 (Talut, Jalut, and David receiving kingship), 38:17–40 and 27:15–44.

**Tafsir**

To be researched. One lead: classical commentators explain *sābighāt* and *sard*, and some say that David was the first to make mail armor. Verify this in the actual works.

**History and archaeology (leads)**

- The Late Bronze Age collapse happened around 1200–1150 BCE. Reference: Eric H. Cline, *1177 B.C.: The Year Civilization Collapsed* (revised edition, Princeton University Press, 2021).
- Smelted iron was known before 1200 BCE, in Anatolia and elsewhere, but it was rare and valuable. The older idea of a "Hittite iron monopoly" is largely abandoned.
- Iron became common for tools and weapons in the Levant during the 11th–10th centuries BCE.
- The traditional dates are about 1010–970 BCE for David and about 970–931 BCE for Solomon. These are debated.
- The size and splendor of the "united monarchy" are debated. Israel Finkelstein's "low chronology" stands against views such as Amihai Mazar's, and the excavations at Khirbet Qeiyafa are part of the debate.
- The Tel Dan stele (9th century BCE) mentions the "House of David". It is the earliest known reference to David outside the Bible.
- Copper production at Timna and Faynan (Khirbet en-Nahas) has been radiocarbon-dated to the 10th century BCE, in work by Thomas Levy and Erez Ben-Yosef. Who controlled the mines is debated.

**Connection (draft; the owner sets the confidence level)**

The Quran associates David with iron worked into armor, and Solomon with molten copper. Both metals fit what archaeology shows about metalworking in that region in the 10th century BCE.

**Explicitly rejected:** the claim that "they had iron when no one else could smelt it". Do not reintroduce it.
