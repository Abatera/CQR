# Quran text (Tanzil, Hafs)

**Do not edit these files.** Tanzil's terms allow verbatim copies only. The app reads them as they are.

| File | What it is | Used for |
|---|---|---|
| `quran-uthmani.xml` | Uthmani script, as in the Madina Mushaf | Display |
| `quran-simple-clean.xml` | Simple spelling without diacritics | Search |
| `quran-data.xml` | Metadata: surah names, verse counts, Meccan or Medinan, order of revelation | Surah list and verse counts |
| `SOURCE.json` | Download URL, date and SHA-256 checksum of each file | Integrity checks |

The XML format is used because it keeps the basmala apart from verse 1, in a `bismillah` attribute. The plain-text format puts it in front of verse 1 of each surah. The download options are Tanzil's defaults: pause marks, sajdah signs, superscript alefs and tatweel on; rub-el-hizb signs off. The URLs are in [scripts/paths.ts](../../../scripts/paths.ts).

## Checks

`npm run quran:verify` checks that:

- each file matches the checksum recorded when it was downloaded;
- there are 114 surahs and 6,236 verses in both texts;
- the two texts and the metadata agree on the number of verses in every surah;
- the Tanzil copyright notice is present.

These checks passed when the files were downloaded on 2026-11-23. Spot-checking verses against a printed mushaf or quran.com is still to be done by hand.

## Updating

Tanzil publishes corrections at [tanzil.net/updates](https://tanzil.net/updates/). To update, run `npm run quran:fetch` (it replaces the files and `SOURCE.json`), then `npm run quran:verify`, and review the changes with `git diff` before committing.

## License

Creative Commons Attribution 3.0 with Tanzil's terms of use, reproduced at the top of each XML file. See [THIRD_PARTY.md](../../../THIRD_PARTY.md).
