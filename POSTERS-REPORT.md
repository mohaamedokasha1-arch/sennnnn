# تقرير فحص وإكمال بوسترات المحتوى

تاريخ الفحص: 2026-10-04 — نطاق الفحص: **كل ملفات المحتوى في المشروع** (`content/movies`، `content/series`، `content/reviews`، `content/lists`).

## 1) ملخص الأعداد

| البند | العدد |
|---|---|
| إجمالي أعمال المحتوى المفحوصة (أفلام + مسلسلات) | **67** (67 فيلمًا + 0 مسلسلات — مجلد `content/series` فارغ) |
| أعمال كان لديها بوستر رسمي صالح قبل الفحص (ولم تُمس) | **21** |
| أعمال كانت بدون بوستر صالح عند بدء الفحص | **46** |
| — منها: صورة تصميمية عامة مكرّرة (4 قوالب فقط متشاركة بين 45 فيلمًا) | 45 |
| — منها: صورة غير رسمية/مولّدة لا تمثل العمل (Street Fighter 2026) | 1 |
| أعمال تم تركيب **بوستر رسمي موثّق** لها الآن | **18** |
| أعمال تعذّر العثور على بوستر رسمي موثوق لها | **28** |
| روابط بوسترات مكسورة / حقول فارغة بعد الإصلاح | **0** |

ملاحظات على النطاق: لا توجد مسلسلات أو مراجعات أو قوائم في المشروع حاليًا، وملفات الأشخاص (`content/people`، 151 ملفًا) لا تحتوي حقل صورة أصلًا، لذا لم يشملها الفحص.

## 2) الأعمال التي أُضيف لها بوستر رسمي (18)

كل صورة أدناه فُحصت بصريًا وتأكد أنها بوستر **نفس العمل** (الشعار/العنوان/الشخصيات مطابقة)، ونُسخت إلى `public/posters/` وحدّثت حقول `poster` و`posterAlt` و`posterAltEn` وملحوظات البوستر في ملف المحتوى:

| العمل | نوع البوستر المركّب |
|---|---|
| A Minecraft Movie Squared | بوستر تشويقي رسمي (شعار الفيلم بإطار بكسلي) |
| Gatto | بوستر تشويقي رسمي من ديزني·بيكسار |
| Godzilla x Kong: Supernova | بوستر الشعار التشويقي الرسمي |
| Hexed | بوستر تشويقي رسمي من ديزني |
| How to Rob a Bank | بوستر رسمي لدور العرض |
| Moana (النسخة الحية) | بوستر رسمي لدور العرض |
| Mortal Kombat II | ورقة عرض دولية رسمية (One-sheet) |
| Supergirl | بوستر رسمي لدور العرض (DC Studios) |
| The Batman Part II | بوستر الشعار الرسمي |
| The Conjuring: First Communion | بوستر الشعار الرسمي |
| The Florist | بوستر رسمي لدور العرض |
| The Lord of the Rings: The Hunt for Gollum | بوستر تشويقي رسمي |
| The Influencer Project | بوستر رسمي لدور العرض |
| The Mandalorian and Grogu | بوستر تشويقي رسمي |
| The Odyssey | بوستر تشويقي رسمي |
| The Simpsons Movie 2 | بوستر الإعلان الرسمي |
| Toy Story 5 | بوستر تشويقي رسمي |
| Street Fighter (2026) | **استبدال**: كانت الصورة السابقة توليدًا غير رسمي بأسلوب مربع → استُبدلت بالبوستر الرئيسي الرسمي لدور العرض |

## 3) أعمال كان لديها بوستر رسمي صالح ولم تُمس (21)

Always Lalisa · Avengers: Doomsday · Children of Blood and Bone · Clayface · Day Drinker · Digger · Dune: Part Three · Godzilla Minus Zero · Ice Age: Boiling Point · Klara and the Sun · مطلوب عائلًا · Other Mommy · Remain · The Hunger Games: Sunrise on the Reaping · The Cat in the Hat · The Mongoose · Verity · Violent Night 2 · ولا كان عالبال · Werwulf · Whalefall

(فُحصت جميعها بصريًا واحدة واحدة وتأكد أنها بوسترات رسمية للأعمال نفسها.)

## 4) أعمال تعذّر العثور على بوستر رسمي موثوق لها (28)

لهذه الأعمال لا يوجد أي بوستر رسمي منشور حتى تاريخه (بحث موسّع بالعنوان الأصلي وباللغات المحلية). لم نضع صورة عمل آخر ولا صورة مخترعة، وبدلًا من ذلك:

