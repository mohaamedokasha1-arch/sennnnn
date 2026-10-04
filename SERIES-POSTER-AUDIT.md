# تدقيق بوسترات المسلسلات — Cinemana

تاريخ الفحص: 2026-10-04  
مصدر البيانات: ملفات Markdown في `content/series/`، ملفات الصور المحلية في `public/posters/`، ومخرجات Static Export.

## النتيجة الحالية

| البند | العدد |
|---|---:|
| المسلسلات المنشورة التي فُحصت | **100** |
| حقول بوستر كانت فارغة أو تشير لملف مفقود | **0** |
| الصور المحلية المفحوصة التي كانت صورًا فنية غير رسمية/غير موثقة بدل بوستر العمل | **100** |
| بوسترات مرخّصة/موثوقة ثبت حق استخدامها من بيانات المشروع | **0** |
| صور فنية أُزيلت من الربط وعُوّضت ببديل واضح يحمل اسم العمل | **100** |
| مسلسلات تستخدم بديلًا مؤقتًا | **100** |
| مسارات صور مكسورة بعد التعديل | **0** |

كانت ملفات الصور المئة القديمة موجودة وقابلة للقراءة محليًا بصيغة JPEG وأبعاد 600×900؛ وفحصها الاسمي/البصري كشف أنها أغلفة تجريدية مولّدة بأداة المشروع وليست بوسترات الأعمال. كذلك كانت النصوص البديلة نفسها تنص على أن «البوستر الرسمي يحتاج ترخيصًا». لذلك لم تُعامل على أنها بوسترات صحيحة أو مرخّصة. لا يوجد في المشروع سجل ترخيص أو مصدر يسمح بإعادة نشر بوسترات أصحاب الحقوق، ولم أُنزّل صورًا عشوائية أو صورًا رسمية غير مصرّح بها.

بدلًا منها: أصبح حقل `poster` فارغًا عمدًا لكل سجل غير موثّق، وأُضيف `posterTemporary: true`. الواجهة تعرض بطاقة محايدة باسم المسلسل وسنة العرض مع تنبيه ظاهر «صورة مؤقتة — ليست البوستر الرسمي». الملفات الفنية القديمة تُركت دون تغيير لتجنّب حذف أصول موجودة، لكنها لم تعد مرتبطة بسجلات المسلسلات أو معروضة في الموقع أو في نتائج البحث أو بيانات SEO.

## الإصلاحات التقنية

- إضافة مكوّن موحّد `components/PosterImage.jsx` لمواضع عرض البوستر. عند غياب المسار أو فشل التحميل في المتصفح بعد النشر، يستبدل الصورة فورًا ببطاقة عنوان مؤقتة بدل الأيقونة المكسورة/المساحة الفارغة.
- توحيد استخدامه في الصفحة الرئيسية، بطاقات الشبكات، صفحة المسلسلات، تفاصيل العمل، البحث الفوري ونتائج البحث، والعناصر المصغرة في القوائم.
- منع عرض البوسترات المؤقتة في فهرس البحث، Open Graph وبيانات JSON-LD.
- الموقع Static Export ويستخدم `<img>` محليًا مع `images.unoptimized`; لا يستخدم `next/image` في البوسترات ولا روابط صور خارجية، لذلك لا توجد مشكلة CORS أو قائمة نطاقات صور خارجية وراء الحالات الحالية.
- أضيفت قواعد تحقق تمنع وسم صورة بأنها مؤقتة مع إبقاء مسار صورة غير موثقة في حقل `poster`، وتتحقق من أن التنبيه يصرّح بأنها مؤقتة وغير رسمية.
- أُضيف تدقيق بعد البناء يمر على كل صفحة تفاصيل مسلسل ويختبر قائمة المسلسلات وفهرس البحث.

## الاختبار

- `npm test`: ناجح — التحقق من المحتوى واختبارات المحتوى والمنطق و100 سجل مسلسل.
- `npm run build`: ناجح — 562 صفحة ثابتة و100 صفحة تفاصيل مسلسل.
- تدقيق التصدير: نجح لكل صفحة تفاصيل، وقائمة `/series/`، وفهرس `/search-index.json`: تظهر البدائل الموسومة ولا تتسرب روابط الأغلفة غير الرسمية.
- تم الحفاظ على أبعاد البطاقات وترتيبها وألوانها وخطوطها وسلوك الفلاتر والبحث. لم تتغير بيانات الأفلام أو الأشخاص.

## المسلسلات التي ما زالت تحتاج بوسترًا موثوقًا/مرخّصًا

كل المسلسلات الحالية تستخدم البديل المؤقت إلى حين إتاحة صورة موثوقة مع إذن استخدام. القائمة الكاملة:

