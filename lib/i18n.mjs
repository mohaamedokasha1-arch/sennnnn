/**
 * ============================================================================
 *  طبقة اللغة والنصوص (i18n-ready)
 * ============================================================================
 *  كل النصوص الظاهرة للزائر موجودة هنا بالعربية، مع دالة t() مركزية.
 *  لإضافة الإنجليزية لاحقًا: انسخ كائن AR إلى EN وترجم قيمه، ثم فعّل اللغة
 *  بحسب البادئة في الرابط (ar/en) — البنية والمحتوى (حقوق: title/titleOriginal)
 *  مهيّأة لذلك بدون إعادة هيكلة.
 * ============================================================================
 */

/* ------------------------------- التصنيفات ------------------------------- */
export const GENRES = {
  action: { ar: 'أكشن', en: 'Action' },
  crime: { ar: 'جريمة', en: 'Crime' },
  comedy: { ar: 'كوميديا', en: 'Comedy' },
  'black-comedy': { ar: 'كوميديا سوداء', en: 'Black Comedy' },
  satire: { ar: 'سخرية', en: 'Satire' },
  drama: { ar: 'دراما', en: 'Drama' },
  social: { ar: 'اجتماعي', en: 'Social' },
  romance: { ar: 'رومانسي', en: 'Romance' },
  horror: { ar: 'رعب', en: 'Horror' },
  'sci-fi': { ar: 'خيال علمي', en: 'Sci-Fi' },
  adventure: { ar: 'مغامرات', en: 'Adventure' },
  animation: { ar: 'رسوم متحركة', en: 'Animation' },
  documentary: { ar: 'وثائقي', en: 'Documentary' },
  thriller: { ar: 'إثارة وتشويق', en: 'Thriller' },
  mystery: { ar: 'غموض', en: 'Mystery' },
  family: { ar: 'عائلي', en: 'Family' },
  fantasy: { ar: 'فانتازيا', en: 'Fantasy' },
};

export const CONTENT_TYPE = {
  movie: { ar: 'فيلم', en: 'Movie', urlBase: '/movies' },
  series: { ar: 'مسلسل', en: 'Series', urlBase: '/series' },
};

export const SERIES_STATUS = {
  ongoing: 'مستمر',
  ended: 'منتهٍ',
  limited: 'محدود (موسم واحد)',
};

export const SERIES_STATUS_EN = {
  ongoing: 'Ongoing',
  ended: 'Ended',
  limited: 'Limited Series',
};

export const LANGUAGE_LABELS = {
  ar: 'العربية',
  en: 'الإنجليزية',
  fr: 'الفرنسية',
  ja: 'اليابانية',
  ko: 'الكورية',
  es: 'الإسبانية',
  tr: 'التركية',
  hi: 'الهندية',
  it: 'الإيطالية',
  de: 'الألمانية',
  da: 'الدنماركية',
  he: 'العبرية',
};

export const LANGUAGE_LABELS_EN = {
  ar: 'Arabic',
  en: 'English',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  tr: 'Turkish',
  hi: 'Hindi',
  it: 'Italian',
  de: 'German',
  da: 'Danish',
  he: 'Hebrew',
};

export const COUNTRY_LABELS = {
  EG: 'مصر',
  SA: 'السعودية',
  AE: 'الإمارات',
  MA: 'المغرب',
  TN: 'تونس',
  JO: 'الأردن',
  LB: 'لبنان',
  KW: 'الكويت',
  QA: 'قطر',
  DZ: 'الجزائر',
  IQ: 'العراق',
  SY: 'سوريا',
  YE: 'اليمن',
  SD: 'السودان',
  PS: 'فلسطين',
  BH: 'البحرين',
  OM: 'عُمان',
  LY: 'ليبيا',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  FR: 'فرنسا',
  JP: 'اليابان',
  KR: 'كوريا الجنوبية',
  IN: 'الهند',
  TR: 'تركيا',
  IT: 'إيطاليا',
  ES: 'إسبانيا',
  CA: 'كندا',
  AU: 'أستراليا',
  DE: 'ألمانيا',
  MX: 'المكسيك',
  AR: 'الأرجنتين',
  DK: 'الدنمارك',
  IL: 'إسرائيل',
};

