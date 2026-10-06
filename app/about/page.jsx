import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { siteStats } from '@/lib/content.mjs';
import { Breadcrumbs, SectionHeader, Stat } from '@/components/ui.jsx';

export const metadata = buildMetadata({
  title: 'من نحن',
  description: `تعرّف على ${siteConfig.siteName}: منصة عربية لاكتشاف الأفلام والمسلسلات — معلومات منظّمة ومراجعات أصلية، بدون استضافة محتوى وبدون روابط غير رسمية.`,
  path: '/about/',
});

export const dynamic = 'force-static';

export default function AboutPage() {
  const stats = siteStats();

  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: 'من نحن' }]} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="تعرّف علينا" title={`من نحن — ${siteConfig.siteName}`} sub={siteConfig.slogan} />
      </div>

      <div className="legal prose">
        <h2>ما هي {siteConfig.siteName}؟</h2>
        <p>
          {siteConfig.siteName} منصة عربية لاكتشاف الأفلام والمسلسلات. هدفها مساعدتك على الوصول إلى العمل المناسب
          بسرعة: قصة واضحة، تصنيفات، طاقم عمل، ومراجعات تحريرية عند نشرها، وروابط رسمية للمشاهدة عند توفرها. نحن
          <strong> لسنا موقع مشاهدة أو تحميل</strong>، ولا نستضيف أي فيلم أو حلقة على خوادمنا.
        </p>

        <h2>ما الذي نمتنع عنه عمدًا؟</h2>
        <ul>
          <li>لا نستضيف أفلامًا أو مسلسلات، ولا نوفر روابط تحميل أو مشاهدة غير رسمية.</li>
          <li>لا ننشر تقييمات أو أعداد مشاهدات أو إحصاءات لم نتحقق منها فعليًا.</li>
          <li>لا ننسخ مقالات أو مراجعات أو صورًا محمية بحقوق نشر.</li>
          <li>لا نضمّن تريلرات إلا إذا كانت رسمية ومسموحًا بتضمينها من القناة الناشرة.</li>
          <li>لا نستخدم أي واجهة برمجية (API) خارجية لجلب بيانات الأفلام أو الصور أو التقييمات.</li>
        </ul>

        <h2>كيف تُبنى المكتبة؟</h2>
        <p>
          تُضاف كل الأعمال يدويًا في ملفات محتوى داخل المشروع، وتُراجع قبل النشر. البناء يتحقق من صحة البيانات
          ويرفض النشر عند وجود حقل إلزامي ناقص أو معرّف مكرر أو رابط مشاهدة على نطاق غير معتمد.
        </p>

        <div className="stat-row mt-4">
          <Stat value={stats.works} label="عمل منشور" />
          <Stat value={stats.reviews} label="مراجعة تحريرية" />
          <Stat value={stats.lists} label="قائمة ترشيحات" />
          <Stat value={stats.people} label="شخص في الدليل" />
        </div>

        <h2>ما هو متاح الآن</h2>
        <p>
          تصفّح المكتبة كاملة، وابحث بالعربية أو بالاسم الأصلي، واحفظ ما تحب في قائمة <Link href="/favorites/">المفضلة</Link>{' '}
          على جهازك. لا تسجيل مستخدمين ولا تعليقات ولا تقييمات مستخدمين. يمكنك معرفة المزيد في{' '}
          <Link href="/privacy/">سياسة الخصوصية</Link>.
        </p>

        <h2>تواصل معنا</h2>
        <p>
          للاستفسارات: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> — أو استخدم{' '}
          <Link href="/contact/">صفحة اتصل بنا</Link>. لطلبات حقوق الملكية، اقرأ{' '}
          <Link href="/ip-rights/">صفحة حقوق الملكية وإزالة المحتوى</Link>.
        </p>
      </div>
    </div>
  );
}
