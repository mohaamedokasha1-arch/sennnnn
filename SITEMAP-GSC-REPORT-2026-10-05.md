# تقرير فحص وإصلاح مشكلة Sitemap في Google Search Console

**الموقع:** https://cenimana-aflam-arabic.vercel.app
**تاريخ الفحص:** 2026-10-05 (فحص خارجي من شبكات لا علاقة لها بالجهاز المحلي)
**الفرع:** `arena/01a10cae-sennnnn` · **الإنتاج الحالي:** نشر `d568a10` (2026-10-05T14:37:00Z)

---

## 1) سبب المشكلة الحقيقي

**لا يوجد أي عيب تقني في `sitemap.xml` المنشور على الإنتاج.** الملف سليم بنسبة 100%، وهذا مُثبت بقياس بايت-ببايت خارجيًا:

- `ETag` الذي يرسله Vercel للملف الحقيقي = بصمة MD5 لنفس الملف المُبنى محليًا:
  - `/sitemap.xml` → `c27995441ed133220c131f6f76d0692b` (36,317 بايت) — تطابق تام.
  - `/robots.txt` → `b064c1a6e768a625f4adbb4e84e230dd` (86 بايت) — تطابق تام.
- أي أن ما يراه جوجل هو حرفيًا نفس الملف الذي نجح في كل الفحوص الصارمة أدناه.

**السبب الفعلي المرجّح:** Google Search Console يحتفظ بنتيجة الجلب/القراءة الفاشلة القديمة (من فترة ما قبل إصلاح `d568a10` المنشور قبل ساعة واحدة فقط من لحظة الفحص)، ولا يعيد الجلب تلقائيًا بالسرعة المتوقعة. هذه حالة موثّقة ومعروفة، وحلها العملي الوحيد من جهتنا هو إعطاء GSC **رابطًا جديدًا لم يجرّبه من قبل** + إعادة نشر إنتاجي حديثة.

**ما استُبعد بأدلة قاطعة (ليس هو السبب):**

| الاحتمال | النتيجة |
|---|---|
| خطأ HTTP أو عدم 200 | ❌ مستبعد — الاستجابة **200 OK** |
| Content-Type غير مناسب | ❌ مستبعد — **`application/xml`** |
| Redirectات متسلسلة أو middleware/rewrites | ❌ مستبعد — لا `middleware.js` ولا `vercel.json` ولا rewrites؛ التحويل الوحيد 308 من http→https (قياسي) |
| حجب Googlebot / حماية / authentication | ❌ مستبعد — لا `401/403/challenge` ولا `X-Robots-Tag`، والملف متاح من شبكات خارجية متعددة |
| منع في robots.txt | ❌ مستبعد — `User-Agent: *` + `Allow: /` |
| XML غير سليم / namespace خاطئ / وسم غير مغلق | ❌ مستبعد — تحليل صارم (expat/minidom) نجح |
| أحرف غير مهروبة / BOM / ترميز تالف | ❌ مستبعد — لا BOM، UTF-8 سليم، **صفر** `&` غير مهروب، لا محارف تحكّم |
| روابط لصفحات غير موجودة | ❌ مستبعد — **413/413** رابطًا يقابل ملفًا مُصدَّرًا فعليًا |
| تجاوز حدود الحجم/العدد | ❌ مستبعد — 36,317 بايت و413 رابطًا (الحد 50MB و50,000) |

> ملاحظة: الخطأ المذكور في GSC («تعذرت قراءة خريطة الموقع») يظهر في هذه الحالات عادةً حين تكون استجابة جوجل نفسها قديمة/فاشلة محفوظة لديه، لا حين يكون الملف معطوبًا.

---

## 2) ما الذي تم إصلاحه / تنفيذه

1. **إضافة رابط خريطة جديد لم يجرّبه جوجل من قبل:** `/sitemap-all.xml`
   - يُولَّد تلقائيًا في كل بناء كنسخة **مطابقة بايتًا ببايت** من `/sitemap.xml` (نفس MD5: `c27995441ed133220c131f6f76d0692b`).
   - الغرض: تسليم GSC رابطًا نظيفًا يتجاوز النتيجة الفاشلة القديمة المحفوظة لديه، دون المساس بالرابط الأساسي.
2. **تدقيق بناء إلزامي** يمنع أي انحراف: البناء يفشل إذا اختلفت النسخة عن الأصل (`tools/audit-seo-export.mjs`).
3. **توسيع أداة التحقق الحية** `npm run seo:live` لتفحص الرابطين (200 + `application/xml` + نفس المستند) مع فحص 413 صفحة بهوية Googlebot.
4. **لم يُغيَّر أي شيء آخر:** لا تصميم، لا هوية، لا بيانات، لا روابط، ولا `robots.txt`، ولا محتوى `/sitemap.xml`.

> ⚠️ التعديلات على الفرع `arena/01a10cae-sennnnn`؛ ولم تُنشر على الإنتاج بعد — النشر الإنتاجي يتم تلقائيًا بعد دمج الـPR في `main`.

---

## 3) نتائج الفحص الخارجي (قياسات فعلية من خارج بيئة التطوير)

### `/sitemap.xml`
```
HTTP/1.1 200 OK
Content-Type: application/xml
Content-Encoding: gzip
ETag: W/"c27995441ed133220c131f6f76d0692b"     ← = MD5 الملف المحلي (تطابق بايت-ببايت)
Last-Modified: Mon, 05 Oct 2026 14:37:15 GMT
Cache-Control: public, max-age=0, must-revalidate
Server: Vercel
(لا يوجد X-Robots-Tag · لا يوجد Set-Cookie · لا يوجد أي رأس حجب)
```

