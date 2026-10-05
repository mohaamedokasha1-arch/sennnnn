#!/usr/bin/env node
/**
 * SEO/export audit for the deployable static site.
 * Runs after `next build` and `prepare-static-export.mjs`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import siteConfig from '../site.config.mjs';
import {
  getMovies,
  getSeries,
  getPeople,
  getReviews,
  getLists,
  getWorks,
  genresWithContent,
} from '../lib/content.mjs';

const OUT = path.resolve('out');
const BASE = siteConfig.url.replace(/\/$/, '');
assert.ok(fs.existsSync(OUT), 'Missing out/ directory — run npm run build first.');

function exportedFile(route) {
  const pathname = route.startsWith('http') ? new URL(route).pathname : route;
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  const target = path.join(OUT, relative);
  const candidates = pathname.endsWith('/') || !path.extname(pathname)
    ? [path.join(target, 'index.html'), `${target}.html`, target]
    : [target];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
}

function readRoute(route) {
  const file = exportedFile(route);
  assert.ok(file, `Missing exported page/file for ${route}`);
  return fs.readFileSync(file, 'utf8');
}

function canonicalOf(html) {
  return html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null;
}

function metaContent(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\s+name="${escaped}"\\s+content="([^"]*)"`, 'i'))?.[1] ?? null;
}

function alternateLinks(html) {
  return [...html.matchAll(/<link\s+rel="alternate"\s+hrefLang="([^"]+)"\s+href="([^"]+)"/gi)]
    .map((match) => [match[1], match[2]]);
}

function expectedUrl(route) {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${BASE}${normalized.endsWith('/') ? normalized : `${normalized}/`}`;
}

const movies = getMovies();
const series = getSeries();
const people = getPeople().filter((person) => person.works.length > 0);
const reviews = getReviews();
const lists = getLists();
const genres = genresWithContent();

/* ---- Sitemap integrity: canonical URLs only, no fake lastmod ---- */
const sitemap = readRoute('/sitemap.xml');
assert.ok(Buffer.byteLength(sitemap, 'utf8') <= 50 * 1024 * 1024, 'Sitemap exceeds the 50 MiB limit.');
assert.match(
  sitemap,
  /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/i,
  'Sitemap must use the standard XML declaration and sitemap.org urlset namespace.'
);
assert.match(sitemap, /<\/urlset>\s*$/, 'Sitemap must close its urlset root cleanly.');
assert.doesNotMatch(sitemap, /<!DOCTYPE|<!ENTITY/i, 'Sitemap must not contain a DTD or entity declarations.');
const sitemapEntryBlocks = [...sitemap.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)];
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(sitemapUrls.length > 0, 'Sitemap must contain at least one URL.');
assert.ok(sitemapUrls.length <= 50_000, 'Sitemap exceeds the 50,000 URL limit.');
assert.equal(sitemapEntryBlocks.length, sitemapUrls.length, 'Each sitemap <url> must have exactly one <loc>.');
assert.equal((sitemap.match(/<loc\b/gi) ?? []).length, sitemapUrls.length, 'Sitemap contains a <loc> outside a complete URL entry.');
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Sitemap contains duplicate URLs.');
assert.doesNotMatch(sitemap, /<lastmod>/i, 'Sitemap must not contain generated or unverified lastmod values.');
assert.doesNotMatch(sitemap, /\/(?:search|favorites|404)(?:\/|\.html|$)/i, 'Sitemap contains a functional/error route.');
assert.ok(
  sitemapUrls.every((url) => !url.includes('__no-content__') && !url.includes('?')),
  'Sitemap contains a placeholder or parameterized URL.'
);

