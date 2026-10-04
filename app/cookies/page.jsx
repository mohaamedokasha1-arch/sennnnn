import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { Breadcrumbs, SectionHeader, Notice } from '@/components/ui.jsx';

export const metadata = buildMetadata({
  title: 'سياسة ملفات تعريف الارتباط',
  description: `سياسة ملفات تعريف الارتباط في ${siteConfig.siteName}: لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبّع؛ التخزين المحلي للمفضلة ليس ملف ارتباط ولا يُرسل لأي جهة.`,
  path: '/cookies/',
});

export const dynamic = 'force-static';
const UPDATED = '2026-10-03';

export default function CookiesPage() {
  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: 'ملفات تعريف الارتباط' }]} />
      <div className="mt-4">
        <SectionHeader kicker="قانوني" title="سياسة ملفات تعريف الارتباط" />
      </div>

      <div className="legal prose">
        <p className="updated">آخر تحديث: {UPDATED}</p>

        <Notice>
          <p className="small" style={{ marginBottom: 0 }}>
            الخلاصة المختصرة: لا نستخدم ملفات تعريف ارتباط إعلانية ولا تتبّع، ولا توجد لافتة موافقة لأننا لا
            نحتاج واحدة.
          </p>
        </Notice>

        <h2>ما هي ملفات تعريف الارتباط؟</h2>
        <p>
          ملفات صغيرة يخزّنها متصفحك عند زيارة موقع، وتُرسل عادةً مع كل طلب إلى الخادم. أما «التخزين المحلي»
          (localStorage) فهو أشبه بخزانة صغيرة داخل متصفحك لا تُرسل تلقائيًا لأي خادم.
        </p>

        <h2>ماذا نستخدم فعليًا؟</h2>
        <ul>
          <li>
            <strong>تخزين محلي واحد</strong> باسم <code>cinemana:favorites</code> لحفظ قائمة المفضلة على جهازك.
            لا يُرسل إلينا، ولا يُشارك مع أي جهة.
          </li>
          <li>
            <strong>لا ملفات تعريف ارتباط من طرفنا</strong> ولا تخزين إعلاني أو تحليلي.
          </li>
          <li>
            <strong>الاستضافة (Vercel)</strong> قد تستخدم ملفات تعريف ارتباط تقنية وضرورية لحماية الطلبات من
            الهجمات وتحسين الأداء وفق سياساتها.
          </li>
          <li>
            <strong>مشغّل التريلر</strong> قد يضع ملفات تعريف ارتباط عند تشغيل الفيديو من المنصة الناشرة،
            ولذلك نستخدم نطاق <code>youtube-nocookie.com</code> لتقليل ذلك قبل التشغيل.
          </li>
        </ul>

        <h2>كيف تتحكم بها؟</h2>
        <p>
          يمكنك حذف التخزين المحلي في أي وقت من صفحة <Link href="/favorites/">المفضلة</Link> (زر «إفراغ
          القائمة»)، أو من إعدادات متصفحك (مسح بيانات الموقع). حذف هذا التخزين لا يؤثر على تصفح الموقع.
        </p>

        <h2>الإعلانات</h2>
        <p>
          الموقع لا يعرض أي إعلانات. إذا أُضيفت شبكة إعلانية في أي وقت، فسنحدّث هذه الصفحة وسياسة{' '}
          <Link href="/privacy/">الخصوصية</Link>، ونضيف آلية موافقة واضحة قبل تشغيل أي إعلان أو أداة قياس.
        </p>
      </div>
    </div>
  );
}
