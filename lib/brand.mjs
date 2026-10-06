/**
 * ============================================================================
 *  تمركز توطين الهوية (الاسم والشعار) — «أكاشا سينما / Akasha Cinema»
 * ============================================================================
 *  كل ما يخص اسم الموقع وشعاره حسب اللغة النشطة يُقرأ من هنا فقط،
 *  والقيم نفسها تعيش في site.config.mjs (مصدر الحقيقة الوحيد).
 *
 *  - العربية (ar): «أكاشا سينما» — محاذاة RTL.
 *  - الإنجليزية (en): «Akasha Cinema» — محاذاة LTR.
 *
 *  تُحدَّد اللغة النشطة من بادئة المسار (/en/ = إنجليزية) — نفس اصطراب
 *  الصفحات الإنجليزية الموجودة في app/en/، دون أي تغيير في التصميم أو الوظائف.
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';

/** اللغات المدعومة للهوية */
export const BRAND_LOCALES = ['ar', 'en'];

export const isBrandLocale = (locale) => BRAND_LOCALES.includes(locale);

/** اللغة النشطة من مسار الصفحة: /en/… ⇒ en وإلا اللغة الأساسية للموقع */
export const localeFromPath = (pathname, fallback = siteConfig.locale || 'ar') =>
  pathname === '/en' || pathname?.startsWith('/en/') || pathname?.startsWith('/en?') ? 'en' : fallback;

/** اسم الموقع الظاهر حسب اللغة */
export const brandName = (locale = 'ar') => {
  const byLocale = siteConfig.nameByLocale || {};
  if (byLocale[locale]) return byLocale[locale];
  return locale === 'en' ? siteConfig.siteNameLatin : siteConfig.siteName;
};

/** اتجاه الكتابة الخاص بالهوية حسب اللغة (لتوسيم الشعار والاسم) */
export const brandDir = (locale = 'ar') => (locale === 'en' ? 'ltr' : 'rtl');

/** الاسم بالنسخة الأخرى (يظهر كسطر ثانٍ بجانب الشعار لضمان الاتساق البصري) */
export const brandAltName = (locale = 'ar') => brandName(locale === 'en' ? 'ar' : 'en');

/** مسار ملف الشعار الكامل المناسب للاتجاه (RTL للعربية وLTR للإنجليزية) */
export const brandLogoUrl = (locale = 'ar') => {
  const logo = siteConfig.logo || {};
  return logo[locale] || logo.ar || null;
};

/** مسار علامة الشعار الموحّدة (نفس العلامة في اللغتين) */
export const brandMarkUrl = () => siteConfig.logo?.mark || null;

/** وصف الشعار لقارئات الشاشة حسب اللغة */
export const brandLogoAlt = (locale = 'ar') =>
  locale === 'en' ? 'Akasha Cinema — home' : 'أكاشا سينما — الصفحة الرئيسية';