1. وُلّد لكل عمل **بوستر تصميمي أصلي مميز له وحده** بأداة المشروع الرسمية `lib/make-poster.py` (بعد إصلاحها لتشتقاق بذرة التصميم من معرّف العمل، فلا تتطابق صورة عملين بعد الآن — سابقًا كانت 4 صور فقط مكرّرة بين 45 فيلمًا).
2. بُقيت وسوم `posterAlt` واضحة بأنها «بوستر تصميمي أصلي»، وأُضيفت ملحوظة صريحة في كل ملف: «لم يُنشر بوستر رسمي للفيلم بعد».
3. أُبقيت أسماء الملفات وحقول `poster` كما هي دون روابط مخترعة.

القائمة:
A Quiet Place Part III · Avengers: Secret Wars · Spider-Man: Beyond the Spider-Verse · The Further Mis-Adventures of Cliff Booth · Evil Dead Wrath · Final Destination 7 · Frozen 3 · Gladys · Gremlins 3 · How to Train Your Dragon 2 (النسخة الحية) · Jumanji: Open World · Man of Tomorrow · Narnia: The Magician's Nephew · Paranormal Activity 8 · Pendulum · Possession · Shiver · Shrek 5 · Skeletons · Sonic the Hedgehog 4 · Star Wars: Starfighter · Terrifier 4 · The Dino Family · The Exorcist: Martyrs · The Great Beyond · The Legend of Zelda · The Mummy 4 · The Revenge of La Llorona

أمثلة على ما رُفض عمدًا لأنه عمل مختلف أو غير رسمي: بوسترات Frozen (2013) وSonic 3 وA Quiet Place Part II وFinal Destination: Bloodlines وThe Curse of La Llorona وGremlins 1/2 (أعمال أخرى)، وبوستر Godzilla: Minus One (خلط شائع مع Minus Zero)، وبوسترات معجبين/مولّدة (Secret Wars، Starfighter، Spider-Verse)، وصور منتجات/مجسمات (Etsy/Popcorn Poster)، ولقطات أفقية من مقاطع دعائية.

## 5) التحقق التقني بعد الإصلاح

- `npm run validate` ✅ و`npm run build` ✅ (تصدير ثابت كامل).
- كل روابط البوسترات الـ67 تعيد HTTP 200 بنوع محتوى صحيح من الموقع المبني (`/posters/...`).
- لا يوجد ملفا بوستر متطابقان (0 تكرار MD5) — كل عمل له صورته الخاصة.
- لا حقول `poster` فارغة ولا ملفات مشارة إليها غير موجودة.
- **SEO:** في صفحات الأعمال الـ67 (العربية والإنجليزية = 134 صفحة): `og:image` و`twitter:image` وبيانات `Movie`/`TVSeries` المنظمة (`image`) تشير جميعها إلى بوستر العمل نفسه بمسار مطلق — تم التحقق آليًا صفحة صفحة.
- `robots.txt` يسمح بفهرسة `/posters/` (الممنوع فقط: /search/ و/favorites/ و/404)، و`sitemap.xml` يضم 314 رابطًا.
- الصورة الافتراضية `og-default.jpg` لم تعد تظهر كبديل لأي عمل لأن لكل عمل صورة خاصة.

## 6) ملاحظات جودة متبقية (اختيارية)

بعض المصادر الرسمية تتيح دقة منخفضة فقط حاليًا؛ البوسترات صحيحة لكنها صغيرة نسبيًا: Dune: Part Three (~240px)، Street Fighter 2026 (250px)، Other Mommy (250px)، Ice Age: Boiling Point (360px)، The Batman Part II (300px). يمكن ترقية دقتها لاحقًا عندما تنشر الاستوديوهات نسخًا أعلى، دون تغيير أي بيانات أخرى.

## 7) ملفات أُنشئت/عُدّلت لدعم المهمة

- `tools/img-dims.mjs` — أداة فحص أبعاد الصور (JPEG/PNG/WebP) بدون اعتماديات، لاستبعاد اللقطات الأفقية ولقطات يوتيوب قبل الفحص البصري.
- `tools/install-posters.mjs` — سكربت التركيب المستخدم لنسخ البوسترات الـ17 وتحديث حقولها (سجل للعملية).
- `lib/make-poster.py` — أضِيفت بذرة مشتقة من معرّف العمل + قصّ/تعديلات لونية ببذرة، حتى يكون كل بوستر تصميمي فريدًا لعمله.
- `image-search/` — أرشيف الصور المرشّحة ومصادر الفحص (كما هي عادة المشروع في توثيق مصادر البوسترات).