const expectedSitemap = new Set([
  '/',
  ...(movies.length ? ['/movies/'] : []),
  ...(series.length ? ['/series/'] : []),
  ...(genres.length ? ['/genres/'] : []),
  ...(people.length ? ['/people/'] : []),
  ...(reviews.length ? ['/reviews/'] : []),
  ...(lists.length ? ['/lists/'] : []),
  '/about/', '/contact/', '/privacy/', '/cookies/', '/terms/', '/ip-rights/',
  ...movies.map((work) => work.url),
  ...movies.filter((work) => work.synopsisEn).map((work) => `/en${work.url}`),
  ...series.map((work) => work.url),
  ...genres.map((genre) => genre.url),
  ...reviews.map((review) => review.url),
  ...lists.map((list) => list.url),
  ...people.map((person) => person.url),
]);
const actualSitemapPaths = new Set(sitemapUrls.map((url) => new URL(url).pathname));
assert.deepEqual(
  [...actualSitemapPaths].sort(),
  [...expectedSitemap].sort(),
  'Sitemap entries do not match published/indexable content.'
);
for (const url of sitemapUrls) {
  assert.ok(url.startsWith(`${BASE}/`), `Sitemap URL uses the wrong host: ${url}`);
  assert.equal(new URL(url).protocol, 'https:', `Sitemap URL is not HTTPS: ${url}`);
  const html = readRoute(url);
  assert.equal(canonicalOf(html), url, `Sitemap URL is not self-canonical: ${url}`);
  assert.ok(/<title>\s*[^<\s][^<]*<\/title>/i.test(html), `Missing or empty title: ${url}`);
  assert.ok(metaContent(html, 'description')?.trim(), `Missing meta description: ${url}`);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `Expected exactly one H1: ${url}`);
  assert.doesNotMatch(metaContent(html, 'robots') ?? '', /noindex/i, `Noindex page appears in sitemap: ${url}`);
  // وسم إثبات الملكية لدى Google Search Console (يُقرأ من site.config.mjs ويجب أن يكون في <head>)
  if (siteConfig.googleSiteVerification) {
    assert.equal(
      metaContent(html, 'google-site-verification'),
      siteConfig.googleSiteVerification,
      `Missing or mismatched google-site-verification meta tag: ${url}`
    );
  }
}

/* ---- Canonical and reciprocal hreflang for all bilingual movie pairs ---- */
for (const work of movies) {
  const arUrl = expectedUrl(work.url);
  const enUrl = expectedUrl(`/en${work.url}`);
  const expectedAlternates = new Map([
    ['ar', arUrl],
    ['en', enUrl],
    ['x-default', arUrl],
  ]);

  // Keep both old singular and current plural paths working, while consolidating SEO signals.
  for (const [route, canonical] of [
    [`/movie/${work.slug}/`, arUrl],
    [`/movies/${work.slug}/`, arUrl],
    [`/en/movie/${work.slug}/`, enUrl],
    [`/en/movies/${work.slug}/`, enUrl],
  ]) {
    const html = readRoute(route);
    assert.equal(canonicalOf(html), canonical, `Wrong canonical on legacy/current alias ${route}`);
    assert.ok(html.includes('<h1'), `Missing visible H1 on work detail ${route}`);
  }

  const arabicPage = readRoute(work.url);
  const englishPage = readRoute(`/en${work.url}`);
  if (work.synopsisEn) {
    for (const [route, html] of [[work.url, arabicPage], [`/en${work.url}`, englishPage]]) {
      assert.deepEqual(
        new Map(alternateLinks(html)),
        expectedAlternates,
        `hreflang is missing, incorrect, or not reciprocal on ${route}`
      );
    }
    assert.match(englishPage, /lang="en"/i, `English content lacks a local lang=en declaration: ${work.slug}`);
    assert.match(englishPage, /dir="ltr"/i, `English content lacks a local dir=ltr declaration: ${work.slug}`);
  } else {
    assert.deepEqual(alternateLinks(arabicPage), [], `Do not invent an English hreflang for ${work.slug}.`);
    assert.match(metaContent(englishPage, 'robots') ?? '', /noindex/i, `Incomplete English translation must be noindex: ${work.slug}`);
  }
}

/* ---- robots/noindex and the custom 404 output ---- */
const robots = readRoute('/robots.txt');
assert.match(robots, /User-agent:\s*\*/i, 'robots.txt should apply to all crawlers.');
assert.match(robots, /^Allow:\s*\/\s*$/im, 'robots.txt should allow public crawling.');
const robotsSitemaps = robots.split(/\r?\n/).filter((line) => /^\s*Sitemap\s*:/i.test(line));
assert.equal(robotsSitemaps.length, 1, 'robots.txt should contain exactly one Sitemap directive.');
assert.equal(
  robotsSitemaps[0].replace(/^\s*Sitemap\s*:\s*/i, '').trim(),
  `${BASE}/sitemap.xml`,
  'robots.txt should point to the correct canonical sitemap URL.'
);
assert.doesNotMatch(robots, /^Disallow:\s*\S/im, 'robots.txt must not block Google from sitemap pages or page-level noindex directives.');
assert.doesNotMatch(robots, /^Host\s*:/im, 'Do not emit the unsupported Host directive for Google crawlers.');

