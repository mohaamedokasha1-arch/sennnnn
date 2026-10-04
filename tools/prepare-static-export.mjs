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

console.log(
  removed.length
    ? `✅ Static export cleanup: removed HTTP-200 placeholders ${removed.join(', ')}; retained /404.html as the Vercel 404 document.`
    : '✅ Static export cleanup: no empty placeholder routes to remove.'
);
