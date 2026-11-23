# Quran data (Hafs)

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
