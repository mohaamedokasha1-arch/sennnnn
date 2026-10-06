/**
 * ============================================================================
 *  أدوات SEO — عناوين/أوصاف فريدة، Canonical، Open Graph، وSchema.org
 * ============================================================================
 *  قاعدة صارمة: لا نُدرج أي بيانات Schema غير موثّقة، ولا أي تقييمات مجمّعة
 *  (aggregateRating) لأنها تتطلب تقييمات حقيقية غير متوفرة في هذه النسخة.
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';
import { brandName } from './brand.mjs';
import { genreLabel, countryLabel, typeLabel } from './i18n.mjs';

export const abs = (p = '/') => {
  const base = siteConfig.url.replace(/\/$/, '');
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${base}${path.endsWith('/') || path.includes('.') ? path : `${path}/`}`;
};

const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 150;
const DESCRIPTION_MAX = 160;

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function titleContext(path, locale) {
  const isEn = locale === 'en';
  const pathname = path.replace(/^\/en(?=\/)/, '') || '/';
  if (pathname === '/') return isEn ? ['Movies, Series & Reviews', 'Stories and Cast Guides'] : ['اكتشاف الأفلام والمسلسلات', 'قصص ومراجعات وطاقم العمل'];
  if (pathname === '/movies/') return isEn ? ['Film Stories, Cast & Reviews', 'Browse New and Classic Movies'] : ['قصص وأبطال ومراجعات الأفلام', 'تصفّح الأفلام المنشورة'];
  if (pathname === '/series/') return isEn ? ['Series Stories, Cast & Reviews', 'Browse New and Classic Series'] : ['قصص المسلسلات ومعلومات الطاقم', 'تصفّح المسلسلات المنشورة'];
  if (pathname === '/genres/') return isEn ? ['Browse Movies and Series by Genre', 'Explore the Published Catalog'] : ['تصفّح الأفلام والمسلسلات حسب النوع', 'اكتشف التصنيفات المنشورة'];
  if (pathname === '/people/') return isEn ? ['Cast, Crew & Filmography Profiles', 'Explore People in Movies and Series'] : ['سير الممثلين والمخرجين وأعمالهم', 'تصفّح صفحات طاقم العمل'];
  if (pathname.startsWith('/people/')) return isEn ? ['Profile, Credits & Filmography', 'Related Movie and Series Roles'] : ['نبذة ومسيرة وأعمال مسجلة', 'تفاصيل الأدوار والصفحات المرتبطة'];
  if (pathname.startsWith('/genres/')) return isEn ? ['Genre Guide to Movies and Series', 'Browse Related Titles'] : ['دليل التصنيف للأفلام والمسلسلات', 'تصفّح الأعمال المرتبطة بالنوع'];
  if (pathname.startsWith('/movies/') || pathname.startsWith('/movie/')) return isEn ? ['Story & Cast', 'Official Trailer and Credits'] : ['القصة والطاقم', 'تفاصيل الفيلم والتريلر الرسمي'];
  if (pathname.startsWith('/series/')) return isEn ? ['Story & Cast', 'Seasons and Credits'] : ['القصة والطاقم', 'المواسم وتفاصيل المسلسل'];
  if (pathname.startsWith('/reviews/')) return isEn ? ['Editorial Review and Story Guide', 'Read Our Film and Series Review'] : ['مراجعة تحريرية وقصة العمل', 'اقرأ مراجعات الأفلام والمسلسلات'];
  if (pathname.startsWith('/lists/')) return isEn ? ['Curated Movie and Series Picks', 'Explore the Editorial Collection'] : ['ترشيحات أفلام ومسلسلات مختارة', 'تصفّح قوائم فريق التحرير'];
  if (pathname === '/about/') return isEn ? ['Movie and Series Discovery Platform', 'Editorial Discovery Guide'] : ['دليل اكتشاف الأفلام والمسلسلات', 'منصة معلومات ومراجعات تحريرية'];
  if (pathname === '/contact/') return isEn ? ['Support & Rights Requests', 'How to Reach the Editorial Team'] : ['تواصل ودعم وطلبات حقوق الملكية', 'طرق الاتصال بفريق التحرير'];
  if (pathname === '/privacy/') return isEn ? ['Privacy, Data & Visitor Information', 'How the Site Handles Your Data'] : ['الخصوصية وبيانات زوار الموقع', 'كيف نحمي معلومات المستخدمين'];
  if (pathname === '/cookies/') return isEn ? ['Cookie Policy and Local Preferences', 'Browser Storage and Privacy'] : ['سياسة الكوكيز والتخزين المحلي', 'تفضيلات المتصفح والخصوصية'];
  if (pathname === '/terms/') return isEn ? ['Terms of Use and Content Policy', 'Rules for Using the Catalog'] : ['قواعد استخدام الموقع ومحتواه', 'شروط تصفّح مكتبة الأفلام'];
  if (pathname === '/ip-rights/') return isEn ? ['Copyright, Ownership & Removal Policy', 'Submit a Rights Request'] : ['سياسة حقوق الملكية وطلبات الإزالة', 'إجراءات التواصل وحقوق النشر'];
  if (pathname === '/search/') return isEn ? ['Search Movies, Series and Cast', 'Find Titles in the Catalog'] : ['ابحث عن الأفلام والمسلسلات وطاقمها', 'اكتشف الأعمال في المكتبة'];
  if (pathname === '/favorites/') return isEn ? ['Saved Movie and Series Favorites', 'Your Local Favorites List'] : ['قائمة الأفلام والمسلسلات المفضلة', 'أعمال محفوظة على جهازك'];
  return isEn ? ['Movie and Series Discovery Guide', 'Verified Details and Editorial Guides'] : ['دليل اكتشاف الأفلام والمسلسلات', 'معلومات موثقة ومراجعات تحريرية'];
}

function trimToLimit(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const boundary = text.lastIndexOf(' ', max);
  const end = boundary > Math.floor(max * 0.6) ? boundary : max;
  return text.slice(0, end).trimEnd();
}

/** A concise, descriptive 50–60 character title that always ends with the locale brand. */
export function seoTitle(title, locale = 'ar', path = '/') {
  const brand = brandName(locale);
  const separator = ` | ${brand}`;
  const maxPrefix = TITLE_MAX - separator.length;
  const minPrefix = TITLE_MIN - separator.length;
  const raw = cleanText(title) || (locale === 'en' ? 'Movie and Series Discovery' : 'اكتشاف الأفلام والمسلسلات');
  const brandPattern = [brandName('ar'), brandName('en')]
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const unbranded = raw.replace(new RegExp(`\\s*(?:\\||—|–|-)?\\s*(?:${brandPattern})\\s*$`, 'i'), '').trim();
  const [head = '', ...rest] = unbranded.split(/\s*[|｜]\s*/).map((part) => part.trim());
  let prefix = head || unbranded;
  const detail = rest.join(' — ').trim();
  let detailApplied = false;

  if (detail) {
    const withDetail = `${prefix} — ${detail}`;
    if (withDetail.length <= maxPrefix) {
      prefix = withDetail;
      detailApplied = true;
    }
  }

  // Very short work names often need one final word to make the title useful and
  // reach the character target; this avoids repeating a second, longer context.
  if (prefix.length < minPrefix && detailApplied) {
    const guide = locale === 'en' ? 'Guide' : 'دليل';
    if (!prefix.toLocaleLowerCase().includes(guide.toLocaleLowerCase())) prefix = `${prefix} ${guide}`;
  }

  const options = titleContext(path, locale);
  if (prefix.length < minPrefix) {
    const candidates = options.map((phrase) => `${prefix} — ${phrase}`);
    const inRange = candidates
      .filter((candidate) => candidate.length >= minPrefix && candidate.length <= maxPrefix)
      .sort((a, b) => a.length - b.length);
    const underLimit = candidates.filter((candidate) => candidate.length <= maxPrefix).sort((a, b) => b.length - a.length);
    prefix = inRange[0] ?? underLimit[0] ?? trimToLimit(candidates[0] ?? prefix, maxPrefix);
  }

  prefix = trimToLimit(prefix, maxPrefix);
  if (prefix.length < minPrefix) {
    const tail = locale === 'en' ? 'Movie and Series Guide' : 'دليل الأفلام والمسلسلات';
    prefix = trimToLimit(`${prefix} — ${tail}`, maxPrefix);
  }
  return `${prefix}${separator}`;
}

