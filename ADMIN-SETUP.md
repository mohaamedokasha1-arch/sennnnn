# لوحة تحكم أكاشا سينما — تشغيل آمن على Vercel

## السبب وراء خطأ 500 السابق

كان تحميل صفحات الموقع يستورد `lib/public-data.mjs` الذي كان يكتب `.data/akasha-db.json` فور تحميل الوحدة. نظام ملفات Vercel Functions غير دائم/غير صالح لتخزين حسابات المدير، فتفشل الصفحات كلها. الآن لا توجد كتابة أثناء القراءة، ويستمر عرض الأفلام والمسلسلات من ملفات `content/*.md` حتى إن تعطلت قاعدة البيانات.

## سبب رسالة «يلزم عنوان HTTPS» وكيف عولجت

كانت طبقة التخزين تقبل فقط روابط `https://` الخاصة بـ Upstash Redis REST. إذا لُصق رابط قاعدة PostgreSQL (Neon / Vercel Postgres) الذي يبدأ بـ `postgres://` أو `postgresql://` داخل `UPSTASH_REDIS_REST_URL` أو `KV_REST_API_URL`، ظهرت رسالة «رابط قاعدة البيانات غير صالح؛ يلزم عنوان HTTPS» الخاطئة.

الآن:

- **فحص ذكي مرن (Fallback Validation):** أي رابط يبدأ بـ `postgres://` أو `postgresql://` في أي من متغيرات قاعدة البيانات (بما فيها متغيرات Upstash/KV نفسها) يُعامل كمخزن PostgreSQL ويُفعَّل مباشرة، دون أي رسالة HTTPS.
- **SSL تلقائي:** إن لم يحدد الرابط وضع تشفير، يُضاف `sslmode=require` تلقائيًا لأي مضيف بعيد (بدلالات libpq: تشفير كامل دون فشل على شهادات Neon الوسيطة)، ويُحترم `sslmode=verify-full` إن حددته صراحة. محليًا (`localhost`) لا يُفرض TLS إلا إذا طلبته.
- **مزامنة سكيما تلقائية:** عند أول دخول إلى `/admin/setup/` (أو أي مسار إدارة) تُنشأ الجداول تلقائيًا عبر `CREATE TABLE IF NOT EXISTS` — لا حاجة لأي خطوة Migration يدوية.

## تشغيل الموقع العام

- `npm ci && npm test && npm run build`، وفي Vercel اجعل Framework = Next.js وBuild Command = `npm run build` (بدون `output: export` أو Output Directory مخصص).
- **لا يحتاج الموقع العام إلى متغيرات قاعدة بيانات**: نسخة Markdown الموجودة في المستودع تعرض الأفلام والأقسام وصفحات التفاصيل والبحث.
- إذا تعطلت القاعدة بعد الربط، تُستخدم نسخة Markdown المحفوظة، مع تنبيه واضح في صفحات الفهارس؛ أعمال لوحة التحكم التي لم تُضمّن في ملفات Markdown قد لا تظهر حتى يعود الاتصال.

## تفعيل لوحة التحكم في Vercel — الطريقة الموصى بها (PostgreSQL: Neon / Vercel Postgres)

