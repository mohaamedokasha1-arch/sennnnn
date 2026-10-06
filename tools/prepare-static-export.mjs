#!/usr/bin/env node
/**
 * Remove Next's build-only empty dynamic placeholders from the deployable export.
 * Next requires a generated param for an output: 'export' dynamic route; the sentinel
 * pages call notFound(), but a static file would otherwise be served with HTTP 200.
 * This step removes only those known synthetic pages when their collections are empty.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getLists, getReviews, getSeries } from '../lib/content.mjs';

const out = path.resolve('out');
if (!fs.existsSync(out)) throw new Error('Missing out/ directory after next build.');

const optionalCollections = [
  { route: 'reviews', count: getReviews().length },
  { route: 'lists', count: getLists().length },
  { route: 'series', count: getSeries().length },
];

const removed = [];
for (const { route, count } of optionalCollections) {
  if (count > 0) continue;
  const sentinel = path.join(out, route, '__no-content__');
  if (fs.existsSync(sentinel)) {
    fs.rmSync(sentinel, { recursive: true, force: true });
    removed.push(`/${route}/__no-content__/`);
  }
}

/**
 * Next's static export inherits the Arabic root <html> element inside nested layouts.
 * Correct the built HTML itself (not only a post-hydration effect) for crawlable /en pages.
 */
function listHtmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

const englishHtmlFiles = listHtmlFiles(path.join(out, 'en'));
let localizedEnglishDocuments = 0;
for (const file of englishHtmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];
  if (!htmlTag) throw new Error(`Missing root <html> element in English export: ${path.relative(out, file)}`);
  const localizedTag = htmlTag
    .replace(/\s(?:lang|dir)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/>$/, ' lang="en" dir="ltr">');
  const nextHtml = html.replace(htmlTag, localizedTag);
  if (nextHtml !== html) {
    fs.writeFileSync(file, nextHtml);
    localizedEnglishDocuments++;
  }
  if (!/<html\b[^>]*\blang="en"[^>]*\bdir="ltr"[^>]*>/i.test(nextHtml)) {
    throw new Error(`English export has the wrong document language/direction: ${path.relative(out, file)}`);
  }
}

// Keep only the conventional 404.html; a /404/index.html would look like a real 200 page.
const notFoundAlias = path.join(out, '404');
if (fs.existsSync(notFoundAlias) && fs.statSync(notFoundAlias).isDirectory()) {
  fs.rmSync(notFoundAlias, { recursive: true, force: true });
  removed.push('/404/');
}

/*
 * Publish a byte-identical copy of the canonical sitemap at /sitemap-all.xml.
 * Why: Google Search Console can keep a stale "couldn't read" result for a sitemap URL
 * it fetched while an older deployment was broken, and re-adding the same URL often
 * keeps that failed state. The copy is generated from out/sitemap.xml on every build
 * (never hand-written, so it can never drift), which gives Search Console a clean,
 * never-fetched URL to read without touching /sitemap.xml, robots.txt, or any page.
 */
const sitemapFile = path.join(out, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) throw new Error('Missing out/sitemap.xml after next build.');
const sitemapMirror = path.join(out, 'sitemap-all.xml');
fs.copyFileSync(sitemapFile, sitemapMirror);
const sitemapBytes = fs.statSync(sitemapFile).size;

console.log(
  removed.length
    ? `✅ Static export cleanup: removed HTTP-200 placeholders ${removed.join(', ')}; retained /404.html as the Vercel 404 document.`
    : '✅ Static export cleanup: no empty placeholder routes to remove.'
);
console.log(
  `✅ Document language: ${localizedEnglishDocuments}/${englishHtmlFiles.length} English HTML documents carry lang="en" dir="ltr" in the exported source.`
);
console.log(
  `✅ Sitemap mirror: /sitemap-all.xml written as a byte-identical copy of /sitemap.xml (${sitemapBytes.toLocaleString()} bytes) for a fresh Search Console submission.`
);