function descriptionContext(locale, path) {
  const brand = brandName(locale);
  if (locale === 'en') {
    if (path.startsWith('/people/')) {
      return ` Explore this profile's listed credits and related movie and series pages. Browse verified cast details and editorial guides across ${brand}.`;
    }
    if (path.startsWith('/movies/') || path.startsWith('/movie/') || path.startsWith('/series/')) {
      return ` Explore related titles, cast details, genres and editorial notes in the ${brand} catalog. Official platform links are shown when verified.`;
    }
    return ` Explore related titles, verified cast details, genres and editorial reviews in the ${brand} movie and series catalog. Official platform links are included when available.`;
  }
  if (path.startsWith('/people/')) {
    return ` تعرّف على الأعمال المسجلة والصفحات المرتبطة، واستكشف تفاصيل الطاقم وقصص الأفلام والمسلسلات والمراجعات التحريرية في ${brand}. روابط المنصات الرسمية تظهر عند توفرها.`;
  }
  if (path.startsWith('/movies/') || path.startsWith('/movie/') || path.startsWith('/series/')) {
    return ` اكتشف تفاصيل القصة والطاقم والتصنيفات والأعمال المشابهة ضمن مكتبة ${brand}. روابط المنصات الرسمية تظهر عند توفرها.`;
  }
  return ` تصفّح القصص والتصنيفات وطاقم العمل والمراجعات التحريرية في مكتبة ${brand}. روابط المنصات الرسمية تظهر عند توفرها.`;
}

