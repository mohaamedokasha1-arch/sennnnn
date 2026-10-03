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
  image = null,
  robots = null,
  type = 'website',
  publishedTime = null,
  modifiedTime = null,
  authors = null,
} = {}) {
  const desc = (description ?? siteConfig.description).replace(/\s+/g, ' ').trim().slice(0, 300);
  // صورة المشاركة: بوستر العمل إن وُجد، وإلا الصورة الافتراضية للموقع (مولّدة محليًا)
  const ogImage = abs(image ?? '/og-default.jpg');
  return {
    title,
    description: desc,
    alternates: { canonical: abs(path) },
    robots: robots ?? undefined,
    openGraph: {
      title: title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName,
      description: desc,
      url: abs(path),
      siteName: siteConfig.siteName,
      locale: 'ar_AR',
      type,
      images: [{ url: ogImage, alt: title ?? siteConfig.siteName }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName,
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
export function workJsonLd(work) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[work.kind],
    name: work.title,
    url: abs(work.url),
    description: work.synopsis,
    inLanguage: 'ar',
  };
  if (work.titleOriginal) ld.alternateName = work.titleOriginal;
  if (work.year) ld.datePublished = String(work.year);
  if (work.genres.length) ld.genre = work.genres.map(genreLabel);
  if (work.country) ld.countryOfOrigin = { '@type': 'Country', name: countryLabel(work.country) };
  if (work.language) ld.inLanguage = work.language;
  if (work.hasPoster) ld.image = abs(work.poster);
  if (work.directorNames?.length) {
    ld.director = work.directorNames.map((n) => ({ '@type': 'Person', name: n }));
  }
  if (work.castNames?.length) {
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
    url: abs('/'),
    description: siteConfig.description,
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.social.length ? { sameAs: siteConfig.social.map((s) => s.url) } : {}),
  };
}

/** إسناد أنواع العمل للعرض في الواجهة */
export const workTypeLabel = (kind) => typeLabel(kind);

