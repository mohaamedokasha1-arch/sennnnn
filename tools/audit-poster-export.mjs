import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getSeries } from '../lib/content.mjs';

const OUT = path.resolve('out');
const readExport = (relativePath) => fs.readFileSync(path.join(OUT, relativePath), 'utf8');
const series = getSeries();

assert.ok(series.length > 0, 'No published series were found for the export audit.');

const home = readExport('index.html');
assert.match(home, /poster-fallback-status/, 'The homepage does not render labeled poster fallbacks for its series cards.');
assert.match(home, /صورة مؤقتة/, 'The homepage is missing the visible temporary-image disclosure.');

const seriesIndex = readExport('series/index.html');
assert.match(seriesIndex, /poster-fallback-status/, 'The published series listing does not render labeled poster fallbacks.');
assert.match(seriesIndex, /صورة مؤقتة/, 'The series listing is missing the visible temporary-image disclosure.');

const searchIndex = JSON.parse(readExport('search-index.json'));
for (const work of series) {
  const detail = readExport(path.join('series', work.slug, 'index.html'));
  assert.ok(detail.includes(work.title), `${work.slug}: title missing from its exported details page.`);
  assert.match(detail, /poster-fallback-status/, `${work.slug}: no visible fallback in the exported details page.`);
  assert.match(detail, /صورة مؤقتة/, `${work.slug}: temporary status missing from the exported details page.`);
  assert.ok(!detail.includes(`/posters/${work.slug}.jpg`), `${work.slug}: unverified artwork is still linked from its detail page.`);

  const indexed = searchIndex.works.find((item) => item.id === `series:${work.slug}`);
  assert.ok(indexed, `${work.slug}: missing from the deployed search index.`);
  if (work.posterTemporary) {
    assert.equal(indexed.poster, null, `${work.slug}: unverified artwork leaked into the search index.`);
  }
}

console.log(`✅ Static export audit passed: homepage, ${series.length} series detail pages, series listing, and search index.`);