/** Keep descriptions useful, unique and within the requested 150–160 character target. */
export function seoDescription(description, locale = 'ar', path = '/') {
  let text = cleanText(description) || cleanText(locale === 'en' ? siteConfig.descriptionEn || siteConfig.description : siteConfig.description);
  if (text.length < DESCRIPTION_MIN) text = `${text}${descriptionContext(locale, path)}`;
  if (text.length < DESCRIPTION_MIN) {
    text += locale === 'en'
      ? ' Find more verified details throughout the catalog.'
      : ' ابحث عن معلومات موثوقة إضافية في المكتبة.';
  }
  if (text.length > DESCRIPTION_MAX) {
    const target = DESCRIPTION_MAX - 1;
    const boundary = text.lastIndexOf(' ', target);
    const end = boundary >= DESCRIPTION_MIN - 1 ? boundary : target;
    text = `${text.slice(0, end).trimEnd()}…`;
  }
  return text;
}

/** Build a single metadata shape for canonical URLs, shares and JSON-LD-aware pages. */
export function buildMetadata({
  title,
  description,
  path = '/',
  canonical = null,
  languages = null,
  image = null,
  imageAlt = null,
  robots = null,
  type = 'website',
  publishedTime = null,
  modifiedTime = null,
  authors = null,
  locale = 'ar',
} = {}) {
  const desc = seoDescription(description, locale, path);
  const normalizedTitle = typeof title === 'string' && title.trim() ? seoTitle(title, locale, path) : null;
  // Use a work poster where present; otherwise choose the 1200×630 share image for this locale.
  const defaultImage = locale === 'en' ? '/og-default-en.jpg' : '/og-default.jpg';
  const ogImage = abs(image ?? defaultImage);
  const canonicalUrl = abs(canonical ?? path);
  const ogSiteName = brandName(locale);
  const ogLocale = locale === 'en' ? 'en_US' : 'ar_AR';
  const alternatesObj = { canonical: canonicalUrl };
  if (languages) {
    alternatesObj.languages = Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, abs(v)]));
  }
  return {
    ...(normalizedTitle ? { title: { absolute: normalizedTitle } } : {}),
    description: desc,
    alternates: alternatesObj,
    ...(robots ? { robots } : {}),
    openGraph: {
      title: normalizedTitle || ogSiteName,
      description: desc,
      url: canonicalUrl,
      siteName: ogSiteName,
      locale: ogLocale,
      type,
      images: [{ url: ogImage, alt: imageAlt ?? normalizedTitle ?? ogSiteName }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: normalizedTitle || ogSiteName,
      description: desc,
      images: [ogImage],
    },
    ...(authors ? { authors: [{ name: authors }] } : {}),
  };
}

/** عدم فهرسة صفحات الفلاتر المركّبة (منع المحتوى المكرر) */
export const noIndex = { index: false, follow: true, googleBot: { index: false, follow: true } };

/* ============================== Schema.org ============================== */

const SCHEMA_TYPE = { movie: 'Movie', series: 'TVSeries' };

