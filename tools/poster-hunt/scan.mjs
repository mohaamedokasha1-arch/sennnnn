#!/usr/bin/env node
/** افحص كل الصور الجديدة في image-search/ وأبْلِغ عن النسبة والأبعاد لاختيار البوستر العمودي. */
import fs from 'node:fs';
import path from 'node:path';
import { dims } from '../img-dims.mjs';

const dir = path.resolve('image-search');
const filter = process.argv[2] ?? '';
const now = Date.now() - 1000 * 60 * 60 * 8;
const rows = [];
for (const f of fs.readdirSync(dir)) {
  if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
  if (filter && !f.includes(filter)) continue;
  const full = path.join(dir, f);
  const st = fs.statSync(full);
  const d = dims(full);
  const ratio = d ? d.h / d.w : 0;
  const verdict = !d ? 'BAD' : ratio >= 1.3 && ratio <= 1.62 && d.w >= 380 ? 'POSTER' : ratio > 1.2 ? 'near' : 'landscape/square';
  rows.push({ f, w: d?.w ?? 0, h: d?.h ?? 0, kb: Math.round(st.size / 1024), ratio: +ratio.toFixed(2), verdict, mtime: st.mtimeMs });
}
rows.sort((a, b) => (a.f < b.f ? -1 : 1));
for (const r of rows) console.log(`${r.verdict.padEnd(17)} ${String(r.w).padStart(4)}x${String(r.h).padEnd(4)} r=${String(r.ratio).padEnd(4)} ${String(r.kb).padStart(4)}KB  ${r.f}`);
const posterLike = rows.filter((r) => r.verdict === 'POSTER').length;
console.log(`\n# ${rows.length} ملفًا مطابقًا | ${posterLike} بشكل بوستر عمودي`);
