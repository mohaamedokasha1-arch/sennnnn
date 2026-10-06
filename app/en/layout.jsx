import { brandName } from '@/lib/brand.mjs';
import { seoTitle } from '@/lib/seo.mjs';

/**
 * تخطيط القسم الإنجليزي — بيانات وصفية (SEO) فقط، بلا أي تغيير في DOM أو التصميم:
 * يجعل عناوين الصفحات الإنجليزية ووسوم المشاركة تحمل الاسم الإنجليزي
 * «Akasha Cenima» بدل الاسم العربي، بينما يبقى الجذر عربيًا (RTL).
 * إعادة `children` كما هي لا تُنتج أي عنصر إضافي في الصفحة.
 */
const enName = brandName('en');

export const metadata = {
  title: {
    default: seoTitle('Discover movies, series and editorial reviews', 'en', '/en/'),
    template: `%s | ${enName}`,
  },
  applicationName: enName,
  other: { language: 'en' },
  openGraph: {
    siteName: enName,
  },
};

export default function EnglishSectionLayout({ children }) {
  return children;
}
