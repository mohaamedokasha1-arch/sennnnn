'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import siteConfig from '@/site.config.mjs';
import { brandName, brandAltName, brandDir, localeFromPath, brandLogoAlt } from '@/lib/brand.mjs';
import { LogoGlyph } from './Logo.jsx';

/**
 * اللغة النشطة للهوية من المسار: صفحات /en/… تعرض الهوية الإنجليزية (LTR)
 * وباقي الصفحات تعرض الهوية العربية (RTL). يُحسب وقت التوليد الثابت لكل صفحة
 * (usePathname يعمل أثناء التصدير الثابت) فلا يحدث أي وميض عند التحميل.
 */
export function useBrandLocale() {
  const pathname = usePathname();
  return localeFromPath(pathname);
}

/**
 * كتلة الشعار (العلامة + الاسم النصي) بنفس بنية التصميم الحالية تمامًا:
 * .brand > (.brand-mark | img) + .brand-text — لا تُضيف أي CSS جديد؛
 * التكيّف مع الاتجاه يأتي من flex الذي يتبع dir الصفحة،
 * والاسم يتبدل ديناميكيًا: «أكاشا سينما» ⇄ «Akasha Cinema».
 */
export function BrandBlock({ linked = false, style = undefined }) {
  const locale = useBrandLocale();
  const name = brandName(locale);

  const inner = (
    <>
      {siteConfig.logoImage ? (
        <img src={siteConfig.logoImage} alt={name} width={38} height={38} />
      ) : (
        <span className="brand-mark" aria-hidden="true">
          <LogoGlyph size={22} />
        </span>
      )}
      <span className="brand-text">
        <span className="brand-name" lang={locale === 'en' ? 'en' : 'ar'} dir={brandDir(locale)}>
          {name}
        </span>
        {/* السطر الثاني يعرض الاسم بالنسخة الأخرى في الواجهة العربية (كما سابقًا)؛
            يُترك فارغًا في الإنجليزية حتى لا تُفصَّل حروف العربية بتباعد الأحرف. */}
        {locale === 'ar' ? <span className="brand-latin">{brandAltName(locale)}</span> : null}
      </span>
    </>
  );

  if (linked) {
    return (
      <Link href="/" className="brand" aria-label={brandLogoAlt(locale)} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className="brand" style={style}>
      {inner}
    </div>
  );
}

/** الاسم المحلي وحده (سطر الحقوق في التذييل مثلًا) */
export function BrandName() {
  const locale = useBrandLocale();
  return (
    <span lang={locale === 'en' ? 'en' : 'ar'} dir={brandDir(locale)}>
      {brandName(locale)}
    </span>
  );
}
