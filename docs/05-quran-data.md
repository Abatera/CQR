# Quran data (Hafs)

## As implemented (2026-11-23)

- **Source:** Tanzil, downloaded on 2026-11-23 into [data/third-party/quran/](../data/third-party/quran/): the Uthmani text for display, the Simple-clean text for search, and the metadata. The files are unmodified. Their URLs, dates and SHA-256 checksums are in `SOURCE.json`.
- **Format:** XML, not plain text. In the plain-text format the basmala is part of verse 1 of each surah (for example, 41:1 reads as the basmala followed by حمٓ). The XML keeps it in a separate `bismillah` attribute: 112 surahs have one. Al-Fatiha's basmala is its verse 1, and At-Tawbah has none.
- **License, checked on 2026-11-23** on Tanzil's download page and in the files' own notice: Creative Commons Attribution 3.0; verbatim copies only, changing the text is not allowed; credit Tanzil with a link to tanzil.net; keep the copyright notice. The app credits Tanzil under every verse block and in the reader, and shows the full notice on the About page.
- **Derived search index:** none is stored. Normalization runs in memory in the browser when the text loads, so the question of whether the terms allow a derived index does not arise.
- **Integrity:** `npm run quran:verify` passes: checksums match, both texts have 114 surahs and 6,236 verses, and the texts and metadata agree on every surah's verse count. Spot-checking against a printed mushaf is still to be done.
- **Font:** Amiri Quran 1.003 (SIL OFL 1.1), self-hosted. The ۝ ornament with Arabic-Indic digits renders as an enclosed verse number. Rendering has been checked in Chrome only; Firefox and Safari are still to be checked.
- **Search:** in the browser, on the normalized Simple-clean text, by part of a word or whole word. A reference such as `34:10` jumps to the verse. Matches are highlighted in the Uthmani text by word position. In 363 verses (about 6%) the two texts split words differently (for example يَـٰٓأَيُّهَا is one word in Uthmani but two in Simple), and there the highlight compares words directly and may be approximate. Results link to the timeline events that cite each verse.
- **Checks on content:** every reference in `content/` is checked against the dataset's verse counts by the validator, and the editor shows the verse text beside each reference as it is typed.

The sections below are the original planning notes.

## The owner's requirement

The project needs "a database of Quran Hafs verses with good quality, and readable and searchable".

## Hard rule

The model never writes Quran text. Every word of Arabic Quran text in the app is loaded from the verified dataset. Content files store references only.

## Source (proposed; verify before adopting)

- **Primary candidate: Tanzil (tanzil.net).** It provides a verified Hafs text in several types and formats:
  - the *Uthmani* type, for display;
  - the *Simple* or *Simple-clean* types, in standard modern spelling, for search;
  - metadata: surah names, Meccan or Medinan, juz divisions, and so on.
- **Alternatives to compare:**
  - the Unicode text and fonts of the King Fahd Glorious Quran Printing Complex (KFGQPC);
  - Tarteel's Quranic Universal Library (qul.tarteel.ai).

## Licensing (verify the exact current terms)

- As recalled in planning, Tanzil's terms allow copying and distributing the text verbatim, forbid changing it, and require crediting Tanzil and linking to tanzil.net.
- Consequences for the project:
  - Store the downloaded files **unmodified** in their own folder (for example `data/third-party/quran/`), together with their license text.
  - Do **not** relicense the Quran text under the project's CC BY-SA license. List it in `THIRD_PARTY.md`.
  - Search normalization happens in a separate index generated at build time. The source files are never edited. Confirm that the terms allow a derived search index.

## Integrity checks

- Record checksums of the downloaded files.
- Check the counts: 114 surahs and 6,236 verses (in the Kufan numbering used with Hafs).
- Spot-check verses against a printed mushaf or quran.com.

## Display ("readable")

- Show the Uthmani text with a Quran font. Candidates:
  - *KFGQPC Uthmanic Script HAFS*: free, but check its terms. It is designed for the Complex's own text encoding, so it may render Tanzil's text imperfectly.
  - *Amiri Quran*: licensed under the SIL Open Font License 1.1.
- Test tricky marks (small high letters, the different sukun shapes, pause marks) in Chrome, Firefox and Safari before choosing.
- End each verse with the ۝ verse-end ornament and its number in Arabic-Indic digits.

## Search ("searchable")

- Search runs in the browser, with no server. The text of 6,236 verses is on the order of 1–2 MB uncompressed, so it can be loaded on demand.
- Search the *Simple* text, because its spelling is what users actually type. Results show the *Uthmani* text, matched by surah and verse.
- Normalize both the text and the query:
  - strip the diacritics and Quranic annotation marks: U+064B–U+065F, U+0670 and U+06D6–U+06ED;
  - strip tatweel (U+0640);
  - unify the alef forms أ إ آ ٱ into ا;
  - map ى to ي and ة to ه;
  - optionally, map ؤ to و and ئ to ي.
- Features:
  - search by whole word or by substring;
  - search by reference, for example "34:10";
  - highlight matches, and show each result with its surah name and verse number.
- Later: search by root or lemma using morphology data. The Quranic Arabic Corpus is licensed under the GPL, so review what that would mean for the project first.

## Translations (open)

- Not decided. Many English translations are under copyright, Saheeh International for example.
- Possible public-domain candidates are Pickthall (1930) and the original 1934 Yusuf Ali. Later revised editions of Yusuf Ali are under copyright, and copyright status varies by country, so verify.
- The alternative is to link each verse to an external site such as quran.com instead of hosting a translation.
