# تقرير فحص وإكمال بوسترات المحتوى — سينمانا

تاريخ الفحص: 2026-10-04
نطاق الفحص: **كل** ملفات المحتوى في المشروع (`content/movies/` + `content/series/` + `content/people/`).

## ملخص الأرقام

| البند | العدد |
|---|---|
| إجمالي الأفلام في المشروع | 67 |
| إجمالي المسلسلات في المشروع | 0 (مجلد `content/series/` فارغ — لا يوجد محتوى مسلسلات لفحصه) |
| أعمال كان لديها Poster حقيقي وصحيح بالفعل (لم تُمَس) | 22 |
| أعمال كان لديها Placeholder/صورة مولّدة لا تمثل العمل | 45 |
| أعمال تمت إضافة Poster/صورة موثوقة لها الآن | 30 |
| أعمال تعذّر العثور على صورة موثوقة لها (أدناه أسماؤها) | 15 |

ملاحظة: لم يُحذف أي محتوى، ولم يُعدَّل أي فيلم كان بوستره صحيحًا، ولم تُستخدم أي روابط خارجية
(كل الصور محفوظة محليًا في `public/posters/` فتكون قابلة للوصول والفهرسة من الموقع نفسه).

## ما الذي كان خاطئًا؟

45 فيلمًا كانت تشير ملفاتها إلى صور في `public/posters/` تبيّن بالفحص (بصمة MD5 متطابقة +
معاينة بصرية) أنها **4 صور مولّدة بالكود فقط** (ناتجة عن `lib/make-poster.py`) معاد استخدامها عبر
45 عملًا مختلفًا — أي صورة Placeholder/Demo لا تمثل الأعمال إطلاقًا.

## الأعمال الـ22 التي كان بوسترها صحيحًا وظل كما هو

always-lalisa، avengers-doomsday، children-of-blood-and-bone، clayface-2026، day-drinker،
digger-2026، dune-part-three، godzilla-minus-zero، ice-age-boiling-point، klara-and-the-sun،
matloub-3a2eleyain، other-mommy، remain، street-fighter-2026، sunrise-on-the-reaping،
the-cat-in-the-hat-2026، the-mongoose-2026، verity، violent-night-2، wala-kan-ala-el-bal،
werwulf، whalefall.

## الأعمال الـ30 التي أُضيفت لها صورة موثوقة تمثل العمل نفسه

(نوع المصدر مذكور بين قوسين: بوستر رسمي / شعار أو بطاقة عنوان رسمية / لقطة first-look رسمية)

1. toy-story-5 — بوستر رسمي (النسخة اليابانية لـ Toy Story 5)
2. the-batman-part-ii — بطاقة العنوان الرسمية The Batman Part II
3. shrek-5 — بوستر الإعلان الرسمي (Shrek 5)
4. supergirl-2026 — البوستر الرسمي (Milly Alcock)
5. the-odyssey-2026 — البوستر الرسمي (Christopher Nolan)
6. mortal-kombat-ii — بوستر الشعار الرسمي (Mortal Kombat II)
7. a-quiet-place-part-iii — لقطة first-look رسمية للجزء الثالث
8. beyond-the-spider-verse — البوستر التشويقي الرسمي
9. avengers-secret-wars — بطاقة الشعار الرسمية من Marvel Studios
10. frozen-3 — بوستر تشويقي رسمي (Frozen 3)
11. the-mandalorian-and-grogu — البوستر الرسمي
12. sonic-the-hedgehog-4 — فن رسمي للشخصيات (Sonic 4)
13. a-minecraft-movie-squared — صورة الإعلان الرسمية الأولى للجزء الثاني
14. star-wars-starfighter — بطاقة الشعار الرسمية Star Wars: Starfighter
15. moana-live-action — البوستر الرسمي للنسخة الحية
16. jumanji-open-world — لقطة first-look رسمية من Sony للجزء الجديد
17. narnia-the-magicians-nephew — فن first-look رسمي لفيلم Netflix
18. the-conjuring-first-communion — بطاقة الشعار الرسمية
19. the-simpsons-movie-2 — البوستر التشويقي الرسمي
20. gremlins-3 — لقطة رسمية أولى (Mogwai) من Teaser الفيلم
21. the-legend-of-zelda — بطاقة الإعلان الرسمية بتاريخ العرض
22. cliff-booth-2026 — لقطة رسمية من Netflix (The Further Mis-Adventures of Cliff Booth)
23. evil-dead-wrath — البوستر الرسمي
24. hexed-2026 — البوستر الرسمي (Disney)
25. gatto — فن رسمي من Pixar (Gatto)
26. how-to-rob-a-bank — البوستر الرسمي
27. pendulum — لقطة first-look رسمية
28. the-influencer-project — البوستر الرسمي
29. the-dino-family — بوستر العرض الرسمي للفيلم
30. the-florist-2026 — لقطة رسمية من تريلر الفيلم

