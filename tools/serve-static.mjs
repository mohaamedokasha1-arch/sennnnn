#!/usr/bin/env node
/**
 * ============================================================================
 *  خادم معاينة محلي لمخرجات البناء الثابتة — tools/serve-static.mjs
 * ============================================================================
 *  الاستخدام:  npm run preview     (يبني ثم يقدّم مجلد out/)
 *              node tools/serve-static.mjs 4000 out
 *
 *  لماذا هذا الملف؟
 *    لأنه يعكس سلوك الاستضافة الحقيقية (Vercel) بدقة:
 *      - /movies  → يوجّه إلى /movies/ ثم يقدّم index.html
 *      - مسار غير موجود → صفحة 404 المخصصة (out/404.html) برمز حالة 404
 *      - أنواع محتوى صحيحة للخطوط والصور وملفات JSON/XML
 *    وهو أداة تطوير فقط (لا يعمل على Vercel ولا يؤثر في الإنتاج).
 * ============================================================================
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { brandName } from '../lib/brand.mjs';

const port = Number(process.argv[2] ?? 4000);
const root = path.resolve(process.cwd(), process.argv[3] ?? 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.map': 'application/json; charset=utf-8',
};

if (!fs.existsSync(root)) {
  console.error(`⛔ لم يُعثر على مجلد المخرجات: ${root}\n   شغّل أولًا: npm run build`);
  process.exit(1);
}

function sendFile(res, file, status = 200) {
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const body = fs.readFileSync(file);
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-cache',
    'content-length': body.length,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  } catch {
    res.writeHead(400).end('طلب غير صالح');
    return;
  }

  // The exported 404 document is a fallback, not a public 200 route itself.
  if (urlPath === '/404' || urlPath === '/404/' || urlPath === '/404.html') {
    const notFound = path.join(root, '404.html');
    if (fs.existsSync(notFound)) sendFile(res, notFound, 404);
    else res.writeHead(404).end('404');
    return;
  }

  let file = path.join(root, urlPath.replace(/^\/+/, ''));

  // منع الخروج خارج مجلد المخرجات
  if (!file.startsWith(root)) {
    res.writeHead(403).end('غير مسموح');
    return;
  }

  // مسار بلا شرطة أخيرة: إن كان مجلدًا نوجّه إليه (مثل Vercel)
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith('/')) {
      res.writeHead(301, { location: `${urlPath}/` }).end();
      return;
    }
    file = path.join(file, 'index.html');
  }

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    sendFile(res, file);
    return;
  }

  // جرّب index.html أو ملف .html مطابق قبل إظهار 404
  for (const candidate of [`${file}.html`, path.join(file, 'index.html')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      sendFile(res, candidate);
      return;
    }
  }

  const notFound = path.join(root, '404.html');
  if (fs.existsSync(notFound)) sendFile(res, notFound, 404);
  else res.writeHead(404).end('404');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`\n🎬  معاينة ${brandName('ar')} تعمل الآن:  http://localhost:${port}\n    (المجلد: ${path.relative(process.cwd(), root)} — أوقف التشغيل بـ Ctrl+C)\n`);
});
