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
  `✅ Sitemap mirror: /sitemap-all.xml written as a byte-identical copy of /sitemap.xml (${sitemapBytes.toLocaleString()} bytes) for a fresh Search Console submission.`
);