export const COUNTRY_LABELS_EN = {
  EG: 'Egypt',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  MA: 'Morocco',
  TN: 'Tunisia',
  JO: 'Jordan',
  LB: 'Lebanon',
  KW: 'Kuwait',
  QA: 'Qatar',
  DZ: 'Algeria',
  IQ: 'Iraq',
  SY: 'Syria',
  YE: 'Yemen',
  SD: 'Sudan',
  PS: 'Palestine',
  BH: 'Bahrain',
  OM: 'Oman',
  LY: 'Libya',
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  TR: 'Turkey',
  IT: 'Italy',
  ES: 'Spain',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  MX: 'Mexico',
  AR: 'Argentina',
  DK: 'Denmark',
  IL: 'Israel',
};

/* ------------------------------ مساعدات لغة ------------------------------ */
export const genreLabel = (key, locale = 'ar') => (locale === 'en' ? GENRES[key]?.en : GENRES[key]?.ar) ?? key;
export const typeLabel = (kind, locale = 'ar') => (locale === 'en' ? CONTENT_TYPE[kind]?.en : CONTENT_TYPE[kind]?.ar) ?? kind;
export const countryLabel = (code, locale = 'ar') =>
  (locale === 'en' ? COUNTRY_LABELS_EN[code] : COUNTRY_LABELS[code]) ?? code;
export const languageLabel = (code, locale = 'ar') =>
  (locale === 'en' ? LANGUAGE_LABELS_EN[code] : LANGUAGE_LABELS[code]) ?? code;
export const statusLabel = (key, locale = 'ar') =>
  (locale === 'en' ? SERIES_STATUS_EN[key] : SERIES_STATUS[key]) ?? key;

/** عنوان الشخص مع أدواره: «اسم — مخرج، ممثل» */
export function personRoleLabel(roles = [], locale = 'ar') {
  const map =
    locale === 'en'
      ? { director: 'Director', actor: 'Actor', writer: 'Writer' }
      : { director: 'مخرج', actor: 'ممثل', writer: 'كاتب' };
  const sep = locale === 'en' ? ', ' : '، ';
  return roles.map((r) => map[r] ?? r).join(sep);
}

/* ------------------------------- المسارات ------------------------------- */
export const workUrl = (kind, slug) => `${CONTENT_TYPE[kind].urlBase}/${slug}/`;
export const genreUrl = (key) => `/genres/${key}/`;
export const personUrl = (id) => `/people/${id}/`;
export const reviewUrl = (slug) => `/reviews/${slug}/`;
export const listUrl = (slug) => `/lists/${slug}/`;

