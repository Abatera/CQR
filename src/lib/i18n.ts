/**
 * The reader's language for content (D21): English, or Arabic read right to left.
 * Content text comes from the { en, ar } language maps in content/, with English
 * as the fallback where the Arabic is missing. The labels the app adds around the
 * content are below, in both languages.
 */

export type Lang = 'en' | 'ar';

export interface Picked {
  text: string;
  /** The language actually shown, which is English when the Arabic is missing. */
  lang: Lang;
  dir: 'ltr' | 'rtl';
}

export function dirOf(lang: Lang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** The text in the reader's language, or the English when there is no Arabic yet. */
export function pick(map: { en: string; ar?: string } | undefined, lang: Lang): Picked {
  if (!map) return { text: '', lang: 'en', dir: 'ltr' };
  if (lang === 'ar' && map.ar) return { text: map.ar, lang: 'ar', dir: 'rtl' };
  return { text: map.en, lang: 'en', dir: 'ltr' };
}

/** Just the text of `pick`. */
export function tx(map: { en: string; ar?: string } | undefined, lang: Lang): string {
  return pick(map, lang).text;
}

type Labels = Record<string, { en: string; ar: string }>;

const CERTAINTY: Labels = {
  established: { en: 'documented', ar: 'موثّق' },
  estimated: { en: 'estimated', ar: 'تقديري' },
  traditional: { en: 'traditional dating', ar: 'تأريخ تقليدي' },
  reckoned: { en: 'reckoned from tradition', ar: 'حساب من الروايات' },
  debated: { en: 'debated', ar: 'مختلف فيه' },
  unknown: { en: 'unknown', ar: 'غير معروف' },
};

const LOCATION: Labels = {
  known: { en: 'known location', ar: 'موضع معروف' },
  proposed: { en: 'proposed location', ar: 'موضع مقترح' },
  unknown: { en: 'location unknown', ar: 'الموضع غير معروف' },
};

const TRADITION_KIND: Labels = {
  hadith: { en: 'Hadith', ar: 'حديث' },
  athar: { en: 'Report (Companion or Successor)', ar: 'أثر (عن صحابي أو تابعي)' },
  historian: { en: 'Historian', ar: 'مؤرّخ' },
  'ahl-al-kitab': { en: 'From the People of the Book', ar: 'من أهل الكتاب' },
};

const GRADE: Labels = {
  sahih: { en: 'sahih (sound)', ar: 'صحيح' },
  hasan: { en: 'hasan (good)', ar: 'حسن' },
  daif: { en: "da'if (weak)", ar: 'ضعيف' },
  'very-weak': { en: 'very weak', ar: 'ضعيف جدًّا' },
  fabricated: { en: 'fabricated', ar: 'موضوع' },
  other: { en: 'see note', ar: 'انظر الملاحظة' },
};

const RELATION: Labels = {
  context: { en: 'Context', ar: 'سياق' },
  consequence: { en: 'Consequence', ar: 'نتيجة' },
  parallel: { en: 'Parallel', ar: 'موازٍ' },
};

const CLAIM_STATUS: Labels = {
  established: { en: 'established', ar: 'ثابت' },
  debated: { en: 'debated', ar: 'مختلف فيه' },
};

const CONFIDENCE: Labels = {
  low: { en: 'low confidence', ar: 'ثقة منخفضة' },
  medium: { en: 'medium confidence', ar: 'ثقة متوسطة' },
  high: { en: 'high confidence', ar: 'ثقة عالية' },
};

const NAME_TYPE: Labels = {
  ancient: { en: 'ancient', ar: 'قديم' },
  modern: { en: 'modern', ar: 'حديث' },
};

/** Names of languages as written in place names ("Hebrew", "Akkadian"). Unlisted ones are shown as written. */
const LANGUAGE_NAME: Record<string, string> = {
  Akkadian: 'الأكدية',
  Arabic: 'العربية',
  Aramaic: 'الآرامية',
  Egyptian: 'المصرية القديمة',
  English: 'الإنجليزية',
  Greek: 'اليونانية',
  Hebrew: 'العبرية',
  Hittite: 'الحيثية',
  Latin: 'اللاتينية',
  Persian: 'الفارسية',
  Sabaic: 'السبئية',
  Sumerian: 'السومرية',
  Syriac: 'السريانية',
  Turkish: 'التركية',
};

function label(table: Labels, key: string, lang: Lang): string {
  return table[key]?.[lang] ?? key;
}

export const certaintyText = (c: string, lang: Lang) => label(CERTAINTY, c, lang);
export const locationText = (s: string, lang: Lang) => label(LOCATION, s, lang);
export const traditionKindText = (k: string, lang: Lang) => label(TRADITION_KIND, k, lang);
export const gradeText = (g: string, lang: Lang) => label(GRADE, g, lang);
export const relationText = (r: string, lang: Lang) => label(RELATION, r, lang);
export const claimStatusText = (s: string, lang: Lang) => label(CLAIM_STATUS, s, lang);
export const confidenceText = (c: string, lang: Lang) => label(CONFIDENCE, c, lang);
export const nameTypeText = (t: string, lang: Lang) => label(NAME_TYPE, t, lang);
export const languageNameText = (n: string, lang: Lang) => (lang === 'ar' ? (LANGUAGE_NAME[n] ?? n) : n);

/** English labels, for the editor. */
export const CERTAINTY_EN = Object.fromEntries(Object.entries(CERTAINTY).map(([k, v]) => [k, v.en]));
export const TRADITION_KIND_EN = Object.fromEntries(Object.entries(TRADITION_KIND).map(([k, v]) => [k, v.en]));
export const GRADE_EN = Object.fromEntries(Object.entries(GRADE).map(([k, v]) => [k, v.en]));

/** The labels the app shows around the content. */
const UI = {
  // Header
  home: { en: 'Home', ar: 'الرئيسية' },
  explore: { en: 'Explore', ar: 'استكشاف' },
  journeys: { en: 'Journeys', ar: 'رحلات' },
  quran: { en: 'Quran', ar: 'القرآن' },
  editor: { en: 'Editor', ar: 'المحرر' },
  about: { en: 'About', ar: 'عن المشروع' },
  switchTo: { en: 'عربي', ar: 'English' },
  switchTitle: { en: 'Read the content in Arabic', ar: 'Read the content in English' },
  language: { en: 'Language', ar: 'اللغة' },
  views: { en: 'Views', ar: 'الصفحات' },
  searchLabel: { en: 'Search prophets, events, places and verses', ar: 'ابحث في الأنبياء والأحداث والأماكن والآيات' },
  searchPlaceholder: { en: 'Search prophets, events, places, verses…', ar: 'ابحث في الأنبياء والأحداث والأماكن والآيات…' },
  searchNoResults: { en: 'No events match.', ar: 'لا أحداث مطابقة.' },
  searchInQuran: { en: 'Search the Quran for', ar: 'ابحث في القرآن عن' },
  goToVerse: { en: 'Open the verse', ar: 'افتح الآية' },
  close: { en: 'Close', ar: 'إغلاق' },

  // Home
  homeKicker: { en: 'One timeline, one map, five layers of knowledge', ar: 'خطٌّ زمنيٌّ واحد، وخريطةٌ واحدة، وخمس طبقاتٍ من المعرفة' },
  homeTitle: { en: 'The stories of the Quran, in time and place.', ar: 'قصص القرآن، في زمانها ومكانها.' },
  homeLead: {
    en: 'Follow the prophets from Adam to Muhammad ﷺ on one timeline and one map, beside what history and archaeology know about the same periods and places. Every claim shows its source and how sure it is.',
    ar: 'تتبّع الأنبياء من آدم إلى محمد ﷺ على خطٍّ زمنيٍّ واحد وخريطةٍ واحدة، إلى جانب ما يعرفه التاريخ وعلم الآثار عن الحقب والأماكن نفسها. ولكلِّ قولٍ مصدره ودرجةُ اليقين فيه.',
  },
  startExploring: { en: 'Start exploring', ar: 'ابدأ الاستكشاف' },
  takeJourney: { en: 'Take a guided journey', ar: 'خذ رحلةً موجَّهة' },
  draftsShort: {
    en: 'A work in progress: every entry is still a draft whose sources are being checked.',
    ar: 'عملٌ قيد الإنجاز: كلُّ المداخل مسوّداتٌ ما تزال مصادرها قيد التحقّق.',
  },
  beginJourney: { en: 'Begin with a journey', ar: 'ابدأ برحلة' },
  journeysHint: { en: 'Each journey moves the timeline and the map together, one step at a time.', ar: 'تحرّك كلُّ رحلةٍ الخطَّ الزمني والخريطةَ معًا، خطوةً بعد خطوة.' },
  howToRead: { en: 'How to read an entry', ar: 'كيف تقرأ مدخلًا' },
  howToReadLead: {
    en: 'Every entry keeps five kinds of knowledge apart, always in the same order and the same colors, so you can see at a glance what the Quran says, what scholars reported, what history knows, and where we are only offering a reflection.',
    ar: 'يفصل كلُّ مدخلٍ بين خمسة أنواعٍ من المعرفة، بالترتيب نفسه والألوان نفسها دائمًا، لترى في لمحةٍ ما يقوله القرآن، وما رواه العلماء، وما يعرفه التاريخ، وأين لا نقدّم إلا تأمّلًا.',
  },
  layerQuranAbout: { en: 'The verses themselves, always from the verified Tanzil text.', ar: 'الآيات نفسها، من نصّ تنزيل المُتحقَّق منه دائمًا.' },
  layerTafsirAbout: { en: 'What the classical commentators said, each with its source.', ar: 'ما قاله المفسّرون المتقدّمون، ولكلِّ قولٍ مصدره.' },
  layerTraditionAbout: { en: 'Hadith and historians, with gradings by named scholars.', ar: 'الحديث والمؤرّخون، مع درجات الأحاديث عند علماء مسمَّين.' },
  layerHistoryAbout: { en: 'What history and archaeology know, marked established or debated.', ar: 'ما يعرفه التاريخ وعلم الآثار، موسومًا بالثابت أو المختلف فيه.' },
  layerReflectionAbout: { en: 'Our own reading of how the layers meet, always labeled as interpretation.', ar: 'قراءتنا لكيفية التقاء الطبقات، موسومةً دائمًا بأنها تأويل.' },

  // The five layers
  layerQuran: { en: 'Quran', ar: 'القرآن' },
  layerTafsir: { en: 'Tafsir', ar: 'التفسير' },
  layerTradition: { en: 'Tradition', ar: 'المرويّات' },
  layerHistory: { en: 'History', ar: 'التاريخ' },
  layerReflection: { en: 'Our reflection', ar: 'تأمّلنا' },
  layersNav: { en: 'Layers of this entry', ar: 'طبقات هذا المدخل' },
  inTheQuran: { en: 'In the Quran', ar: 'في القرآن' },
  whatCommentatorsSaid: { en: 'What the commentators said', ar: 'ما قاله المفسّرون' },
  hadithAndHistorians: { en: 'Hadith and historians', ar: 'الحديث والمؤرّخون' },
  reflectionSub: { en: "The project's own reading, not an established fact", ar: 'قراءةُ المشروع نفسه، وليست حقيقةً ثابتة' },
  none: { en: 'none', ar: 'لا شيء' },

  // Entry header
  kindEvent: { en: 'event', ar: 'حدث' },
  kindPeriod: { en: 'period', ar: 'حقبة' },
  draftShort: { en: 'Draft · sources being checked', ar: 'مسوّدة · المصادر قيد التحقّق' },
  previousEvent: { en: 'Previous event', ar: 'الحدث السابق' },
  nextEvent: { en: 'Next event', ar: 'الحدث التالي' },
  copyLink: { en: 'Copy a link to this entry', ar: 'انسخ رابط هذا المدخل' },
  linkCopied: { en: 'Link copied', ar: 'نُسخ الرابط' },
  inTheQuranChip: { en: 'in the Quran', ar: 'في القرآن' },
  placeUnknownShort: { en: 'place unknown', ar: 'الموضع غير معروف' },
  proposedShort: { en: 'proposed', ar: 'مقترح' },
  knownShort: { en: 'known place', ar: 'موضع معروف' },
  howReckoned: { en: 'How this year is reckoned', ar: 'كيف حُسبت هذه السنة' },
  howDated: { en: 'How this date is known', ar: 'على أيّ شيءٍ يقوم هذا التاريخ' },
  historyCannotDate: { en: 'History cannot date this', ar: 'لا يستطيع التاريخ تأريخه' },
  fullBasis: { en: 'The full basis', ar: 'الأساس كاملًا' },
  roughSketches: { en: 'The areas drawn are rough sketches, not exact places.', ar: 'المناطق المرسومة تخطيطاتٌ تقريبية، لا مواضع دقيقة.' },
  showFewer: { en: 'Show fewer', ar: 'اعرض أقلّ' },
  aroundThisTime: { en: 'Around this time', ar: 'في الحقبة نفسها' },
  sameTime: { en: 'at the same time', ar: 'في الوقت نفسه' },
  readEntry: { en: 'Read the entry', ar: 'اقرأ المدخل' },
  onTheMapAndTimeline: { en: 'On the map and timeline', ar: 'على الخريطة والخط الزمني' },
  back: { en: 'Back', ar: 'رجوع' },
  chooseEvent: { en: 'Choose an event on the timeline or the map.', ar: 'اختر حدثًا على الخط الزمني أو الخريطة.' },

  // Journeys
  journeysTitle: { en: 'Guided journeys', ar: 'رحلات موجَّهة' },
  steps: { en: 'Steps', ar: 'الخطوات' },
  journeysLead: {
    en: 'A journey walks through a story one step at a time: the map moves to each place, the timeline to each moment, and each step shows what history knows of the same years.',
    ar: 'تمضي الرحلة في القصة خطوةً بعد خطوة: تنتقل الخريطة إلى كلِّ مكان، والخطُّ الزمني إلى كلِّ لحظة، وتُظهر كلُّ خطوةٍ ما يعرفه التاريخ عن السنين نفسها.',
  },
  leaveJourney: { en: 'Leave the journey', ar: 'اترك الرحلة' },
  begin: { en: 'Begin', ar: 'ابدأ' },
  next: { en: 'Next', ar: 'التالي' },
  startAgain: { en: 'Start again', ar: 'من البداية' },
  openFullEntry: { en: 'Open the full entry', ar: 'افتح المدخل كاملًا' },
  meanwhile: { en: 'Meanwhile, in history', ar: 'وفي الأثناء، في التاريخ' },
  noHistoryYet: { en: 'No dated history is recorded for these years yet.', ar: 'لا تاريخ مؤرَّخ مسجّلٌ لهذه السنين بعد.' },
  journeyNotFound: { en: 'This journey does not exist. It may have been renamed.', ar: 'هذه الرحلة غير موجودة، ولعلّ اسمها تغيّر.' },
  placeNotNamed: { en: 'The place is not known.', ar: 'الموضع غير معروف.' },

  // Facts panel: introduction
  introLead: {
    en: 'Events narrated in the Quran, placed on a timeline and a map next to what history and archaeology know about the same periods and places.',
    ar: 'أحداثٌ قصّها القرآن، موضوعةٌ على خطٍّ زمني وخريطة، إلى جانب ما يعرفه التاريخ وعلم الآثار عن الحقب والأماكن نفسها.',
  },
  introHow: {
    en: 'Select an event on the timeline or the map to see its facts here. Use the arrow keys to step through events.',
    ar: 'اختر حدثًا على الخط الزمني أو الخريطة لتظهر معلوماته هنا. واستعمل مفاتيح الأسهم للتنقّل بين الأحداث.',
  },
  introLayers: {
    en: "Each entry keeps five layers apart: the Quran text, what classical commentators said, what hadith and the classical historians report (with their gradings), what history and archaeology know, and the project's own connection between them, which is always labeled as interpretation.",
    ar: 'يفصل كلُّ مدخلٍ بين خمس طبقات: نصِّ القرآن، وما قاله المفسّرون المتقدّمون، وما ترويه الأحاديث والمؤرّخون المتقدّمون (مع درجاتها)، وما يعرفه التاريخ وعلم الآثار، وربطِ المشروع نفسه بينها، وهو موسومٌ دائمًا بأنّه قراءةٌ من المشروع.',
  },
  introDrafts: {
    en: 'The entries are drafts. Their claims, dates and sources are still being checked and must not be relied on yet.',
    ar: 'المداخل مسوّدات: ما تزال ادعاءاتها وتواريخها ومصادرها قيد التحقّق، فلا يُعتمد عليها بعد.',
  },
  arabicNote: {
    en: '',
    ar: 'الترجمة العربية مسوّدةٌ أيضًا، كتبها المشروع ولم تُراجَع بعد. وما لم يُترجَم بعدُ يظهر بالإنجليزية.',
  },

  // Facts panel: an entry
  draftBanner: {
    en: 'Draft: not yet reviewed. Its claims and sources are still being checked.',
    ar: 'مسوّدة: لم تُراجَع بعد. ما تزال ادعاءاتها ومصادرها قيد التحقّق.',
  },
  edit: { en: 'Edit', ar: 'تحرير' },
  when: { en: 'When', ar: 'الزمن' },
  where: { en: 'Where', ar: 'المكان' },
  from: { en: 'From ', ar: '' },
  basis: { en: 'Basis:', ar: 'الأساس:' },
  reckonedNote: {
    en: 'These years are a reckoning from intervals reported in tradition, not a historical date. History and archaeology cannot date this period.',
    ar: 'هذه السنون حسابٌ من فتراتٍ مرويّة في التراث، وليست تاريخًا ثابتًا؛ إذ لا يستطيع التاريخ ولا علم الآثار تأريخ هذه الحقبة.',
  },
  otherDatings: { en: 'Other datings:', ar: 'تأريخات أخرى:' },
  proposedLocations: { en: 'Proposed locations:', ar: 'مواضع مقترحة:' },
  notMapped: { en: ' (not mapped)', ar: ' (غير مرسوم على الخريطة)' },
  openInReader: { en: 'open in reader', ar: 'افتح في المصحف' },
  quranCredit: { en: 'Text:', ar: 'النص:' },
  quranCreditScript: { en: '(Hafs, Uthmani).', ar: '(رواية حفص، الرسم العثماني).' },
  tafsir: { en: 'Tafsir', ar: 'التفسير' },
  tradition: { en: 'Tradition', ar: 'المرويّات' },
  traditionSub: { en: 'hadith and historians: reports, with their gradings', ar: 'الحديث والمؤرّخون: الروايات مع درجاتها' },
  ahlKitabNote: {
    en: 'A report of the People of the Book: neither affirmed nor denied.',
    ar: 'روايةٌ من أهل الكتاب: لا تُصدَّق ولا تُكذَّب.',
  },
  inSourceWords: { en: "In the source's words:", ar: 'بلفظ المصدر:' },
  inProjectWords: { en: "In the project's words:", ar: 'بصياغة المشروع:' },
  projectWordsNote: {
    en: '',
    ar: 'ما ليس بلفظ المصدر فهو بصياغة المشروع: ملخّصٌ أو ترجمة، لا نصُّ الرواية.',
  },
  history: { en: 'History and archaeology', ar: 'التاريخ وعلم الآثار' },
  connection: { en: 'Connection', ar: 'الربط' },
  interpretation: { en: 'interpretation', ar: 'قراءة من المشروع' },
  confidenceNotSet: { en: 'confidence not set', ar: 'لم تُحدَّد درجة الثقة' },
  connectionNote: { en: "This is the project's own reflection, not an established fact.", ar: 'هذا تأمّلٌ من المشروع نفسه، وليس حقيقةً ثابتة.' },
  related: { en: 'Related events', ar: 'أحداث ذات صلة' },
  sources: { en: 'Sources', ar: 'المصادر' },
  link: { en: 'link', ar: 'رابط' },
  missingSource: { en: '(missing from sources)', ar: '(غير موجود في المصادر)' },
  noSource: { en: 'no source yet', ar: 'لا مصدر بعد' },
  noSourceTitle: { en: 'This needs a source before the entry can be reviewed.', ar: 'يحتاج هذا إلى مصدرٍ قبل مراجعة المدخل.' },

  // Timeline
  howSure: { en: 'How sure is the date?', ar: 'ما درجة اليقين في التاريخ؟' },
  legendDocumented: { en: 'Documented', ar: 'موثّق' },
  legendEstimated: { en: 'Estimated', ar: 'تقديري' },
  legendDebatedUnknown: { en: 'Debated or unknown', ar: 'مختلف فيه أو غير معروف' },
  showThem: { en: 'Show them', ar: 'أظهرها' },
  hideEmpty: { en: 'Fold empty lanes', ar: 'اطوِ المسارات الفارغة' },
  allOfTime: { en: 'All of time', ar: 'الزمن كلّه' },
  overviewLabel: { en: 'Overview of all time. Click or drag to move the timeline.', ar: 'نظرة على الزمن كلّه. انقر أو اسحب لتحريك الخط الزمني.' },
  zoomIn: { en: 'Zoom in', ar: 'تكبير' },
  zoomOut: { en: 'Zoom out', ar: 'تصغير' },
  fitAll: { en: 'Show all', ar: 'عرض الكل' },
  fitAllTitle: { en: 'Show the whole sequence of prophets', ar: 'اعرض سلسلة الأنبياء كلّها' },
  reset: { en: 'Reset', ar: 'إعادة' },
  resetTitle: { en: 'Back to the default window', ar: 'العودة إلى العرض الافتراضي' },
  lanes: { en: 'Lanes', ar: 'المسارات' },
  pinned: { en: ' (pinned)', ar: ' (مثبّت)' },
  legendSolid: { en: 'established / estimated', ar: 'ثابت / تقديري' },
  legendTraditional: { en: 'Traditional', ar: 'تقليدي' },
  legendDebated: { en: 'debated', ar: 'مختلف فيه' },
  legendReckoned: { en: 'Reckoned from tradition', ar: 'حساب من الروايات' },
  legendReckonedTitle: {
    en: 'Years computed from intervals reported in tradition; history cannot date these',
    ar: 'سنون محسوبة من فترات مرويّة في التراث؛ لا يستطيع التاريخ تأريخها',
  },
  timelineHint: { en: 'Scroll to zoom · drag to pan · ← → to step', ar: 'مرّر للتكبير · اسحب للتحريك · ← → للتنقّل' },

  // Map
  mapUnknown: {
    en: 'The location of this event is not known. It is described in the facts panel.',
    ar: 'موضع هذا الحدث غير معروف، وهو موصوفٌ في لوحة المعلومات.',
  },
  mapFaintSelected: { en: 'Faint markers: other events from the same period', ar: 'العلامات الباهتة: أحداثٌ أخرى من الحقبة نفسها' },
  mapFaintAll: { en: 'Faint markers: events with a known or proposed location', ar: 'العلامات الباهتة: أحداثٌ لها موضعٌ معروف أو مقترح' },
  mapSameTime: { en: 'Other events from the same time', ar: 'أحداثٌ أخرى من الحقبة نفسها' },
  mapOpinions: { en: 'Proposed locations', ar: 'مواضع مقترحة' },

  // Quran reader
  onTheTimeline: { en: 'On the timeline:', ar: 'على الخط الزمني:' },
} satisfies Labels;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, lang: Lang): string {
  return UI[key][lang];
}

