import Link from 'next/link';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { Breadcrumbs, SectionHeader, Notice } from '@/components/ui.jsx';

export const metadata = buildMetadata({
  title: 'سياسة الخصوصية',
  description: `كيف يتعامل ${siteConfig.siteName} مع بياناتك: لا تتبّع، لا حسابات، لا ملفات تعريف ارتباط إعلانية — وتخزين محلي للمفضلة على جهازك فقط.`,
  path: '/privacy/',
});

export const dynamic = 'force-static';
const UPDATED = '2026-10-03';

export default function PrivacyPage() {
  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: 'سياسة الخصوصية' }]} />
      <div className="mt-4">
        <SectionHeader as="h1" kicker="قانوني" title="سياسة الخصوصية" />
      </div>

      <div className="legal prose">
        <p className="updated">آخر تحديث: {UPDATED}</p>

        <Notice>
          <p className="small" style={{ marginBottom: 0 }}>
            هذه السياسة مكتوبة بلغة واضحة وبلا وعود لا يطابقها الواقع: لا حسابات، ولا تتبّع، ولا جمع لبياناتك.
          </p>
        </Notice>

        <h2>1) ما لا نجمعه</h2>
        <ul>
          <li>لا حسابات مستخدمين ولا كلمات مرور ولا بيانات تسجيل.</li>
          <li>لا ملفات تعريف ارتباط (Cookies) من طرفنا ولا أدوات تتبّع أو تحليلات (Analytics).</li>
          <li>لا نطلب اسمك أو بريدك إلا إذا راسلتنا أنت بنفسك عبر البريد.</li>
        </ul>

        <h2>2) ما يُخزَّن على جهازك</h2>
        <p>
          عند استخدام «المفضلة»، نحفظ قائمة معرّفات الأعمال في التخزين المحلي لمتصفحك (localStorage) تحت اسم
          <code> cinemana:favorites</code>. هذا التخزين:
        </p>
        <ul>
          <li>يبقى على جهازك ولا يُرسل إلينا ولا إلى أي جهة أخرى.</li>
          <li>لا ينتقل بين المتصفحات أو الأجهزة، ويُفقد إذا مسحت بيانات المتصفح.</li>
          <li>يمكنك حذفه في أي وقت من صفحة <Link href="/favorites/">المفضلة</Link> (زر «إفراغ القائمة»).</li>
        </ul>

        <h2>3) التضمين من منصات خارجية</h2>
        <p>
          في حال تضمين تريلر رسمي، يستخدم المشغّل نطاق <code>youtube-nocookie.com</code> لتقليل التتبّع قبل
          التشغيل، ولا يُحمَّل بالكامل إلا عند وصولك إليه في الصفحة (تحميل كسول). مشاهدتك للمقطع بعد ذلك تخضع
          لسياسة خصوصية المنصة الناشرة نفسها.
        </p>

        <h2>4) الاستضافة</h2>
        <p>
          يُستضاف الموقع على Vercel كنطاق ثابت. كمزوّد استضافة، قد يسجّل سجلات تقنية قصيرة الأمد (مثل عنوان IP
          لأغراض الأمن والأداء) وفق سياساته الخاصة. لا نربط هذه السجلات بأي ملف شخصي، ولا نستخدمها للتسويق.
        </p>

        <h2>5) الإعلانات</h2>
        <p>
          الموقع <strong>لا يعرض أي إعلانات</strong> ولا يحتوي أي كود إعلاني أو أدوات قياس إعلانية. إذا أُضيفت
          إعلانات في أي وقت، ستُحدَّث هذه السياسة أولًا، وسيُطلب منك موافقة صريحة على ملفات تعريف الارتباط
          الإعلانية قبل أي تفعيل.
        </p>

        <h2>6) التواصل</h2>
        <p>
          للاستفسارات المتعلقة بالخصوصية: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
        </p>

        <h2>7) تغييرات السياسة</h2>
        <p>تُحدَّث هذه السياسة عند أي تغيير يمس طريقة معالجة البيانات، وسيُذكر تاريخ التحديث أعلى الصفحة.</p>
      </div>
    </div>
  );
}