/* --------------------------- الرسائل والنصوص --------------------------- */
const AR = {
  // عام
  'site.skipToContent': 'تخطَّ إلى المحتوى الرئيسي',
  'site.editorialNote': 'رأي تحريري',
  'site.editorialNoteLong':
    'هذا المحتوى رأي تحريري يعبّر عن فريق أكاشا سينما، وليس حقيقة موضوعية أو تقييمًا رسميًا.',
  'site.updatedAt': 'آخر تحديث',
  'site.addedAt': 'تاريخ الإضافة',
  'site.minRead': 'دقيقة قراءة',

  // التنقل
  'nav.home': 'الرئيسية',
  'nav.movies': 'الأفلام',
  'nav.series': 'المسلسلات',
  'nav.genres': 'التصنيفات',
  'nav.reviews': 'المراجعات',
  'nav.lists': 'الترشيحات',
  'nav.favorites': 'المفضلة',
  'nav.search': 'بحث',
  'nav.menu': 'القائمة',
  'nav.openMenu': 'فتح القائمة',
  'nav.closeMenu': 'إغلاق القائمة',

  // البحث
  'search.placeholder': 'ابحث باسم الفيلم أو المسلسل…',
  'search.label': 'البحث في الموقع',
  'search.submit': 'ابحث',
  'search.title': 'البحث',
  'search.resultsFor': 'نتائج البحث عن: «{q}»',
  'search.countOne': 'نتيجة واحدة',
  'search.countMany': '{n} نتيجة',
  'search.emptyTitle': 'لا نتائج مطابقة',
  'search.emptyBody':
    'لم نعثر على أي عمل يطابق هذا البحث. جرّب كلمة أقصر أو جزءًا من الاسم، أو تصفّح الاقتراحات التالية.',
  'search.tip': 'نصيحة: البحث يعمل بالعربية أو بالاسم الأصلي، ويدعم البحث الجزئي.',
  'search.popularGenres': 'تصنيفات شائعة',
  'search.latestAdditions': 'أحدث الإضافات',

  // الفلاتر والترتيب
  'filter.genre': 'النوع',
  'filter.year': 'سنة الإصدار',
  'filter.language': 'اللغة',
  'filter.country': 'بلد الإنتاج',
  'filter.type': 'النوع الفني',
  'filter.status': 'حالة المسلسل',
  'filter.all': 'الكل',
  'filter.clear': 'مسح الفلاتر',
  'filter.resultsCount': '{n} عمل',
  'filter.resultsCountOne': 'عمل واحد',

  'sort.label': 'ترتيب حسب',
  'sort.newest': 'أحدث الإضافات',
  'sort.yearDesc': 'الأحدث إصدارًا',
  'sort.yearAsc': 'الأقدم إصدارًا',
  'sort.title': 'أبجديًا (أ–ي)',

  'pager.previous': 'السابق',
  'pager.next': 'التالي',
  'pager.page': 'صفحة {n}',
  'pager.loadMore': 'حمّل المزيد',
  'pager.showing': 'عرض {shown} من {total}',

  // حالة الفراغ
  'empty.movies': 'لا توجد أفلام منشورة تطابق الفلاتر الحالية.',
  'empty.series': 'لا توجد مسلسلات منشورة تطابق الفلاتر الحالية.',
  'empty.filtersHint': 'جرّب توسيع نطاق الفلاتر أو مسحها للبدء من جديد.',
  'empty.genre': 'لا يوجد محتوى منشور في هذا التصنيف بعد.',
  'empty.favorites': 'قائمة المفضلة فارغة حتى الآن.',
  'empty.favoritesHint': 'اضغط أيقونة القلب في أي بطاقة عمل لإضافته هنا.',
  'empty.section': 'لا يوجد محتوى منشور في هذا القسم بعد.',

  // الرئيسية
  'home.heroKicker': 'منصة اكتشاف لا مشاهدة',
  'home.heroTitle': 'اكتشف أفلامك القادمة',
  'home.heroBody': 'معلومات منظّمة ومراجعات تحريرية أصلية، مع روابط لمشاهدة رسمية فقط عند توفرها.',
  'home.heroCtaMovies': 'تصفّح الأفلام',
  'home.heroCtaGenres': 'تصفّح التصنيفات',
  'home.latest': 'أحدث الإضافات',
  'home.latestSub': 'آخر ما أُضيف إلى المكتبة',
  'home.featured': 'أفلام مميزة',
  'home.featuredSub': 'اختيارات المحرر لهذا الشهر',
  'home.series': 'المسلسلات',
  'home.seriesSub': 'أعمال متعددة الحلقات بموسم أو أكثر',
  'home.byGenre': 'أفلام حسب النوع',
  'home.byGenreSub': 'ابدأ من المزاج الذي تبحث عنه',
  'home.recommendations': 'ترشيحات المحرر',
  'home.recommendationsSub': 'قوائم مجمّعة بعناية لتناسب وقتك',
  'home.popular': 'الأكثر مشاهدة داخل الموقع',
  'home.popularDisabled':
    'هذا القسم يظهر فقط عند توفّر إحصاءات مشاهدة حقيقية موثّقة. لا نعرض أرقامًا مختلقة.',
  'home.latestReviews': 'أحدث المراجعات',
  'home.latestReviewsSub': 'قراءات نقدية من فريق التحرير',
  'home.trailers': 'تريلرات رسمية',
  'home.trailersSub': 'مقاطع رسمية مسموح بتضمينها فقط',
  'home.trailersEmpty': 'لا توجد تريلرات رسمية موثّقة مضمّنة بعد. لن نضمّن أي مقطع غير رسمي.',
  'home.browseAll': 'تصفّح الكل',

  // الأفلام والمسلسلات
  'movies.title': 'الأفلام',
  'movies.intro': 'كل الأفلام المنشورة في المكتبة، مع فلاتر وترتيب يعملان داخل متصفحك.',
  'series.title': 'المسلسلات',
  'series.intro': 'كل المسلسلات المنشورة، مع بيانات المواسم عند توفرها.',
  'series.seasons': 'المواسم',
  'series.season': 'الموسم {n}',
  'series.episodesCount': '{n} حلقة',
  'series.episodes': 'الحلقات',
  'series.status': 'الحالة',
  'series.noSeasons': 'لم تُضف بيانات المواسم لهذا المسلسل بعد.',

  // صفحة العمل
  'work.originalTitle': 'الاسم الأصلي',
  'work.arabicTitle': 'الاسم بالعربية',
  'work.englishTitle': 'الاسم بالإنجليزية',
  'work.releaseYear': 'سنة الإصدار',
  'work.releaseDateEG': 'تاريخ العرض في مصر',
  'work.originalLanguage': 'اللغة الأصلية',
  'work.subtitles': 'الترجمة',
  'work.posterDesignBadge': 'غلاف تصميمي أصلي',
  'work.posterDesignNote': 'الغلاف المعروض هنا تصميم أصلي من إنتاج أكاشا سينما يحمل اسم العمل — وليس البوستر الرسمي. نستخدمه حتى لا تُعرض صورة عمل آخر أو صورة غير موثّقة مكان بوستر هذا المسلسل.',
  'work.subtitlesBadge': 'مترجم للعربية',
  'work.writers': 'المؤلفون',
  'work.synopsis': 'القصة',
  'work.details': 'تفاصيل الفيلم',
  'work.ageRating': 'التصنيف العمري',
  'work.runtime': 'مدة العرض',
  'work.runtimeMinutes': '{n} دقيقة',
  'work.runtimeTBA': 'المدة الرسمية لم تُعلن بعد',
  'work.country': 'بلد الإنتاج',
  'work.language': 'اللغة',
  'work.genres': 'التصنيفات',
  'work.director': 'الإخراج',
  'work.cast': 'طاقم التمثيل',
  'work.crewTitle': 'الإخراج والتأليف والبطولة',
  'work.castNote': 'تُعرض هنا الأعمال المسجّلة داخل أكاشا سينما فقط.',
  'work.trailer': 'التريلر الرسمي',
  'work.trailerNote': 'مقطع رسمي من القناة الناشرة، مضمّن عبر مزوّد يحترم الخصوصية.',
  'work.trailerPending':
    'سيتم عرض التريلر الرسمي هنا فور إضافته من القناة الناشرة الرسمية المسموح بتضمينها. التزامًا بسياسة الموقع، لا يتم تضمين أي مقاطع غير مصرح بها أو من مصادر غير رسمية.',
  'work.watch': 'أين تشاهد العمل رسميًا',
  'work.watchNote':
    'روابط لخدمات رسمية موثّقة فقط. أكاشا سينما لا تستضيف أو توفر أي محتوى مشاهدة أو تحميل.',
  'work.watchEmpty': 'لا توجد روابط مشاهدة رسمية موثّقة لهذا العمل حتى الآن.',
  'work.review': 'المراجعة التحريرية',
  'work.reviewEmpty':
    'لا توجد مراجعة تحريرية لهذا العمل بعد. لا نكتب مراجعة صورية أو مولّدة تلقائيًا — المراجعات تُكتب يدويًا فقط.',
  'work.notes': 'ملاحظات تحريرية',
  'work.similar': 'أعمال مشابهة',
  'work.similarSub': 'مبنية على تقاطع التصنيفات مع أعمال منشورة في الموقع',
  'work.share': 'مشاركة',
  'work.shareCopy': 'نسخ الرابط',
  'work.shareCopied': 'تم نسخ الرابط ✓',
  'work.shareX': 'مشاركة على X',
  'work.shareWhatsapp': 'واتساب',
  'work.favoriteAdd': 'أضف إلى المفضلة',
  'work.favoriteRemove': 'إزالة من المفضلة',
  'work.crumbsHome': 'الرئيسية',
  'work.missingInfo': 'المعلومات غير الموثّقة لا تُعرض هنا؛ ما تراه هو ما تم التحقق منه فقط.',
  'work.alsoSeries': 'مسلسلات ذات صلة',
  'work.langSwitchEn': 'English',
  'work.langSwitchAr': 'العربية',

  // المراجعات والترشيحات
  'reviews.title': 'المراجعات',
  'reviews.intro': 'مراجعات أصلية كتبها فريق التحرير. كل ما هنا رأي تحريري موضّح بوسم دائم.',
  'reviews.ratingLabel': 'تقييم المحرر',
  'reviews.verdict': 'الخلاصة',
  'reviews.relatedWork': 'العمل المراجَع',
  'reviews.byAuthor': 'بواسطة {author}',
  'lists.title': 'ترشيحات المحرر',
  'lists.intro': 'قوائم مختارة بعناية، من إعداد فريق التحرير ولتناسب وقتك.',
  'lists.items': 'أعمال هذه القائمة',
  'lists.itemsCount': '{n} عمل',

  // الأشخاص
  'person.director': 'مخرج',
  'person.actor': 'ممثل',
  'person.writer': 'مؤلف',
  'person.about': 'نبذة',
  'person.works': 'أعماله في أكاشا سينما',
  'person.worksNote':
    'نعرض فقط الأعمال المسجّلة داخل الموقع، وليست القائمة الكاملة لأعمال الشخص.',
  'person.empty': 'لا توجد أعمال منشورة لهذا الشخص داخل الموقع بعد.',

  // التصنيفات
  'genres.title': 'التصنيفات',
  'genres.intro': 'التصنيفات التي تحتوي محتوى منشورًا فعليًا فقط — لا تصنيفات فارغة.',
  'genres.moviesIn': 'أفلام في تصنيف',
  'genres.seriesIn': 'مسلسلات في تصنيف',
  'genres.count': '{n} عمل',

  // المفضلة
  'favorites.title': 'المفضلة',
  'favorites.intro': 'قائمة محفوظة على هذا الجهاز/المتصفح فقط.',
  'favorites.localNotice':
    'تنبيه مهم: المفضلة محفوظة محليًا في متصفحك الحالي، ولن تنتقل بين الأجهزة أو المتصفحات، وستُفقد إذا مسحت بيانات المتصفح.',
  'favorites.clear': 'إفراغ القائمة',
  'favorites.export': 'نسخ القائمة كنص',

  // أقسام عامة

  'footer.about': 'عن المنصة',
  'footer.legal': 'قانوني',
  'footer.browse': 'تصفّح',
  'footer.follow': 'تابعنا',
  'footer.rights': 'جميع الحقوق محفوظة.',
  'footer.noHosting': 'أكاشا سينما منصة معلومات واكتشاف فقط: لا نستضيف أفلامًا أو حلقات، ولا نوفر روابط تحميل أو مشاهدة غير رسمية.',
  'footer.disclaimer':
    'المحتوى التحريري يعبّر عن رأي فريق أكاشا سينما ولا يمثل جهة إنتاج أو توزيع. كل أسماء وعلامات الأعمال تخص أصحابها.',

  // 404
  'notFound.title': 'لم نجد هذه الصفحة',
  'notFound.body':
    'ربما تغيّر الرابط أو حُذف المحتوى. لا مشكلة — إليك طريق العودة:',
  'notFound.searchCta': 'ابحث عن عمل بالاسم',
  'notFound.homeCta': 'العودة للرئيسية',
};

