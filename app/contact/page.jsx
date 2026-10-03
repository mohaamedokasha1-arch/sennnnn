import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';
import { buildMetadata } from '@/lib/seo.mjs';
import { Breadcrumbs, SectionHeader, Notice } from '@/components/ui.jsx';
import ContactForm from '@/components/ContactForm.jsx';

export const metadata = buildMetadata({
  title: 'اتصل بنا',
  description: `طرق التواصل مع فريق ${siteConfig.siteName}: بريد عام للاستفسارات، وبريد مخصص لطلبات حقوق الملكية وإزالة المحتوى.`,
  path: '/contact/',
});

export const dynamic = 'force-static';

export default function ContactPage() {
  return (
    <div className="container">
      <Breadcrumbs items={[{ name: t('nav.home'), url: '/' }, { name: 'اتصل بنا' }]} />
      <div className="mt-4">
        <SectionHeader kicker="تواصل" title="اتصل بنا" sub="نقرأ كل رسالة، ويصل الرد عادةً عبر البريد الإلكتروني." />
      </div>

      <div className="two-col">
        <div className="legal prose">
          <h2>البريد الإلكتروني</h2>
          <p>
            للاستفسارات العامة والمقترحات: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          </p>
          <p>
            لطلبات حقوق الملكية وإزالة المحتوى:{' '}
            <a href={`mailto:${siteConfig.contact.copyrightEmail}`}>{siteConfig.contact.copyrightEmail}</a>
          </p>

          <h2>كيف نتعامل مع رسائلك؟</h2>
          <ul>
            <li>رسائل حقوق الملكية لها الأولوية، ونستهدف الرد خلال أيام قليلة.</li>
            <li>إذا كان الطلب متعلقًا برابط مشاهدة غير رسمي، نراجعه ونحذفه فورًا عند التأكد.</li>
            <li>لا نطلب أي بيانات شخصية حساسة، ولا نحتفظ بالرسائل في أي قاعدة بيانات.</li>
          </ul>

          <Notice>
            <p className="small" style={{ marginBottom: 0 }}>
              نموذج التواصل أدناه لا يرسل رسالة إلى خادم: يجهّز الرسالة ويفتح برنامج البريد على جهازك. هذا هو
              الخيار المتوافق مع موقع ثابت بلا قاعدة بيانات ولا خدمات خارجية. لو رغبت لاحقًا في استقبال الرسائل
              مباشرة من الموقع، سيلزم ربط خدمة نماذج خارجية — وهذا قرار يحتاج موافقة صريحة من صاحب المشروع.
            </p>
          </Notice>
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
