# تدقيق بوسترات المسلسلات — الفحص، النشر، والتحقق على Vercel

تاريخ التقرير: 2026-10-04 (بعد النشر)
النطاق المفحوص: `https://cenimana-aflam-arabic.vercel.app`
 commits المنشورة: `ef397c9` (PR #14) ثم `fd14b25` (PR #15) — كلتاهما Production بحالة **success**
شجرة الملفات المنشورة `4b7fa23cf0bb80aea9bce48b0c865990b638648e` مطابقة تمامًا لشجرة Commit المحلي الذي عليه اجتُيزت كل الفحوص (`git rev-parse HEAD^{tree}`).

## 1) الخلاصة الرقمية

| البند المطلوب | العدد |
|---|---:|
| عدد المسلسلات التي فُحصت كلها | **100** |
| مسلسلات بلا أي بوستر قبل هذه الجولة (حقل `poster: null` + بديل نصي) | **100** |
| حقول بوستر فارغة أو تشير إلى ملف غير موجود بعد التعديل | **0** |
| صور فنية غير صحيحة/غير موثّقة استُبدلت | **100** |
| مسلسلات يعرض الموقع الآن صورة بوستر مطابقة محليّة | **100** |
| مسلسلات تستخدم غلافًا تصميميًا أصليًا موسومًا كبديل واضح | **100** |
| مسلسلات فيها بوستر رسمي موثّق ومرخّص | **0** |
| روابط صور مكسورة أو مسارات خارجية أو صور مكرّرة بين مسلسلين | **0** |
| مسلسلات ما زالت تحتاج بوسترًا رسميًا موثوقًا | **100** |

## 2) ما الذي كان عليه الحال قبل الإصلاح

في الجولة السابقة من التدقيق أُفرغت حقول `poster` لكل المسلسلات المئة (لأن الأغلفة المئوية القديمة كانت تجريدًا مولّدًا لا يطابق أي عمل) واستُعيضت ببطاقة نصية «صورة مؤقتة». أي أن **100 مسلسلًا لم يكن يعرض أي صورة** قبل هذه الجولة. الأخطاء التي كانت موجودة:

- حقل `poster` فارغ عمدًا في 100 سجل → لا صورة في البطاقة ولا في صفحة التفاصيل ولا في البحث.
- 100 ملف صورة قديم `public/posters/<slug>.jpg` بقي على القرص دون ربط: أغلفة تجريدية لا علاقة لها بالأعمال (لوّنها المولّد `lib/make-poster.py` سابقًا) — أي «صورة فنية غير صحيحة» بالنسبة للمستخدم.
- بيانات SEO وفهرس البحث كانا يُستثنيان المسلسلات من الصور، فلا صورة ولا `og:image` للعمل.

## 3) ما تم عمله فعليًا

لكل مسلسل من المئة:

1. **توليد صورة عمودية أصلية 600×900 (نسبة 2:3، العرض ≥ 500px)** بحجم 34.4–58.8 كيلوبايت (أقل بكثير من سقف 200KB، وبلا أي إعادة تحجيم تُغيّر المحتوى)، تُخزَّن محليًا في `public/posters/<slug>.jpg` باسم مطابق لمعرّف المسلسل، وتُحقن فيها طبقة نصية تحمل **اسم المسلسل الأصلي + سنة الإصدار + لغة/نوع** وشعار «AKASHA CENIMA» خافتًا + إقرار داخل الصورة نفسها:
   `Original design cover created for Akasha Cenima — not the official poster.`
2. **ربط الصورة بالسجل**: `poster: "/posters/<slug>.jpg"` (مسار داخلي فقط — لا روابط خارجية، ولا روابط مُختلقة)، مع `posterDesign: true` و`posterAlt` عربي/إنجليزي يصرّح بأنها غلاف تصميمي أصلي وليس البوستر الرسمي. حُذِف `posterTemporary` من كل السجلات.
3. **إظهار الوسم في الواجهة**: شارة «غلاف تصميمي أصلي» على بطاقة العمل في الشبكة، وعلى عمود البوستر في صفحة التفاصيل، مع ملاحظة `.poster-design-note` أسفل البوستر توضح السبب؛ والشارة نفسها صارت تظهر على بطاقات قائمة `/series/` (PR #15).
4. **توزيع بصري بلا تكرار**: 6 أنماط لونية (`noir 22 · ink 23 · sand 19 · teal 10 · crimson 19 · rose 7`) تُختار بالنوع + `crc32(slug)`، والزخرفة من بصمة المعرّف، فلا تتشابه بطاقتان لمسلسلين مختلفين. تدقيق `sha1` يؤكد أن الملفات المئة متمايزة بايت-ببايت.
5. **الأدوات والحراسة**: `tools/series-covers-install.mjs` (توليد + تثبيت + `--verify`)، `tools/poster-hunt/verify-covers.py` (فحص بصري/نصّي للأغلفة)، `lib/test-posters.mjs` (قواعد البوستر + dedupe)، `tools/audit-poster-export.mjs` (تدقيق مخرجات `out/` بعد البناء).

**مهم — ما لم يُزعم:** الصور المعروضة ليست بوسترات رسمية. لم يُعثر في هذه البيئة على مصدر صورة رسمي واحد يمكن التحقق منه لكل مسلسل، ولا على إذن إعادة نشر، لذا لا يُعد أي مسلسل «تم إصلاح بوستره الرسمي». المعروض هو غلاف تصميمي أصلي من إنتاج الموقع، موسوم بوضوح، يحمل اسم العمل حتى لا يُترك بلا صورة — وهو البديل الذي اختاره المشروع بدل البديل النصي الجاف.

## 4) الاختبارات بعد التعديل (كلها ناجحة)

| الأمر | النتيجة |
|---|---|
| `node tools/series-covers-install.mjs --verify` | توليد: 100 · ملفات معدّلة: 100 · مشكلات: 0 |
| `npm run validate` | أفلام 67 · مسلسلات 100 · أشخاص 151 · ✅ كل بيانات المحتوى سليمة |
| `npm run test:posters` | ✅ 100 مسلسل يعرض صورة محلية (100 غلاف موسوم، 0 بوستر رسمي) · ✅ 0 بديلًا نصيًا · لا مسارات خارجية/مفقودة/مكررة |
| `npm test` | ✅ كل الاختبارات نجحت (44 اختبار منطق) + تدقيق البوسترات |
| `npm run build` | ✅ 555 صفحة ثابتة + `✅ تدقيق التصدير: 100 صفحة تفاصيل (100 بصورة فعلية، 100 غلافًا موسومًا، 0 بديلًا نصيًا)` + فحص 555 صفحة ضد الروابط المكسورة |
| `npm run posters:verify` | ✅ الأغلفة المئة مطابقة للمواصفات (النص داخل حدود الآمان، العنوان ≤ 3 أسطر) |
| `node tools/img-dims.mjs --dir public/posters` | 168 ملفًا سليم الصيغة، منها 100 غلاف مسلسل 600×900 |
| تدقيق بصري | `tools/poster-hunt/montage.py` → مونتاج 4×4 فُحص بصريًا: أسماء صحيحة، لا صناديق glyphs، لا قصّ، لا تكرار |

## 5) التحقق بعد النشر على Vercel (وليس محليًا فقط)

1. **النشر**: PR #14 (squash) → `ef397c9` ثم PR #15 → `fd14b25`. حالة Vercel Deployment لـ `fd14b25`: `state=success` والوصف `Deployment has completed`، وقناة Production على `main`.
2. **تكافؤ المصدر**: `git rev-parse HEAD^{tree}` = `4b7fa23c…` = شجرة Commit المنشور ⇒ ما فُحص محليًا هو نفس ما يُقدَّم على النطاق.
3. **اكتمال الأصول في الشجرة المنشورة**: مقارنة `gh api …/git/trees/fd14b25?recursive=1` (168 ملفًا في `public/posters/`) مع 100 معرّف مسلسل ⇒ **0 مفقود** (كل `public/posters/<slug>.jpg` موجود في النشر).
4. **الملفات تُخدَم فعلًا**: 11 رابط `https://…/posters/<slug>.jpg` فُحصت بعد النشر (`squid-game`, `yargi`, `al-hashashin`, `sky-castle`, `when-life-gives-you-tangerines`, `first-love`, `seni-taniyorum`, `breaking-bad`, `money-heist`, `bridgerton`, `al-ameel`) — كلها تُخدَم كملف صورة (الوكيل القارئ يرجّع خطأ «HTTP 500» لأنه يحاول قراءة صورة كنص، وهذا دليل وجود الملف)، بينما الرابط الوهمي `…/posters/definitely-not-a-real-poster.jpg` يُرجع صفحة 404 العربية «لم نجد هذه الصفحة». هذا هو معيار التمييز المعتمد.
5. **قائمة `/series/` المنشورة**: بطاقات الصفحة الأولى (24 من 100، وهي المُصيَّرة على الخادم) كلها تحمل `![بوستر مسلسل …](https://…/posters/<slug>.jpg)` المطابق لمعرّف كل عمل + شارة «غلاف تصميمي أصلي»، ولا توجد عبارة «صورة مؤقتة». بقية البطاقات تُصَيَّر من نفس الحمولة وتُصفّى في المتصفح؛ تغطيتها موثّقة في تدقيق `out/` لكل الصفحات.
6. **صفحات التفاصيل المنشورة**: `/series/squid-game/` و`/series/yargi/` — كل بطاقة في «أعمال مشابهة» تعرض بوسترها الحقيقي مع الشارة، وبيانات المواسم، والمراجعة التحريرية، وروابط المنصات الرسمية سليمة (لا انحدار في المحتوى). ملاحظة: مستخرج الصفحات يحذف كتلة `<header class="detail-head">` من المخرجات، فلم يمكن قراءة البوستر الرئيسي من الجلب الحي؛ إثباته جاء من التدقيق المحلي على `out/` (الذي يطابق الشجرة المنشورة) حيث يوجد `src="/posters/<slug>.jpg"` + الملاحظة + `data-poster-design` في المئة صفحة.
7. **سطح المكتب والموبايل**: لا تتوفر في هذه البيئة أداة متصفح (لا Chromium/Playwright) لالتقاط لقطة فعلية، فلم يُزج بقياس pixel-by-pixel. التحقق هيكلي من CSS والتصيير: `.card-media { aspect-ratio: 2/3 }` و`img { width:100%; height:100%; object-fit:cover }` بلا أي override عند نقاط التوقف، و`.detail-head` عمود واحد تحت 820px و`300px 1fr` فوقها، مع أبعاد صورة تساوي نسبة الإطار تمامًا (600×900 = 2:3) ⇒ لا قصّ ولا إزاحة في أي مقاس. الفلاتر والترتيب والبحث وبيانات بقية الأقسام لم تُمسّ.

## 6) المشكلات التقنية التي ظهرت وكيف عُولجت

1. **شارات القائمة مفقودة**: `/series/` يبني نسخة مصغّرة من كل عمل لتمريرها لفلاتر المتصفح، وكانت تُسقط `posterDesign` فلا تظهر الشارة على بطاقات القائمة — أُضيف الحقل + شرط بناء يفشل لو اختفت الشارة من `out/series/index.html` (PR #15).
2. **إنذار كاذب «بوستر مفقود»**: أول مقارنة بين الشجرة المنشورة والمعرّفات أظهرت missing=1 بسبب سطر مبتور في ملف وسيط `/tmp/series-slugs.txt` (أحد الأنابيب)، لا بسبب نقص حقيقي. أُعيدت المقارنة بملفَي إدخال نظيفين: 0 مفقود. (الخلل كان في أداة الفحص، لا في الموقع.)
3. **جلب الصور بالجملة يفشل**: حزم `fetch_page` لعشرات الروابط تُعاد عبر رابط وكيل منتهي الصلاحية وترجع `SignatureDoesNotMatch`؛ استُخدمت دفعات صغيرة بروابط مكتوبة يدويًا بدلًا من ذلك.
4. **مسارات مانيفست تبدأ بـ `/`**: `os.path.join(ROOT, e['file'])` كان يهرب من الجذر (`FileNotFoundError: /posters/…`)؛ صُحّح الفحص إلى `public/posters/<basename>` (نفس الصنف من الأخطاء الذي عُومل سابقًا في `verify-covers.py` بـ `lstrip('/')`).
5. **نصّ داخل الصورة**: مولّد الأغلفة كان يقبل CJK/Devanagari في طبقة لاتينية فيخرج صناديق فارغة، وكان يعيد كتابة السنة في الشريط العلوي مكررة؛ مُنعت الحروف غير اللاتينية في `NON_LATIN` وأُزيل التكرار، والسنة تُطبع مرة واحدة بحجم مستقل.
6. **تعديل الـ front matter**: كان بحث `patchFrontMatter` عن نهاية الكتلة `---` يبدأ من الفهرس 0 فيصيب فاتحة الكتلة نفسها؛ صُحّح ليبحث من الفهرس 1.
7. **الاختبارات البالية**: `lib/test-posters.mjs` و`tools/audit-poster-export.mjs` كانا يفرضان البديل النصي؛ أعيدت صياغتهما ليفرضا «صورة محلية مطابقة + وسم صريح + أبعاد/حجم/تفرّد»، وأُضيف فحص 555 صفحة ضد روابط `/posters/` المكسورة.
8. **ملفات يتيمة مضللة**: ملفات الأغلفة القديمة التجريدية أٌعيد توليدها فوقها في نفس المسار (`public/posters/<slug>.jpg`) بدل ترك صور غير مربوطة قد تُخدَم صدفةً، فصار كل ملف موجود مطابقًا لسجله.

## 7) المسلسلات التي ما زالت تحتاج بوسترًا رسميًا موثوقًا

**كل المسلسلات المئة (100/100)** ما زالت في حالة «يحتاج بوسترًا رسميًا موثوقًا». السبب واحد ومشترك:

> لا يمكن في هذه البيئة الوصول إلى مصدر رسمي مرخّص (TMDB/Netflix/الصانع) ولا التحقق من حق إعادة نشر أي صورة، وهي شروط المشروع؛ البحث العائد من `image_search` يعطي صورًا مصغّرة 220px أو سلع معجبين لا تصلح. لذلك عُرض غلاف تصميمي أصلي موسوم (يحمل اسم العمل وسنته) بدلًا من ترك خانة البوستر فارغة أو وضع صورة غير موثوقة. الاستبدال ببوستر رسمي مطلوب لكل عمل، ويُجرى فرديًا مع مراجعة بشرية للمسار والحقوق.

جدول الحالة الكامل (الأبعاد والحجم لكل ملف كما هي منشورة الآن):

| # | المسلسل | الاسم الأصلي | المعرّف | نمط الغلاف | الأبعاد | الحجم | غلاف موسوم |
|---:|---|---|---|---|---|---:|:--:|
| 1 | آل التنين | House of the Dragon | `house-of-the-dragon` | sand | 600×900 | 47KB | ✅ |
| 2 | أحفاد الشمس | 태양의 후예 (Descendants of the Sun) | `descendants-of-the-sun` | crimson | 600×900 | 45KB | ✅ |
| 3 | أشياء غريبة | Stranger Things | `stranger-things` | noir | 600×900 | 53KB | ✅ |
| 4 | أفاتار: آخر مسخّر هواء | Avatar: The Last Airbender | `avatar-the-last-airbender` | sand | 600×900 | 48KB | ✅ |
| 5 | ألعاب مقدسة | सेक्रेड गेम्स (Sacred Games) | `sacred-games` | noir | 600×900 | 44KB | ✅ |
| 6 | أليس في بلاد الحدود | 今際の国のアリス (Alice in Borderland) | `alice-in-borderland` | noir | 600×900 | 45KB | ✅ |
| 7 | أم هارون | Umm Haroun | `umm-haroun` | ink | 600×900 | 48KB | ✅ |
| 8 | أنت اطرق بابي | Sen Çal Kapımı | `sen-cal-kapimi` | rose | 600×900 | 45KB | ✅ |
| 9 | أوزارك | Ozark | `ozark` | crimson | 600×900 | 41KB | ✅ |
| 10 | إتايون كلاس | 이태원 클라쓰 (Itaewon Class) | `itaewon-class` | ink | 600×900 | 45KB | ✅ |
| 11 | إيزيل | Ezel | `ezel` | noir | 600×900 | 42KB | ✅ |
| 12 | اتصل بوكيلي | Dix pour cent (Call My Agent!) | `call-my-agent` | rose | 600×900 | 46KB | ✅ |
| 13 | الاختيار | Al Ekhtiyar (The Choice) | `al-ekhtiyar` | noir | 600×900 | 40KB | ✅ |
| 14 | الانفصال | Severance | `severance` | crimson | 600×900 | 52KB | ✅ |
| 15 | البطل الضعيف | 약한영웅 (Weak Hero Class) | `weak-hero` | crimson | 600×900 | 50KB | ✅ |
| 16 | البيت الحلو | 스위트홈 (Sweet Home) | `sweet-home` | noir | 600×900 | 45KB | ✅ |
| 17 | الحب الأول | First Love 初恋 | `first-love` | rose | 600×900 | 40KB | ✅ |
| 18 | الحشاشين | Al Hashashin | `al-hashashin` | sand | 600×900 | 39KB | ✅ |
| 19 | الحفرة | Çukur | `cukur` | noir | 600×900 | 47KB | ✅ |
| 20 | الحكم | Yargı | `yargi` | crimson | 600×900 | 40KB | ✅ |
| 21 | الخيول البطيئة | Slow Horses | `slow-horses` | noir | 600×900 | 43KB | ✅ |
| 22 | الدب | The Bear | `the-bear` | sand | 600×900 | 41KB | ✅ |
| 23 | الزند: ذئب العاصي | Al Zand: Dheeb Al Aasi | `al-zand` | noir | 600×900 | 54KB | ✅ |
| 24 | الساحر | The Witcher | `the-witcher` | ink | 600×900 | 44KB | ✅ |
| 25 | السادة | The Gentlemen | `the-gentlemen` | noir | 600×900 | 39KB | ✅ |
| 26 | الطائر المبكر | Erkenci Kuş | `erkenci-kus` | sand | 600×900 | 45KB | ✅ |
| 27 | الطبيب المعجزة | Mucize Doktor | `mucize-doktor` | sand | 600×900 | 51KB | ✅ |
| 28 | العتاولة | Al Atawla | `al-atawla` | noir | 600×900 | 41KB | ✅ |
| 29 | العشق الممنوع | Aşk-ı Memnu | `ask-i-memnu` | teal | 600×900 | 50KB | ✅ |
| 30 | العفريت | 도깨비 (Guardian: The Lonely and Great God) | `goblin` | ink | 600×900 | 50KB | ✅ |
| 31 | العميل | Al Ameer (The Agent) | `al-ameel` | ink | 600×900 | 40KB | ✅ |
| 32 | الفتيان | The Boys | `the-boys` | ink | 600×900 | 39KB | ✅ |
| 33 | الكبير أوي | Al Kabeer Awi | `al-kabeer-awy` | sand | 600×900 | 43KB | ✅ |
| 34 | اللوتس الأبيض | The White Lotus | `the-white-lotus` | ink | 600×900 | 45KB | ✅ |
| 35 | المؤسس عثمان | Kuruluş: Osman | `kurulus-osman` | sand | 600×900 | 44KB | ✅ |
| 36 | المال الأسود والعشق | Kara Para Aşk | `kara-para-ask` | noir | 600×900 | 51KB | ✅ |
| 37 | المجد | 더 글로리 (The Glory) | `the-glory` | ink | 600×900 | 50KB | ✅ |
| 38 | المحامية الاستثنائية وو | 이상한 변호사 우영우 (Extraordinary Attorney Woo) | `extraordinary-attorney-woo` | ink | 600×900 | 47KB | ✅ |
| 39 | المداح | Al Maddah | `al-maddah` | crimson | 600×900 | 41KB | ✅ |
| 40 | المدينة البعيدة | Uzak Şehir | `uzak-sehir` | rose | 600×900 | 40KB | ✅ |
| 41 | المرآة السوداء | Black Mirror | `black-mirror` | noir | 600×900 | 46KB | ✅ |
| 42 | المراهقة | Adolescence | `adolescence` | noir | 600×900 | 46KB | ✅ |
| 43 | المملكة | 킹덤 (Kingdom) | `kingdom` | noir | 600×900 | 50KB | ✅ |
| 44 | النادي | Kulüp (The Club) | `kulup` | sand | 600×900 | 40KB | ✅ |
| 45 | النخبة | Élite (Elite) | `elite` | crimson | 600×900 | 38KB | ✅ |
| 46 | الهبوط الاضطراري للحب | 사랑의 불시착 (Crash Landing on You) | `crash-landing-on-you` | teal | 600×900 | 42KB | ✅ |
| 47 | الهيبة | Al Hayba | `al-hayba` | teal | 600×900 | 44KB | ✅ |
| 48 | بانتشايات | पंचायत (Panchayat) | `panchayat` | ink | 600×900 | 45KB | ✅ |
| 49 | برلين | Berlín (Berlin) | `berlin` | crimson | 600×900 | 35KB | ✅ |
| 50 | بريدجرتون | Bridgerton | `bridgerton` | teal | 600×900 | 45KB | ✅ |
| 51 | بريكنغ باد | Breaking Bad | `breaking-bad` | ink | 600×900 | 52KB | ✅ |
| 52 | بورغن | Borgen | `borgen` | sand | 600×900 | 40KB | ✅ |
| 53 | بيت من ورق | La casa de papel (Money Heist) | `money-heist` | crimson | 600×900 | 52KB | ✅ |
| 54 | بيرسي جاكسون والآلهة الأولمبية | Percy Jackson and the Olympians | `percy-jackson-and-the-olympians` | sand | 600×900 | 59KB | ✅ |
| 55 | بيكي بلايندرز | Peaky Blinders | `peaky-blinders` | ink | 600×900 | 42KB | ✅ |
| 56 | تحت سابع أرض | Under Seven Grounds (Taht Sabeh Ard) | `taht-sabeh-ard` | noir | 600×900 | 45KB | ✅ |
| 57 | جريمة دلهي | Delhi Crime | `delhi-crime` | crimson | 600×900 | 37KB | ✅ |
| 58 | جعفر العمدة | Jaafar El Omda | `jaafar-el-omda` | crimson | 600×900 | 42KB | ✅ |
| 59 | حب أعمى | Kara Sevda | `kara-sevda` | crimson | 600×900 | 38KB | ✅ |
| 60 | حريم السلطان | Muhteşem Yüzyıl | `muhtesem-yuzyil` | rose | 600×900 | 43KB | ✅ |
| 61 | حين تهبك الحياة يوسفي | 폭싹 속았수다 (When Life Gives You Tangerines) | `when-life-gives-you-tangerines` | sand | 600×900 | 51KB | ✅ |
| 62 | دارك | Dark | `dark` | noir | 600×900 | 43KB | ✅ |
| 63 | ديرديفل: ولادة جديدة | Daredevil: Born Again | `daredevil-born-again` | ink | 600×900 | 45KB | ✅ |
| 64 | ذا بيت | The Pitt | `the-pitt` | sand | 600×900 | 48KB | ✅ |
| 65 | ذا لاست أوف أس | The Last of Us | `the-last-of-us` | noir | 600×900 | 50KB | ✅ |
| 66 | رجل العائلة | The Family Man | `the-family-man` | ink | 600×900 | 42KB | ✅ |
| 67 | رشاش | Rashash | `rashash` | noir | 600×900 | 45KB | ✅ |
| 68 | سكسيشن | Succession | `succession` | noir | 600×900 | 51KB | ✅ |
| 69 | شراب التوت | Kızılcık Şerbeti | `kizilcik-serbeti` | rose | 600×900 | 42KB | ✅ |
| 70 | شرلوك | Sherlock | `sherlock` | ink | 600×900 | 47KB | ✅ |
| 71 | شهرمان | Şahmaran | `sahmaran` | ink | 600×900 | 49KB | ✅ |
| 72 | شوغن | Shōgun | `shogun` | teal | 600×900 | 40KB | ✅ |
| 73 | صديقتي الرائعة | L'amica geniale (My Brilliant Friend) | `my-brilliant-friend` | ink | 600×900 | 43KB | ✅ |
| 74 | صراع العروش | Game of Thrones | `game-of-thrones` | teal | 600×900 | 47KB | ✅ |
| 75 | طائر الرفراف | Yalı Çapkını | `yali-capkini` | sand | 600×900 | 38KB | ✅ |
| 76 | عروس بيروت | Aroos Beirut (Bride of Beirut) | `aroos-beirut` | teal | 600×900 | 53KB | ✅ |
| 77 | عميل الليل | The Night Agent | `the-night-agent` | noir | 600×900 | 53KB | ✅ |
| 78 | فاطمة | Fatmagül'ün Suçu Ne? | `fatmagul` | sand | 600×900 | 56KB | ✅ |
| 79 | فتيات الكابل | Las chicas del cable (Cable Girls) | `cable-girls` | teal | 600×900 | 48KB | ✅ |
| 80 | فوضى | פאודה (Fauda) | `fauda` | crimson | 600×900 | 46KB | ✅ |
| 81 | فول أوت | Fallout | `fallout` | teal | 600×900 | 41KB | ✅ |
| 82 | فينتشنزو | 빈센조 (Vincenzo) | `vincenzo` | crimson | 600×900 | 41KB | ✅ |
| 83 | قلعة السماء | SKY 캐슬 (SKY Castle) | `sky-castle` | ink | 600×900 | 43KB | ✅ |
| 84 | قيامة أرطغرل | Diriliş: Ertuğrul | `dirilis-ertugrul` | teal | 600×900 | 42KB | ✅ |
| 85 | كلنا موتى | 지금 우리 학교는 (All of Us Are Dead) | `all-of-us-are-dead` | crimson | 600×900 | 54KB | ✅ |
| 86 | كيف تبيع المخدرات أونلاين | How to Sell Drugs Online (Fast) | `how-to-sell-drugs-online` | crimson | 600×900 | 46KB | ✅ |
| 87 | كيمياء الأرواح | 환혼 (Alchemy of Souls) | `alchemy-of-souls` | sand | 600×900 | 44KB | ✅ |
| 88 | لست غريبًا | Seni Tanıyorum (Not a Stranger) | `seni-taniyorum` | ink | 600×900 | 51KB | ✅ |
| 89 | لعبة الحبار | 오징어 게임 (Squid Game) | `squid-game` | crimson | 600×900 | 42KB | ✅ |
| 90 | لمكتوب | L'Maktoub | `l-maktoub` | sand | 600×900 | 49KB | ✅ |
| 91 | لوبين | Lupin | `lupin` | ink | 600×900 | 34KB | ✅ |
| 92 | لوفلي رانر | 선재 업고 튀어 (Lovely Runner) | `lovely-runner` | ink | 600×900 | 41KB | ✅ |
| 93 | ملكة الدموع | 눈물의 여왕 (Queen of Tears) | `queen-of-tears` | rose | 600×900 | 46KB | ✅ |
| 94 | موفينغ | 무빙 (Moving) | `moving` | ink | 600×900 | 38KB | ✅ |
| 95 | ناركوس | Narcos | `narcos` | crimson | 600×900 | 49KB | ✅ |
| 96 | هجوم العمالقة | 進撃の巨人 (Attack on Titan) | `attack-on-titan` | ink | 600×900 | 45KB | ✅ |
| 97 | هوم تاون تشا تشا تشا | 갯마을 차차차 (Hometown Cha-Cha-Cha) | `hometown-cha-cha-cha` | sand | 600×900 | 46KB | ✅ |
| 98 | ون بيس | One Piece | `one-piece` | sand | 600×900 | 49KB | ✅ |
| 99 | ونوس | Wanous | `wanous` | noir | 600×900 | 36KB | ✅ |
| 100 | وينزداي | Wednesday | `wednesday` | crimson | 600×900 | 52KB | ✅ |

## 8) ما يجب على المحرر فعله لاحقًا (خطة الاستبدال الآمن)

1. لكل مسلسل: تنزيل البوستر الرسمي من مصدر يملكه المشروع/يملك إذنًا (أو رابط رسمي مُرخّص قابل للتوثيق)، عمودي، ≥ 500px عرضًا، ≤ 200KB.
2. وضع الملف في `public/posters/<slug>.jpg` (نفس الاسم)، ثم حذف `posterDesign: true` وتحديث `posterAlt` إلى وصف المشهد الرسمي دون كلمة «تصميمي».
3. تشغيل: `node tools/series-covers-install.mjs --only=<slug> --verify` ثم `npm run test:posters` و`npm run build`، وفتح صفحة المسلسل للتأكد بصريًا.
4. تحديث `LEGAL.md` بسجل المصدر/الترخيص لكل صورة مستبدَلة.