/** Arabic noun forms by number: 1, 2, 3-10, 11 and up (the counted noun is then singular and accusative). */
interface ArForms {
  en: [string, string];
  one: string;
  two: string;
  few: string;
  many: string;
}
const AR_COUNT = {
  passage: { en: ['passage', 'passages'], one: 'مقطع واحد', two: 'مقطعان', few: 'مقاطع', many: 'مقطعًا' },
  comment: { en: ['comment', 'comments'], one: 'تعليق واحد', two: 'تعليقان', few: 'تعليقات', many: 'تعليقًا' },
  report: { en: ['report', 'reports'], one: 'رواية واحدة', two: 'روايتان', few: 'روايات', many: 'رواية' },
  finding: { en: ['finding', 'findings'], one: 'معلومة واحدة', two: 'معلومتان', few: 'معلومات', many: 'معلومة' },
  step: { en: ['step', 'steps'], one: 'خطوة واحدة', two: 'خطوتان', few: 'خطوات', many: 'خطوة' },
  lane: { en: ['lane', 'lanes'], one: 'مسار واحد', two: 'مساران', few: 'مسارات', many: 'مسارًا' },
  opinion: { en: ['opinion', 'opinions'], one: 'قول واحد', two: 'قولان', few: 'أقوال', many: 'قولًا' },
  source: { en: ['source', 'sources'], one: 'مصدر واحد', two: 'مصدران', few: 'مصادر', many: 'مصدرًا' },
} satisfies Record<string, ArForms>;
export type Counted = keyof typeof AR_COUNT;