const EN = {
  'site.skipToContent': 'Skip to main content',
  'site.editorialNote': 'Editorial Opinion',
  'site.editorialNoteLong':
    'This content reflects the editorial opinion of the Akasha Cinema team, not an official rating or objective fact.',
  'nav.home': 'Home',
  'nav.movies': 'Movies',
  'nav.series': 'Series',
  'nav.genres': 'Genres',
  'nav.reviews': 'Reviews',
  'nav.lists': 'Lists',
  'nav.favorites': 'Favorites',
  'work.originalTitle': 'Original Title',
  'work.arabicTitle': 'Arabic Title',
  'work.englishTitle': 'English Title',
  'work.releaseYear': 'Release Year',
  'work.releaseDateEG': 'Release Date in Egypt',
  'work.originalLanguage': 'Original Language',
  'work.subtitles': 'Subtitles',
  'work.posterDesignBadge': 'Original design cover',
  'work.posterDesignNote': 'The cover shown is an original design produced by Akasha Cinema with the series title on it — not the official poster.',
  'work.subtitlesBadge': 'Arabic Subtitles Available',
  'work.writers': 'Writers',
  'work.synopsis': 'Synopsis',
  'work.details': 'Movie Details',
  'work.ageRating': 'Age Rating',
  'work.runtime': 'Runtime',
  'work.runtimeMinutes': '{n} min',
  'work.runtimeTBA': 'Official runtime not announced yet',
  'work.country': 'Country',
  'work.language': 'Language',
  'work.genres': 'Genres',
  'work.director': 'Director',
  'work.cast': 'Cast',
  'work.crewTitle': 'Direction, Writing & Cast',
  'work.castNote': 'Only works registered within Akasha Cinema are listed here.',
  'work.trailer': 'Official Trailer',
  'work.trailerNote': 'Official clip from the publishing channel, embedded via privacy-enhanced mode.',
  'work.trailerPending':
    'The official trailer will be displayed here once an authorized embeddable link from the official publisher is added. In compliance with site policy, unauthorized or unlicensed third-party streams are never embedded.',
  'work.watch': 'Where to Watch Officially',
  'work.watchNote':
    'Links to verified official platforms only. Akasha Cinema does not host or provide any streaming or download content.',
  'work.watchEmpty': 'No verified official streaming links are available for this title yet.',
  'work.review': 'Editorial Review',
  'work.reviewEmpty':
    'No editorial review has been published for this title yet. Reviews are written manually by our editorial team only.',
  'work.notes': 'Editorial Notes',
  'work.similar': 'Similar Titles',
  'work.similarSub': 'Based on genre overlap with published titles in our catalog',
  'work.share': 'Share',
  'work.shareCopy': 'Copy Link',
  'work.shareCopied': 'Link Copied ✓',
  'work.shareX': 'Share on X',
  'work.shareWhatsapp': 'WhatsApp',
  'work.favoriteAdd': 'Add to Favorites',
  'work.favoriteRemove': 'Remove from Favorites',
  'work.crumbsHome': 'Home',
  'work.missingInfo': 'Unverified information is omitted; only verified details are displayed here.',
  'work.langSwitchEn': 'English',
  'work.langSwitchAr': 'العربية',
  'reviews.ratingLabel': 'Editor Rating',
  'reviews.byAuthor': 'By {author}',
  'person.director': 'Director',
  'person.actor': 'Actor',
  'person.writer': 'Writer',
};

/** دالة الترجمة المركزية */
export function t(key, vars, locale = 'ar') {
  const dict = locale === 'en' ? EN : AR;
  let out = dict[key] ?? AR[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

/** تجميع أرقام عربية-هندية اختياريًا — نستخدم الأرقام اللاتينية للوضوح والتوافق */
export const num = (n) => new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(n);

export const COPY = AR;
export const COPY_EN = EN;