| # | الاسم في Cinemana | الاسم الأصلي | المعرّف |
|---:|---|---|---|
| 1 | المراهقة | Adolescence | `adolescence` |
| 2 | العميل | Al Ameer (The Agent) | `al-ameel` |
| 3 | العتاولة | Al Atawla | `al-atawla` |
| 4 | الاختيار | Al Ekhtiyar (The Choice) | `al-ekhtiyar` |
| 5 | الحشاشين | Al Hashashin | `al-hashashin` |
| 6 | الهيبة | Al Hayba | `al-hayba` |
| 7 | الكبير أوي | Al Kabeer Awi | `al-kabeer-awy` |
| 8 | المداح | Al Maddah | `al-maddah` |
| 9 | الزند: ذئب العاصي | Al Zand: Dheeb Al Aasi | `al-zand` |
| 10 | كيمياء الأرواح | 환혼 (Alchemy of Souls) | `alchemy-of-souls` |
| 11 | أليس في بلاد الحدود | 今際の国のアリス (Alice in Borderland) | `alice-in-borderland` |
| 12 | كلنا موتى | 지금 우리 학교는 (All of Us Are Dead) | `all-of-us-are-dead` |
| 13 | عروس بيروت | Aroos Beirut (Bride of Beirut) | `aroos-beirut` |
| 14 | العشق الممنوع | Aşk-ı Memnu | `ask-i-memnu` |
| 15 | هجوم العمالقة | 進撃の巨人 (Attack on Titan) | `attack-on-titan` |
| 16 | أفاتار: آخر مسخّر هواء | Avatar: The Last Airbender | `avatar-the-last-airbender` |
| 17 | برلين | Berlín (Berlin) | `berlin` |
| 18 | المرآة السوداء | Black Mirror | `black-mirror` |
| 19 | بورغن | Borgen | `borgen` |
| 20 | بريكنغ باد | Breaking Bad | `breaking-bad` |
| 21 | بريدجرتون | Bridgerton | `bridgerton` |
| 22 | فتيات الكابل | Las chicas del cable (Cable Girls) | `cable-girls` |
| 23 | اتصل بوكيلي | Dix pour cent (Call My Agent!) | `call-my-agent` |
| 24 | الهبوط الاضطراري للحب | 사랑의 불시착 (Crash Landing on You) | `crash-landing-on-you` |
| 25 | الحفرة | Çukur | `cukur` |
| 26 | ديرديفل: ولادة جديدة | Daredevil: Born Again | `daredevil-born-again` |
| 27 | دارك | Dark | `dark` |
| 28 | جريمة دلهي | Delhi Crime | `delhi-crime` |
| 29 | أحفاد الشمس | 태양의 후예 (Descendants of the Sun) | `descendants-of-the-sun` |
| 30 | قيامة أرطغرل | Diriliş: Ertuğrul | `dirilis-ertugrul` |
| 31 | النخبة | Élite (Elite) | `elite` |
| 32 | الطائر المبكر | Erkenci Kuş | `erkenci-kus` |
| 33 | المحامية الاستثنائية وو | 이상한 변호사 우영우 (Extraordinary Attorney Woo) | `extraordinary-attorney-woo` |
| 34 | إيزيل | Ezel | `ezel` |
| 35 | فول أوت | Fallout | `fallout` |
| 36 | فاطمة | Fatmagül'ün Suçu Ne? | `fatmagul` |
| 37 | فوضى | פאודה (Fauda) | `fauda` |
| 38 | الحب الأول | First Love 初恋 | `first-love` |
| 39 | صراع العروش | Game of Thrones | `game-of-thrones` |
| 40 | العفريت | 도깨비 (Guardian: The Lonely and Great God) | `goblin` |
| 41 | هوم تاون تشا تشا تشا | 갯마을 차차차 (Hometown Cha-Cha-Cha) | `hometown-cha-cha-cha` |
| 42 | آل التنين | House of the Dragon | `house-of-the-dragon` |
| 43 | كيف تبيع المخدرات أونلاين | How to Sell Drugs Online (Fast) | `how-to-sell-drugs-online` |
| 44 | إتايون كلاس | 이태원 클라쓰 (Itaewon Class) | `itaewon-class` |
| 45 | جعفر العمدة | Jaafar El Omda | `jaafar-el-omda` |
| 46 | المال الأسود والعشق | Kara Para Aşk | `kara-para-ask` |
| 47 | حب أعمى | Kara Sevda | `kara-sevda` |
| 48 | المملكة | 킹덤 (Kingdom) | `kingdom` |
| 49 | شراب التوت | Kızılcık Şerbeti | `kizilcik-serbeti` |
| 50 | النادي | Kulüp (The Club) | `kulup` |
| 51 | المؤسس عثمان | Kuruluş: Osman | `kurulus-osman` |
| 52 | لمكتوب | L'Maktoub | `l-maktoub` |
| 53 | لوفلي رانر | 선재 업고 튀어 (Lovely Runner) | `lovely-runner` |
| 54 | لوبين | Lupin | `lupin` |
| 55 | بيت من ورق | La casa de papel (Money Heist) | `money-heist` |
| 56 | موفينغ | 무빙 (Moving) | `moving` |
| 57 | الطبيب المعجزة | Mucize Doktor | `mucize-doktor` |
| 58 | حريم السلطان | Muhteşem Yüzyıl | `muhtesem-yuzyil` |
| 59 | صديقتي الرائعة | L'amica geniale (My Brilliant Friend) | `my-brilliant-friend` |
| 60 | ناركوس | Narcos | `narcos` |
| 61 | ون بيس | One Piece | `one-piece` |
| 62 | أوزارك | Ozark | `ozark` |
| 63 | بانتشايات | पंचायत (Panchayat) | `panchayat` |
| 64 | بيكي بلايندرز | Peaky Blinders | `peaky-blinders` |
| 65 | بيرسي جاكسون والآلهة الأولمبية | Percy Jackson and the Olympians | `percy-jackson-and-the-olympians` |
| 66 | ملكة الدموع | 눈물의 여왕 (Queen of Tears) | `queen-of-tears` |
| 67 | رشاش | Rashash | `rashash` |
| 68 | ألعاب مقدسة | सेक्रेड गेम्स (Sacred Games) | `sacred-games` |
| 69 | شهرمان | Şahmaran | `sahmaran` |
| 70 | أنت اطرق بابي | Sen Çal Kapımı | `sen-cal-kapimi` |
| 71 | لست غريبًا | Seni Tanıyorum (Not a Stranger) | `seni-taniyorum` |
| 72 | الانفصال | Severance | `severance` |
| 73 | شرلوك | Sherlock | `sherlock` |
| 74 | شوغن | Shōgun | `shogun` |
| 75 | قلعة السماء | SKY 캐슬 (SKY Castle) | `sky-castle` |
| 76 | الخيول البطيئة | Slow Horses | `slow-horses` |
| 77 | لعبة الحبار | 오징어 게임 (Squid Game) | `squid-game` |
| 78 | أشياء غريبة | Stranger Things | `stranger-things` |
| 79 | سكسيشن | Succession | `succession` |
| 80 | البيت الحلو | 스위트홈 (Sweet Home) | `sweet-home` |
| 81 | تحت سابع أرض | Under Seven Grounds (Taht Sabeh Ard) | `taht-sabeh-ard` |
| 82 | الدب | The Bear | `the-bear` |
| 83 | الفتيان | The Boys | `the-boys` |
| 84 | رجل العائلة | The Family Man | `the-family-man` |
| 85 | السادة | The Gentlemen | `the-gentlemen` |
| 86 | المجد | 더 글로리 (The Glory) | `the-glory` |
| 87 | ذا لاست أوف أس | The Last of Us | `the-last-of-us` |
| 88 | عميل الليل | The Night Agent | `the-night-agent` |
| 89 | ذا بيت | The Pitt | `the-pitt` |
| 90 | اللوتس الأبيض | The White Lotus | `the-white-lotus` |
| 91 | الساحر | The Witcher | `the-witcher` |
| 92 | أم هارون | Umm Haroun | `umm-haroun` |
| 93 | المدينة البعيدة | Uzak Şehir | `uzak-sehir` |
| 94 | فينتشنزو | 빈센조 (Vincenzo) | `vincenzo` |
| 95 | ونوس | Wanous | `wanous` |
| 96 | البطل الضعيف | 약한영웅 (Weak Hero Class) | `weak-hero` |
| 97 | وينزداي | Wednesday | `wednesday` |
| 98 | حين تهبك الحياة يوسفي | 폭싹 속았수다 (When Life Gives You Tangerines) | `when-life-gives-you-tangerines` |
| 99 | طائر الرفراف | Yalı Çapkını | `yali-capkini` |
| 100 | الحكم | Yargı | `yargi` |

## حالة النشر على Vercel

هذه النسخة اجتازت التحقق والبناء المحليين. لم يُنشر هذا التعديل على نطاق الإنتاج تلقائيًا من داخل هذا التقرير؛ يلزم نشر/دمج الفرع أولًا ثم إعادة فحص طلبات الصور على Vercel. لا أدّعي نجاح اختبار الإنتاج قبل اكتمال ذلك.