/** "7 passages" / "7 مقاطع", with Arabic number agreement. Digits stay Western, as elsewhere. */
export function countText(n: number, noun: Counted, lang: Lang): string {
  const w: ArForms = AR_COUNT[noun];
  if (lang === 'en') return `${n} ${w.en[n === 1 ? 0 : 1]}`;
  if (n === 1) return w.one;
  if (n === 2) return w.two;
  return `${n} ${n <= 10 ? w.few : w.many}`;
}

/** "about 400 years later" / "بعده بنحو 400 سنة". `years` is negative for earlier. */
export function offsetText(years: number, lang: Lang): string {
  const n = Math.abs(Math.round(years));
  const rounded = n >= 100 ? Math.round(n / 50) * 50 : n >= 20 ? Math.round(n / 10) * 10 : n;
  if (lang === 'en') return `about ${rounded} years ${years < 0 ? 'earlier' : 'later'}`;
  return `${years < 0 ? 'قبله' : 'بعده'} بنحو ${yearsText(rounded, 'ar')}`;
}

/** "step 3 of 8" / "الخطوة 3 من 8". */
export function stepOfText(n: number, total: number, lang: Lang): string {
  return lang === 'en' ? `step ${n} of ${total}` : `الخطوة ${n} من ${total}`;
}