كل صورة عُرضت بصريًا قبل الاعتماد للتأكد أنها تمثل **نفس العمل** وليست جزءًا آخر من السلسلة
أو عملًا مشابهًا.

## الأعمال الـ15 التي تعذّر العثور على صورة موثوقة لها (ما زالت بصورة التصميم المولّدة)

هذه أعمال غير صدرت بعد، ولم يُنشر لها حتى تاريخ هذا التقرير أي بوستر رسمي أو لقطة first-look
رسمية تخصّها (نتائج البحث كانت بوسترات أجزاء قديمة من السلسلة نفسها أو فنون معجبين — ورفضنا
استخدامها التزامًا بعدم وضع صورة عمل آخر):

1. final-destination-7
2. paranormal-activity-8
3. possession-2027
4. terrifier-4
5. the-great-beyond
6. gladys
7. shiver
8. skeletons
9. the-exorcist-martyrs
10. the-hunt-for-gollum
11. the-mummy-4
12. the-revenge-of-la-llorona
13. how-to-train-your-dragon-2-live-action
14. man-of-tomorrow
15. godzilla-x-kong-supernova

التوصية: عند نشر أي بوستر/لقطة رسمية لأحد هذه الأعمال، يُستبدل الملف في
`public/posters/<slug>.jpg` بنفس الاسم ولا يلزم أي تعديل في ملف المحتوى.

## SEO

- بيانات `Movie`/`TVSeries` المنظمة (Schema.org) تستخدم `image` من حقل البوستر تلقائيًا
  (`lib/seo.mjs` ← `workJsonLd`)، وكل البوسترات الآن صور حقيقية محلية للأعمال.
- `og:image` وTwitter Card يقرآن البوستر نفسه عند وجوده
  (`app/movie/[slug]/page.jsx` و`app/series/[slug]/page.jsx` ← `image: work.hasPoster ? work.poster : null`).
- جميع الصور مسارات محلية داخل `public/posters/` (الروابط الخارجية مرفوضة تقنيًا في
  `lib/content.mjs`)، وبالتالي قابلة للوصول والفهرسة، ولا تشير إلى Placeholder في الـ52 عملًا
  المكتملة. الـ15 عملًا المتبقية تظهر صورتها التصميمية المولّدة محليًا (بديل الموقع الموثّق في
  CONTENT-GUIDE) حتى يتوفر فن رسمي.

## التحقق التقني

- `npm test` — نجح (44 اختبارًا) ويشمل فحص وجود ملفات البوسترات المشار إليها.
- `npm run build` — نجح بالكامل (prebuild validation + توليد كل الصفحات).
- فحص تكرار: بعد التحديث، لا توجد صورتان متطابقتان إلا بين الـ15 عملًا المذكورين أعلاه
  (لأنها ما زالت على صورة التصميم المولّدة المشتركة).
