#!/usr/bin/env node
/** Small regression suite for localized brand and metadata helpers. */
import assert from 'node:assert/strict';
import siteConfig from '../site.config.mjs';
import {
  brandConfig,
  brandDir,
  brandLogoUrl,
  brandMarkUrl,
  brandName,
  localeFromPath,
} from './brand.mjs';
import { breadcrumbJsonLd, buildMetadata, seoDescription, seoTitle } from './seo.mjs';

const titleCases = [
  ['اكتشف الأفلام والمسلسلات العربية والعالمية', 'ar', '/'],
  ['أفلام ومسلسلات دراما', 'ar', '/genres/drama/'],
  ['أحمد عماد', 'ar', '/people/ahmed-emad/'],
  ['Evil Dead Wrath (2028) | A New Chapter', 'en', '/en/movies/evil-dead-wrath/'],
  ['Digger (2026) | Story and Cast', 'en', '/en/movies/digger/'],
  ['Cookies', 'en', '/en/cookies/'],
  ['Contact', 'en', '/en/contact/'],
];

for (const [source, locale, pathname] of titleCases) {
  const title = seoTitle(source, locale, pathname);
  assert.ok(title.length >= 50 && title.length <= 60, `Bad title length ${title.length}: ${title}`);
  assert.ok(title.endsWith(`| ${brandName(locale)}`), `Wrong locale brand suffix: ${title}`);
}

const shortWorkTitle = seoTitle('Digger (2026) | Story and Cast', 'en', '/en/movies/digger/');
assert.equal((shortWorkTitle.match(/Story and Cast/g) ?? []).length, 1, 'Short work titles should not duplicate their detail text.');
assert.match(shortWorkTitle, /Story and Cast Guide/);

const paginatedTitles = [2, 3].map((page) => seoTitle(`الأفلام | صفحة ${page} من 3`, 'ar', `/movies/page/${page}/`));
assert.ok(paginatedTitles.every((title) => title.length >= 50 && title.length <= 60), 'Paginated titles must stay concise.');
assert.notEqual(paginatedTitles[0], paginatedTitles[1], 'Each pagination page needs a unique title.');
assert.ok(paginatedTitles.every((title, index) => title.includes(`صفحة ${index + 2}`)), 'Pagination titles must retain the page number.');

const descriptionCases = [
  ['اكتشف الأفلام والمسلسلات العربية والعالمية', 'ar', '/'],
  ['معلومات مرتبة عن طاقم العمل وأدواره المسجلة.', 'ar', '/people/ahmed-emad/'],
  ['Explore the story, verified cast, credits, release year and editorial notes for this movie.', 'en', '/en/movies/example/'],
  ['', 'en', '/en/about/'],
];
for (const [source, locale, pathname] of descriptionCases) {
  const description = seoDescription(source, locale, pathname);
  assert.ok(description.length >= 150 && description.length <= 160, `Bad description length ${description.length}: ${description}`);
}

assert.equal(brandName('ar'), siteConfig.nameByLocale.ar);
assert.equal(brandName('en'), 'Akasha Cenima');
assert.equal(brandName('en'), siteConfig.nameByLocale.en);
assert.equal(brandDir('ar'), 'rtl');
assert.equal(brandDir('en'), 'ltr');
assert.equal(localeFromPath('/en/movies/example/'), 'en');
assert.equal(localeFromPath('/movies/'), 'ar');
assert.equal(brandConfig.ar.shortName, 'أكاشا');
assert.equal(brandConfig.en.shortName, 'Akasha');
assert.equal(brandLogoUrl('ar'), siteConfig.logo.ar);
assert.equal(brandLogoUrl('en'), siteConfig.logo.en);
assert.equal(brandMarkUrl(), siteConfig.logo.mark);

const base = siteConfig.url.replace(/\/$/, '');
for (const [locale, expectedImage, expectedName] of [
  ['ar', '/og-default.jpg', brandName('ar')],
  ['en', '/og-default-en.jpg', brandName('en')],
]) {
  const metadata = buildMetadata({ title: 'A discovery guide', path: `/${locale}/example/`, locale });
  assert.equal(metadata.openGraph.images[0].url, `${base}${expectedImage}`);
  assert.equal(metadata.openGraph.siteName, expectedName);
  assert.equal(metadata.twitter.card, 'summary_large_image');
}

assert.deepEqual(
  buildMetadata({ title: 'المفضلة', path: '/favorites/', canonical: false }).alternates,
  {},
  'Personal utility pages can opt out of content canonicals.'
);
const crumbs = breadcrumbJsonLd([{ name: 'الرئيسية', url: '/' }, { name: 'صفحة حالية' }]);
assert.equal(crumbs.itemListElement[0].item, `${base}/`);
assert.ok(!('item' in crumbs.itemListElement[1]), 'A current breadcrumb without a live link must not invent a URL.');
assert.equal(siteConfig.url, 'https://akasha-cenima.vercel.app', 'SEO origins must match the requested canonical site.');

console.log(`✅ SEO/brand regression tests passed (${titleCases.length} title cases, ${descriptionCases.length} description cases).`);