/** "Levant, Egypt: nothing recorded between 4800 and 2600 BCE yet." */
export function emptyLanesText(names: string, from: string, to: string, lang: Lang): string {
  return lang === 'en' ? `${names}: nothing recorded between ${from} and ${to} yet.` : `${names}: لا شيء مسجّلٌ بين ${from} و${to} بعد.`;
}

/** "3 verses" / "3 آيات", with Arabic number agreement. Digits stay Western, as in verse references. */
export function versesText(n: number, lang: Lang): string {
  if (lang === 'en') return `${n} verse${n === 1 ? '' : 's'}`;
  if (n === 1) return 'آية واحدة';
  if (n === 2) return 'آيتان';
  if (n >= 3 && n <= 10) return `${n} آيات`;
  return `${n} آية`;
}

/** The lead-in to the part of a span that a source fixes, ending with a colon before its basis. */
export function coreText(range: string, years: number, lang: Lang): string {
  return lang === 'ar'
    ? `ضمن هذه المدّة، يحدّد المصدرُ ${range} (${yearsText(years, lang)}):`
    : `Within this span, ${range} (${yearsText(years, lang)}) is fixed by the source:`;
}

/** "(950 years)" / "(950 سنة)", with Arabic number agreement. */
export function yearsText(n: number, lang: Lang): string {
  if (lang === 'en') return `${n} years`;
  if (n === 1) return 'سنة واحدة';
  if (n === 2) return 'سنتان';
  if (n >= 3 && n <= 10) return `${n} سنوات`;
  return `${n} سنة`;
}
