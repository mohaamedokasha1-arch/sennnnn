/**
 * ============================================================================
 *  أدوات SEO — عناوين/أوصاف فريدة، Canonical، Open Graph، وSchema.org
 * ============================================================================
 *  قاعدة صارمة: لا نُدرج أي بيانات Schema غير موثّقة، ولا أي تقييمات مجمّعة
 *  (aggregateRating) لأنها تتطلب تقييمات حقيقية غير متوفرة في هذه النسخة.
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';
import { genreLabel, countryLabel, typeLabel } from './i18n.mjs';

export const abs = (p = '/') => {
  const base = siteConfig.url.replace(/\/$/, '');
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${base}${path.endsWith('/') || path.includes('.') ? path : `${path}/`}`;
};

/** بناء كائن metadata موحّد لصفحات Next */
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
  const desc = (description ?? siteConfig.description).replace(/\s+/g, ' ').trim().slice(0, 300);
  // صورة المشاركة: بوستر العمل إن وُجد، وإلا الصورة الافتراضية للموقع (مولّدة محليًا)
  const ogImage = abs(image ?? '/og-default.jpg');
  const canonicalUrl = abs(canonical ?? path);
  const ogSiteName = locale === 'en' ? siteConfig.siteNameLatin || siteConfig.siteName : siteConfig.siteName;
  const ogLocale = locale === 'en' ? 'en_US' : 'ar_AR';
  const alternatesObj = { canonical: canonicalUrl };
  if (languages) {
    alternatesObj.languages = Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, abs(v)]));
  }
  return {
    ...(typeof title === 'string' && title.trim() ? { title: title.trim() } : {}),
    description: desc,
    alternates: alternatesObj,
    ...(robots ? { robots } : {}),
    openGraph: {
      title: title ? `${title} | ${ogSiteName}` : ogSiteName,
      description: desc,
      url: canonicalUrl,
      siteName: ogSiteName,
      locale: ogLocale,
      type,
      images: [{ url: ogImage, alt: imageAlt ?? title ?? ogSiteName }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? `${title} | ${ogSiteName}` : ogSiteName,
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
  ld.author = { '@type': 'Organization', name: `${siteConfig.siteName} — فريق التحرير` };
  ld.publisher = { '@type': 'Organization', name: siteConfig.siteName, url: abs('/') };
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
    name: siteConfig.siteName,
    alternateName: siteConfig.siteNameLatin,
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
    name: siteConfig.siteName,
    alternateName: siteConfig.siteNameLatin,
    url: abs('/'),
    description: siteConfig.description,
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.social.length ? { sameAs: siteConfig.social.map((s) => s.url) } : {}),
  };
}

/** إسناد أنواع العمل للعرض في الواجهة */
export const workTypeLabel = (kind) => typeLabel(kind);