const noIndexRoutes = ['/search/', '/favorites/'];
if (!reviews.length) noIndexRoutes.push('/reviews/');
if (!lists.length) noIndexRoutes.push('/lists/');
for (const route of noIndexRoutes) {
  const html = readRoute(route);
  assert.match(metaContent(html, 'robots') ?? '', /noindex/i, `${route} must be noindex.`);
  assert.ok(!actualSitemapPaths.has(route), `${route} must not be in sitemap.`);
}

assert.ok(fs.existsSync(path.join(OUT, '404.html')), 'Custom 404.html is missing.');
assert.ok(!fs.existsSync(path.join(OUT, '404', 'index.html')), 'A /404/ path would be served as a 200 page.');
for (const route of ['/reviews/__no-content__/', '/lists/__no-content__/']) {
  assert.equal(exportedFile(route), null, `Synthetic empty route remains in export: ${route}`);
}
const notFound = readRoute('/404.html');
assert.match(metaContent(notFound, 'robots') ?? '', /noindex/i, 'The custom 404 must be noindex.');
assert.equal(canonicalOf(notFound), null, 'A 404 document must not inherit the homepage canonical.');
assert.equal((notFound.match(/<h1\b/gi) ?? []).length, 1, '404 page should have one H1.');

/* ---- Structured data is valid JSON and has no invented exact release dates/ratings ---- */
let schemaCount = 0;
for (const file of walkHtml(OUT)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, json] of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    const data = JSON.parse(json);
    const records = Array.isArray(data) ? data : [data];
    for (const record of records) {
      schemaCount++;
      assert.ok(record['@context'] === 'https://schema.org', `Unexpected JSON-LD context in ${path.relative(OUT, file)}`);
      assert.doesNotMatch(JSON.stringify(record), /aggregateRating/, 'Aggregate ratings are not supported by real user data.');
      if (record.datePublished) {
        assert.match(String(record.datePublished), /^\d{4}-\d{2}-\d{2}$/, 'Do not publish a year-only value as a precise datePublished.');
      }
    }
  }
}
assert.ok(schemaCount > 0, 'Expected JSON-LD on the static export.');

/* ---- Local poster assets and image byte budget ---- */
let posterCount = 0;
let posterBytes = 0;
for (const work of getWorks('all')) {
  if (!work.hasPoster) continue;
  const relative = work.poster.replace(/^\/+/, '');
  const file = path.join(OUT, relative);
  assert.ok(fs.existsSync(file), `Missing poster asset: ${work.slug} → ${work.poster}`);
  const size = fs.statSync(file).size;
  assert.ok(size <= 200 * 1024, `Poster exceeds 200 KiB: ${work.slug} (${size} bytes)`);
  posterCount++;
  posterBytes += size;
}

/* ---- Every same-origin anchor and local img source resolves in the export ---- */
const brokenLinks = [];
const brokenImages = [];
const htmlFiles = walkHtml(OUT);
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    const target = localTarget(file, href);
    if (target && !target.exists) brokenLinks.push(`${path.relative(OUT, file)} → ${href}`);
  }
  for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const target = localTarget(file, src);
    if (target && !target.exists) brokenImages.push(`${path.relative(OUT, file)} → ${src}`);
  }
}
assert.deepEqual(brokenLinks, [], `Broken same-origin links:\n${brokenLinks.join('\n')}`);
assert.deepEqual(brokenImages, [], `Broken local image URLs:\n${brokenImages.join('\n')}`);

console.log(
  `✅ SEO/export audit: ${sitemapUrls.length} canonical sitemap URLs; ${movies.length} reciprocal ar/en movie pairs; ` +
    `${noIndexRoutes.length} noindex utility/empty pages excluded; ${posterCount} local posters ≤200 KiB; ` +
    `${schemaCount} JSON-LD objects parsed; ${htmlFiles.length} HTML documents checked for internal links/images.`
);

function walkHtml(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, result);
    else if (entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}

function localTarget(currentFile, href) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return null;
  let url;
  try {
    const currentRelative = `/${path.relative(OUT, currentFile).replaceAll(path.sep, '/')}`;
    url = new URL(href, `${BASE}${currentRelative}`);
  } catch {
    return { exists: false };
  }
  if (url.origin !== BASE) return null;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { exists: false };
  }
  const relative = pathname.replace(/^\/+/, '');
  const target = path.resolve(OUT, relative);
  if (target !== OUT && !target.startsWith(`${OUT}${path.sep}`)) return { exists: false };

  const candidates = pathname.endsWith('/') || !path.extname(pathname)
    ? [path.join(target, 'index.html'), `${target}.html`, target]
    : [target];
  return { exists: candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) };
}
