#!/usr/bin/env node
/**
 * أداة فحص أبعاد الصور بدون أي اعتماديات خارجية.
 * تقرأ أبعاد (عرض×ارتفاع) ملفات JPEG / PNG / WebP مباشرة من الترويسة الثنائية.
 * الاستخدام: node tools/img-dims.mjs <file...> أو node tools/img-dims.mjs --dir <dir>
 */
import fs from 'node:fs';
import path from 'node:path';

function jpegDims(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function pngDims(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function webpDims(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const form = buf.toString('ascii', 12, 16);
  if (form === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (form === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (form === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function dims(file) {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  let d = null;
  if (ext === '.png') d = pngDims(buf);
  else if (ext === '.webp') d = webpDims(buf);
  else d = jpegDims(buf);
  if (!d && buf.readUInt32BE(0) === 0x89504e47) d = pngDims(buf);
  if (!d && buf.toString('ascii', 0, 4) === 'RIFF') d = webpDims(buf);
  return d ? { ...d, bytes: buf.length } : null;
}

if (process.argv[1].endsWith('img-dims.mjs')) {
  const args = process.argv.slice(2);
  let files = [];
  if (args[0] === '--dir') {
    files = fs.readdirSync(args[1]).map((f) => path.join(args[1], f)).filter((f) => fs.statSync(f).isFile());
  } else files = args;
  for (const f of files) {
    const d = dims(f);
    const ratio = d ? (d.h / d.w).toFixed(2) : '-';
    console.log(`${f}\t${d ? `${d.w}x${d.h}` : 'UNKNOWN'}\tratio=${ratio}\t${d ? d.bytes : fs.statSync(f).size}B`);
  }
}
