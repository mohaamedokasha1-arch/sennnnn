/**
 * ============================================================================
 *  Centralized bilingual brand configuration and locale helpers.
 *  site.config.mjs remains the single source of truth for the actual names.
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';

const names = siteConfig.nameByLocale || {};
const shortNames = siteConfig.shortNameByLocale || {};

/** Public brand configuration used by UI copy, metadata, manifests, and assets. */
export const brandConfig = Object.freeze({
  ar: Object.freeze({
    name: names.ar || siteConfig.siteName,
    displayName: names.ar || siteConfig.siteName,
    direction: 'rtl',
    shortName: shortNames.ar || names.ar || siteConfig.siteName,
    tagline: siteConfig.slogan,
  }),
  en: Object.freeze({
    name: names.en || siteConfig.siteNameLatin || siteConfig.siteName,
    displayName: names.en || siteConfig.siteNameLatin || siteConfig.siteName,
    direction: 'ltr',
    shortName: shortNames.en || names.en || siteConfig.siteNameLatin || siteConfig.siteName,
    tagline: siteConfig.sloganEn || siteConfig.slogan,
  }),
});

/** Supported brand locales. */
export const BRAND_LOCALES = Object.freeze(Object.keys(brandConfig));

export const isBrandLocale = (locale) => Object.hasOwn(brandConfig, locale);

/** `/en/…` is the English section; all other current routes use Arabic. */
export const localeFromPath = (pathname, fallback = siteConfig.locale || 'ar') =>
  pathname === '/en' || pathname?.startsWith('/en/') || pathname?.startsWith('/en?') ? 'en' : fallback;

/** Locale-aware brand name and text direction. */
export const brandName = (locale = 'ar') =>
  (isBrandLocale(locale) ? brandConfig[locale].name : brandConfig.ar.name);

export const brandDir = (locale = 'ar') =>
  (isBrandLocale(locale) ? brandConfig[locale].direction : brandConfig.ar.direction);

/** The alternate-language spelling, useful for compact brand lockups. */
export const brandAltName = (locale = 'ar') => brandName(locale === 'en' ? 'ar' : 'en');

/** Directional logo files retained for existing integrations. */
export const brandLogoUrl = (locale = 'ar') => {
  const logo = siteConfig.logo || {};
  return logo[locale] || logo.ar || null;
};

/** Shared icon mark. */
export const brandMarkUrl = () => siteConfig.logo?.mark || null;

/** Accessible home-link text follows the active language. */
export const brandLogoAlt = (locale = 'ar') =>
  locale === 'en' ? `${brandName(locale)} — home` : `${brandName(locale)} — الصفحة الرئيسية`;