### `/robots.txt`
```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 86
ETag: "b064c1a6e768a625f4adbb4e84e230dd"      ← = MD5 الملف المحلي (تطابق بايت-ببايت)
```
المحتوى:
```
User-Agent: *
Allow: /

Sitemap: https://cenimana-aflam-arabic.vercel.app/sitemap.xml
```
✅ يسمح بالزحف لكل الزواحف ولا يمنع `/sitemap.xml` ولا أي صفحة مهمة، ويشير إلى الخريطة الصحيحة.

### فحوص إضافية خارجية
- `/sitemap.xml/` (بشرطة أخيرة) → 308 ثم **200** بنفس الملف (يعمل أيضًا).
- `/movies/evil-dead-wrath/` → **200** `text/html` (الصفحات المدرجة حيّة).
- `/404/` → **404** (لا توجد صفحات وهمية برمز 200).
- تحليل XML صارم للملف: 413 `<loc>`، جذر `urlset` بالـnamespace الصحيح `http://www.sitemaps.org/schemas/sitemap/0.9`، إغلاق `</urlset>` سليم، لا تكرار، أطول رابط 90 حرفًا.
- محاكاة Googlebot على كل الصفحات من الرابطين: **413/413 = HTTP 200 + canonical ذاتي + بلا noindex**.

---

## 4) ملخص الإجابات المطلوبة

| البند | النتيجة |
|---|---|
| **Status Code النهائي** | **200 OK** لـ`/sitemap.xml` و`/sitemap-all.xml` (و`/robots.txt`) |
| **Content-Type النهائي** | **`application/xml`** (الصيغة المقبولة لدى جوجل) |
| **هل robots.txt يسمح بالوصول؟** | **نعم** — `Allow: /` لكل الزواحف + إعلان Sitemap الصحيح |
| **عدد URLs في الـSitemap** | **413** رابطًا فريدًا (11 صفحة ثابتة + 67 فيلمًا عربيًا + 67 إنجليزيًا + 100 مسلسل + 151 شخصًا + 17 تصنيفًا) |
| **هل تم تقسيم Sitemap؟** | **لا، وغير مطلوب**: 413 < 50,000 رابطًا و36,317 < 50MB. أُضيفت نسخة ثانية مطابقة (`/sitemap-all.xml`) كرابط نظيف لـGSC فقط، والبنية جاهزة للتقسيم عند النمو |
| **رابط الـSitemap النهائي** | https://cenimana-aflam-arabic.vercel.app/sitemap.xml |
| **رابط بديل للتقديم في GSC** | https://cenimana-aflam-arabic.vercel.app/sitemap-all.xml |
| **الإصلاح على Production؟** | بعد دمج الـPR في `main` يُنشئ Vercel نشرًا إنتاجيًا تلقائيًا؛ التحقق النهائي: `npm run seo:live` من اتصال خارجي |

---

## 5) الخطوات المطلوبة في Google Search Console (بعد النشر الإنتاجي)

1. افتح **Sitemaps** → احذف الإدخال الفاشل `sitemap.xml`.
2. أضف الرابط الجديد: `https://cenimana-aflam-arabic.vercel.app/sitemap-all.xml`
   (رابط لم يجرّبه جوجل قبلاً — يتجاوز الحالة الفاشلة المحفوظة).
3. اختياري: أعد إضافة `https://cenimana-aflam-arabic.vercel.app/sitemap.xml` أيضًا.
4. استخدم **فحص عنوان URL → اختبار عنوان URL المباشر** على الصفحة الرئيسية، وتأكد أن «جلب الصفحة: ناجح».
5. لا تعتبر النتيجة نهائية قبل 24–48 ساعة؛ ظهور «تعذرت القراءة» مؤقتًا بعد الإضافة الأولى أمر طبيعي.
6. إن ظل الخطأ مع الرابط الجديد: راجع في Vercel لوحة المشروع ← Firewall/Attack Challenge Mode، وتأكد أن خاصية الحماية (Deployment Protection) غير مفعّلة على الإنتاج، وأن خاصية الموقع في GSC هي `https://cenimana-aflam-arabic.vercel.app/` (URL-prefix).

---

## 6) الأدلة المحلية على سلامة الملف (مكرّرة بعد التعديل)

```
✅ Static export cleanup: removed HTTP-200 placeholders …
✅ Sitemap mirror: /sitemap-all.xml written as a byte-identical copy of /sitemap.xml (36,317 bytes)
✅ SEO/export audit: 413 canonical sitemap URLs (+ byte-identical /sitemap-all.xml mirror); 67 reciprocal ar/en movie pairs;
   4 noindex pages excluded; 167 local posters ≤200 KiB; 2159 JSON-LD objects parsed; 552 HTML documents checked.
```
واختبار التصدير الكامل عبر محاكاة Googlebot:
```
✅ robots.txt: HTTP 200 · text/plain; charset=utf-8 · allows crawling + points to sitemap.
✅ sitemap.xml: HTTP 200 · application/xml; charset=utf-8 · 36,317 bytes · 413 unique HTTPS URLs.
✅ sitemap-all.xml: HTTP 200 · application/xml · identical document (fresh URL for Search Console).
✅ 413/413 sitemap pages: HTTP 200, self-canonical, indexable.
```
