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
  established: { en: 'established', ar: 'ثابت' },
  estimated: { en: 'estimated', ar: 'تقديري' },
  traditional: { en: 'traditional dating', ar: 'تأريخ تقليدي' },
  reckoned: { en: 'traditional reckoning', ar: 'حساب من الروايات' },
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
  explore: { en: 'Explore', ar: 'استكشاف' },
  quran: { en: 'Quran', ar: 'القرآن' },
  editor: { en: 'Editor', ar: 'المحرر' },
  about: { en: 'About', ar: 'عن المشروع' },
  switchTo: { en: 'عربي', ar: 'English' },
  switchTitle: { en: 'Read the content in Arabic', ar: 'Read the content in English' },

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
  zoomIn: { en: 'Zoom in', ar: 'تكبير' },
  zoomOut: { en: 'Zoom out', ar: 'تصغير' },
  fitAll: { en: 'Fit all', ar: 'عرض الكل' },
  fitAllTitle: { en: 'Show all events in the visible lanes', ar: 'اعرض كل الأحداث في المسارات الظاهرة' },
  reset: { en: 'Reset', ar: 'إعادة' },
  resetTitle: { en: 'Back to the default window', ar: 'العودة إلى العرض الافتراضي' },
  lanes: { en: 'Lanes', ar: 'المسارات' },
  pinned: { en: ' (pinned)', ar: ' (مثبّت)' },
  legendSolid: { en: 'established / estimated', ar: 'ثابت / تقديري' },
  legendTraditional: { en: 'traditional', ar: 'تقليدي' },
  legendDebated: { en: 'debated', ar: 'مختلف فيه' },
  legendReckoned: { en: 'reckoned', ar: 'حساب من الروايات' },
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

  // Quran reader
  onTheTimeline: { en: 'On the timeline:', ar: 'على الخط الزمني:' },
} satisfies Labels;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, lang: Lang): string {
  return UI[key][lang];
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