/** بيانات منظمة لعمل — تُبنى فقط من الحقول الموجودة فعلًا */
export function workJsonLd(work, locale = 'ar') {
  const isEn = locale === 'en';
  const primaryName = isEn ? work.titleOriginal || work.title : work.title;
  const altName = isEn ? work.title : work.titleOriginal;
  const ld = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[work.kind],
    name: primaryName,
    url: abs(isEn ? `/en${work.url}` : work.url),
    description: isEn && work.synopsisEn ? work.synopsisEn : work.synopsis,
    inLanguage: work.language || (isEn ? 'en' : 'ar'),
  };
  if (altName && altName !== primaryName) ld.alternateName = altName;
  // The known release year is not a precise publication date; emit datePublished only when an exact date exists.
  if (work.releaseDateEG) ld.datePublished = String(work.releaseDateEG);
  if (work.genres.length) ld.genre = work.genres.map((g) => genreLabel(g, locale));
  if (work.country) ld.countryOfOrigin = { '@type': 'Country', name: countryLabel(work.country, locale) };
  if (work.hasPoster) ld.image = abs(work.poster);
  if (work.directorPeople?.length) {
    ld.director = work.directorPeople.map((p) => ({
      '@type': 'Person',
      name: isEn && p.nameOriginal ? p.nameOriginal : p.name,
      url: abs(p.url),
    }));
  } else if (work.directorNames?.length) {
    ld.director = work.directorNames.map((n) => ({ '@type': 'Person', name: n }));
  }
  if (work.writerPeople?.length) {
    ld.author = work.writerPeople.map((p) => ({
      '@type': 'Person',
      name: isEn && p.nameOriginal ? p.nameOriginal : p.name,
      url: abs(p.url),
    }));
  } else if (work.writerNames?.length) {
    ld.author = work.writerNames.map((n) => ({ '@type': 'Person', name: n }));
  }
  if (work.castPeople?.length) {
    ld.actor = work.castPeople.map((p) => ({
      '@type': 'Person',
      name: isEn && p.nameOriginal ? p.nameOriginal : p.name,
      url: abs(p.url),
    }));
  } else if (work.castNames?.length) {
    ld.actor = work.castNames.map((n) => ({ '@type': 'Person', name: n }));
  }
  if (work.kind === 'series' && work.seasons.length) {
    const total = work.seasons.reduce((n, s) => n + (s.episodes ?? 0), 0);
    if (total > 0) ld.numberOfEpisodes = total;
    if (work.seriesStatus === 'ongoing') ld.creativeWorkStatus = 'مستمر';
    if (work.seriesStatus === 'ended') ld.creativeWorkStatus = 'منتهٍ';
  }
  return ld;
}

/** مراجعة تحريرية — مع توضيح أنها رأي تحريري (بدون تقييمات مستخدمين) */
export function reviewJsonLd(review) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: review.title,
    url: abs(review.url),
    inLanguage: 'ar',
  };
  if (review.date) ld.datePublished = review.date;
  if (review.excerpt) ld.description = review.excerpt;
  ld.author = { '@type': 'Organization', name: `${brandName('ar')} — فريق التحرير` };
  ld.publisher = { '@type': 'Organization', name: brandName('ar'), url: abs('/') };
  if (review.work) ld.itemReviewed = workJsonLd(review.work);
  if (typeof review.rating === 'number') {
    ld.reviewRating = { '@type': 'Rating', ratingValue: review.rating, bestRating: 10, worstRating: 0 };
  }
  return ld;
}

export function listJsonLd(list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.title,
    url: abs(list.url),
    inLanguage: 'ar',
    ...(list.description ? { description: list.description } : {}),
    numberOfItems: list.items.length,
    itemListElement: list.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.work.title,
      url: abs(it.work.url),
    })),
  };
}

export function personJsonLd(person) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: abs(person.url),
    description: person.bio || undefined,
  };
  if (person.nameOriginal) ld.alternateName = person.nameOriginal;
  if (person.roles.includes('director')) ld.jobTitle = 'مخرج';
  else if (person.roles.includes('actor')) ld.jobTitle = 'ممثل';
  return ld;
}

export function breadcrumbJsonLd(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brandName('ar'),
    alternateName: brandName('en'),
    url: abs('/'),
    description: siteConfig.description,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${abs('/search/')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brandName('ar'),
    alternateName: brandName('en'),
    url: abs('/'),
    description: siteConfig.description,
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.social.length ? { sameAs: siteConfig.social.map((s) => s.url) } : {}),
  };
}

/** إسناد أنواع العمل للعرض في الواجهة */
export const workTypeLabel = (kind) => typeLabel(kind);