1. أنشئ قاعدة على [Neon](https://neon.tech) (خطة مجانية تكفي) أو استخدم تكامل Vercel Postgres/Neon من Marketplace.
2. انسخ **رابط الاتصال الكامل** (Connection String) الذي يبدأ بـ `postgres://` أو `postgresql://` — يفضَّل رابط التجمع (Pooled) لبيئة السيرفرلس.
3. في Vercel → مشروعك → **Settings → Environment Variables** أضف المتغير:

   | Name (الاسم) | Value (القيمة) | Environments (البيئات) |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://user:password@ep-xxxx-123456.region.aws.neon.tech/neondb?sslmode=require` | Production (وPreview إن أردت بقاعدة منفصلة) |

   - `sslmode=require` اختياري في القيمة: يُضاف تلقائيًا إن غاب.
   - أسماء بديلة مقبولة تلقائيًا بالترتيب: `AKASHA_DATABASE_URL` ← `DATABASE_URL` ← `POSTGRES_URL` ← `POSTGRESQL_URL` ← `NEON_DATABASE_URL` ← `POSTGRES_URL_UNPOOLED` ← `POSTGRES_URL_NON_POOLING` ← `POSTGRES_PRISMA_URL` … يكفي ضبط أحدها.
   - إذا كان رابط postgres لا يزال ملصوقًا في `UPSTASH_REDIS_REST_URL` أو `KV_REST_API_URL` فلا مشكلة — يُعالَج تلقائيًا كمخزن PostgreSQL (ولا يلزم رمز Upstash). الأنظف حذف أي متغيرات Upstash قديمة غير مستخدمة.
4. اضغط **Redeploy** (إعادة النشر) — متغيرات البيئة لا تُطبَّق على النسخ المنشورة قبل إعادة النشر.
5. افتح `/admin/setup/`: تُزامَن السكيما تلقائيًا وتظهر عبارة «التخزين: PostgreSQL … تم الاتصال ومزامنة السكيما تلقائيًا ✓»، ثم أنشئ حساب المدير مرة واحدة وسجّل الدخول من `/admin/login/`.
6. لإجبار محرك PostgreSQL حتى مع بقاء إعداد Upstash سليمًا: أضف `AKASHA_STORAGE_MODE=postgres`. عند مشاركة القاعدة بين بيئات، خصص المفتاح بـ `AKASHA_PG_KEY` (الافتراضي `akasha:db:v1`).

**ماذا يحدث داخل قاعدة PostgreSQL؟** جدول واحد للمستند `akasha_storage (key, value JSONB, updated_at)` وجدول تتبّع `akasha_schema_migrations`. كل التعديلات ذرّية بمعاملة CAS (قفل استشاري + `SELECT … FOR UPDATE` ومقارنة SHA-1) بنفس دلالات طبقة Redis، فلا يُنشئ طلبان متزامنان مديرين اثنين مهما تعددت نسخ السيرفرلس.

## تفعيل لوحة التحكم عبر Upstash Redis (بديل)

1. اربط **Upstash Redis** (REST) من Vercel Marketplace بمشروعك أو استخدم خدمة Redis متوافقة مع Upstash REST.
2. اضبط **كلا** المتغيرين في Vercel → Project → Settings → Environment Variables:
   - `UPSTASH_REDIS_REST_URL` (عنوان HTTPS من التكامل)
   - `UPSTASH_REDIS_REST_TOKEN` (رمز سري من التكامل؛ لا تنسخه إلى المستودع)
   تدعم النسخة أيضًا زوج الأسماء القديم `KV_REST_API_URL` و`KV_REST_API_TOKEN`.
3. عيّن القيم لبيئة **Production** ثم أعد نشر الإصدار. استخدم قاعدة منفصلة لبيئة Preview، أو عيّن `AKASHA_REDIS_KEY` مختلفًا لكل بيئة. لا تشارك حساب المدير الإنتاجي مع المعاينات.
4. افتح `/admin/setup/` وأنشئ حساب المدير مرة واحدة، ثم ادخل عبر `/admin/login/`.

ملاحظة الأولوية: إذا وُجد إعداد Upstash **سليم** (https + رمز) مع إعداد PostgreSQL معًا، يُختار Upstash تلقائيًا حفاظًا على استمرارية بيانات الإدارة القائمة؛ لتفضيل PostgreSQL اضبط `AKASHA_STORAGE_MODE=postgres`.

## بدون مخزن دائم على Vercel

تعرض `/admin/setup/` رسالة شرح بدل 500 ولا تسمح بتسجيل مدير مؤقت سيختفي بين الطلبات؛ تستجيب واجهات الإدارة والمصادقة بـ JSON يوضح السبب ورمز HTTP `503`. صفحات الموقع العامة تبقى متاحة. لا يوجد بديل آمن (أو افتراضي) لكلمة مرور أو رمز وصول قاعدة البيانات.

## التطوير المحلي / خادم Node بقرص دائم

```bash
npm ci
npm run dev
# افتح http://localhost:3000/admin/setup/
```

يُستخدم الملف المحلي `.data/akasha-db.json` (متجاهَل بواسطة Git) تلقائيًا إذا لم توجد إعدادات سحابية. يمكن اختيار مجلد آخر بواسطة `AKASHA_DATA_DIR` (قرص دائم فقط). أول قراءة لا تكتب أي ملفات؛ أول عملية إنشاء/تعديل تحفظ نسخة Markdown مع بيانات المدير. لا تُنشأ القاعدة تلقائيًا فوق ملف تالف: تظهر رسالة تصحيح ويجب استعادة نسخة احتياطية. لا تنقل هذا الملف إلى Vercel ولا تعتمد على `/tmp` لحساب المدير.

لتجربة وضع PostgreSQL محليًا، ضع رابط اتصالك في `.env.local` تحت `DATABASE_URL` (قاعدة Neon أو أي Postgres محلي/على Docker).

## الأمان والتشغيل

- كلمات المرور مجزأة بـ bcrypt؛ الجلسات رموز عشوائية في المخزن مع كوكي `httpOnly` و`secure` في الإنتاج.
- الإعداد الأول محمي بقفل محلي أو مقارنة وكتابة ذرّية (CAS) في PostgreSQL/Redis حتى لا ينشئ طلبان متزامنان حسابَي مدير.
- رابط الاتصال وبيانات الاعتماد لا تُطبع في السجلات إطلاقًا؛ رسائل الأخطاء عامة وموجهة للإصلاح (اتصال/اعتمادات/قاعدة غير موجودة).
- جميع واجهات `/api/admin/*` تتطلب مصادقة؛ حتى قوائم الأفلام والمسلسلات والمسودات ونسخ الفيلم محمية.
- لا يوجد رمز جلسة ثابت؛ `AKASHA_SESSION_SECRET` القديم لم يكن مستخدمًا وليس شرطًا للتشغيل.
- احمِ القاعدة بنسخ احتياطية وصلاحيات الوصول؛ الـ rate limit المحلي لمحاولات الدخول ليس حماية موزعة بين كل وظائف Vercel.
- روابط التضمين تُفحص في الخادم ولا تُجلب روابط عشوائية منه.
